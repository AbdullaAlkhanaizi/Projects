package app

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

func MustOpendb() *sql.DB {
	dbPath := filepath.Join("DB", "forum.db")
	absPath, err := filepath.Abs(dbPath)
	if err != nil {
		log.Fatalf("resolve DB path: %v", err)
	}

	dsn := fmt.Sprintf("file:%s?_foreign_keys=on&_busy_timeout=5000", absPath)

	d, err := sql.Open("sqlite3", dsn)
	if err != nil {
		log.Fatal(err)
	}
	if err := d.Ping(); err != nil {
		log.Fatal(err)
	}

	log.Printf("✅ Using SQLite at: %s", absPath)
	return d
}

// User authentication and session management

// createUser creates a new user in the database
func createUser(ctx context.Context, u User) error {
	_, err := DB.ExecContext(ctx, `
      INSERT INTO users (id,nickname,email,first_name,last_name,age,gender,password_hash,created_at)
      VALUES (?,?,?,?,?,?,?,?, strftime('%s','now'))`,
		u.ID, u.Nickname, u.Email, u.First, u.Last, u.Age, u.Gender, u.PasswordHash)
	return err
}

// authenticateUser verifies user credentials and returns the user
func authenticateUser(ctx context.Context, nickname, email, password string) (User, error) {
	var u User

	err := DB.QueryRowContext(ctx, `
		SELECT id, nickname, email, first_name, last_name, age, gender, password_hash
		FROM users
		WHERE nickname = ? COLLATE NOCASE OR email = ? COLLATE NOCASE
	`, nickname, email).Scan(
		&u.ID, &u.Nickname, &u.Email, &u.First, &u.Last, &u.Age, &u.Gender, &u.PasswordHash)

	if err != nil {
		return u, err
	}

	// Verify password using bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return u, err
	}

	return u, nil
}

// generateSessionToken creates a new session token
func generateSessionToken() string {
	return uuid.New().String()
}

// createSession creates a new session for the user
func createSession(ctx context.Context, userID string, hours int) (string, error) {
	sessionToken := generateSessionToken()
	if sessionToken == "" {
		return "", fmt.Errorf("token generation failed")
	}

	_, err := DB.ExecContext(ctx, `
		INSERT INTO sessions (id, user_id, created_at, expires_at)
		VALUES (?, ?, strftime('%s','now'), strftime('%s','now','+' || ? || ' hours'))`,
		sessionToken, userID, hours)
	return sessionToken, err
}

// getUserBySessionID retrieves a user by their session ID
func getUserBySessionID(ctx context.Context, sessionID string) (User, error) {
	var u User
	err := DB.QueryRowContext(ctx, `
		SELECT u.id, u.nickname, u.email, u.first_name, u.last_name, u.age, u.gender, u.password_hash
		FROM users u
		JOIN sessions s ON u.id = s.user_id
		WHERE s.id = ? AND s.expires_at > strftime('%s','now')`, sessionID).Scan(
		&u.ID, &u.Nickname, &u.Email, &u.First, &u.Last, &u.Age, &u.Gender, &u.PasswordHash)
	return u, err
}

// Requireuser checks if the request has a valid session and returns the user
func Requireuser(w http.ResponseWriter, r *http.Request) (User, bool) {
	c, err := r.Cookie("session")
	if err != nil {
		http.Error(w, "unauth", 401)
		return User{}, false
	}

	u, err := getUserBySessionID(r.Context(), c.Value)
	if err != nil {
		http.Error(w, "unauth", 401)
		return User{}, false
	}

	return u, true
}

// deleteSession removes a session from the database
func deleteSession(ctx context.Context, sessionID string) error {
	_, err := DB.ExecContext(ctx, `DELETE FROM sessions WHERE id = ?`, sessionID)
	return err
}

// deleteAllUserSessions removes all sessions for a specific user
func deleteAllUserSessions(ctx context.Context, userID string) error {
	_, err := DB.ExecContext(ctx, `DELETE FROM sessions WHERE user_id = ?`, userID)
	return err
}

// Private messaging functions

// getOrCreateConversation finds or creates a conversation between two users
func getOrCreateConversation(ctx context.Context, user1ID, user2ID string) (string, error) {
	// Ensure consistent ordering for the unique constraint
	if user1ID > user2ID {
		user1ID, user2ID = user2ID, user1ID
	}

	// Try to find existing conversation
	var conversationID string
	err := DB.QueryRowContext(ctx, `
		SELECT id FROM conversations
		WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
	`, user1ID, user2ID, user2ID, user1ID).Scan(&conversationID)

	if err == nil {
		return conversationID, nil
	}

	// Create new conversation
	conversationID = uuid.New().String()
	_, err = DB.ExecContext(ctx, `
		INSERT INTO conversations (id, user1_id, user2_id, created_at)
		VALUES (?, ?, ?, ?)
	`, conversationID, user1ID, user2ID, time.Now().Unix())

	if err != nil {
		return "", err
	}

	// Initialize conversation members
	_, err = DB.ExecContext(ctx, `
		INSERT INTO conversation_members (conversation_id, user_id)
		VALUES (?, ?), (?, ?)
	`, conversationID, user1ID, conversationID, user2ID)

	return conversationID, err
}

// sendMessage creates a new message in a conversation
func sendMessage(ctx context.Context, conversationID, senderID, content string) (*ChatMessage, error) {
	messageID := uuid.New().String()
	now := time.Now().Unix()

	_, err := DB.ExecContext(ctx, `
		INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, messageID, conversationID, senderID, content, now)

	if err != nil {
		return nil, err
	}

	// Get sender info for the response
	var sender User
	err = DB.QueryRowContext(ctx, `
		SELECT id, nickname, email, first_name, last_name, age, gender, password_hash
		FROM users WHERE id = ?
	`, senderID).Scan(&sender.ID, &sender.Nickname, &sender.Email, &sender.First, &sender.Last,
		&sender.Age, &sender.Gender, &sender.PasswordHash)

	if err != nil {
		return nil, err
	}

	return &ChatMessage{
		ID:             messageID,
		ConversationID: conversationID,
		SenderID:       senderID,
		Content:        content,
		CreatedAt:      now,
		Sender:         PublicUser(sender),
	}, nil
}

// getMessages retrieves messages for a conversation with pagination
func getMessages(ctx context.Context, conversationID string, limit int, offset int) ([]ChatMessage, error) {
	rows, err := DB.QueryContext(ctx, `
		SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
		       u.id, u.nickname, u.email, u.first_name, u.last_name, u.age, u.gender
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		WHERE m.conversation_id = ? AND m.deleted_at IS NULL
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?
	`, conversationID, limit, offset)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var msg ChatMessage
		var user User
		err := rows.Scan(&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Content, &msg.CreatedAt,
			&user.ID, &user.Nickname, &user.Email, &user.First, &user.Last, &user.Age, &user.Gender)
		if err != nil {
			return nil, err
		}
		msg.Sender = PublicUser(user)
		messages = append(messages, msg)
	}

	// Reverse to get chronological order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

// getMessagesBetweenUsers retrieves messages between two users directly with pagination
func getMessagesBetweenUsers(ctx context.Context, user1ID, user2ID string, limit int, offset int) ([]ChatMessage, error) {
	log.Printf("🔍 Querying messages between users %s and %s", user1ID, user2ID)

	rows, err := DB.QueryContext(ctx, `
		SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
		       u.id, u.nickname, u.email, u.first_name, u.last_name, u.age, u.gender
		FROM messages m
		JOIN users u ON m.sender_id = u.id
		JOIN conversations c ON m.conversation_id = c.id
		WHERE ((c.user1_id = ? AND c.user2_id = ?) OR (c.user1_id = ? AND c.user2_id = ?))
		  AND m.deleted_at IS NULL
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?
	`, user1ID, user2ID, user2ID, user1ID, limit, offset)

	if err != nil {
		log.Printf("❌ Database query error: %v", err)
		return nil, err
	}
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var msg ChatMessage
		var user User
		err := rows.Scan(&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Content, &msg.CreatedAt,
			&user.ID, &user.Nickname, &user.Email, &user.First, &user.Last, &user.Age, &user.Gender)
		if err != nil {
			log.Printf("❌ Row scan error: %v", err)
			return nil, err
		}
		msg.Sender = PublicUser(user)
		messages = append(messages, msg)
	}

	// Reverse to get chronological order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	log.Printf("✅ Found %d messages between users %s and %s", len(messages), user1ID, user2ID)
	return messages, nil
}

// getUserConversations gets all conversations for a user, ordered by last message
func getUserConversations(ctx context.Context, userID string) ([]Conversation, error) {
	rows, err := DB.QueryContext(ctx, `
		SELECT DISTINCT c.id, c.user1_id, c.user2_id, c.created_at,
		       CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
		       u.nickname, u.first_name, u.last_name
		FROM conversations c
		JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
		WHERE c.user1_id = ? OR c.user2_id = ?
		ORDER BY c.created_at DESC
	`, userID, userID, userID, userID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []Conversation
	for rows.Next() {
		var conv Conversation
		var otherUserID, nickname, firstName, lastName string
		err := rows.Scan(&conv.ID, &conv.User1ID, &conv.User2ID, &conv.CreatedAt,
			&otherUserID, &nickname, &firstName, &lastName)
		if err != nil {
			return nil, err
		}

		// Set the other user info
		conv.OtherUser = map[string]interface{}{
			"id":        otherUserID,
			"nickname":  nickname,
			"firstName": firstName,
			"lastName":  lastName,
		}

		conversations = append(conversations, conv)
	}

	return conversations, nil
}

// setSessionCookie sets the session cookie
func setSessionCookie(w http.ResponseWriter, sessionID string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   maxAge,
	})
}

// PublicUser returns a Public representation of a user (without sensitive data)
func PublicUser(u User) map[string]any {
	return map[string]any{
		"id":        u.ID,
		"nickname":  u.Nickname,
		"email":     u.Email,
		"firstName": u.First,
		"lastName":  u.Last,
		"age":       u.Age,
		"gender":    u.Gender,
	}
}

// Post and comment database operations

// categoriesForPost retrieves categories for a specific post
func categoriesForPost(ctx context.Context, postID string) ([]Category, error) {
	rows, err := DB.QueryContext(ctx, `
		SELECT c.id, c.name
		FROM categories c
		JOIN post_categories pc ON c.id = pc.category_id
		WHERE pc.post_id = ?`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var cat Category
		if err := rows.Scan(&cat.ID, &cat.Name); err != nil {
			continue
		}
		categories = append(categories, cat)
	}
	return categories, nil
}

// getCommentsForPost retrieves all comments for a specific post
func getCommentsForPost(ctx context.Context, postID string) ([]Comment, error) {
	rows, err := DB.QueryContext(ctx, `
		SELECT c.id, c.post_id, c.author_id, u.nickname, c.content, c.created_at
		FROM comments c
		JOIN users u ON c.author_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var comment Comment
		if err := rows.Scan(&comment.ID, &comment.PostID, &comment.AuthorID, &comment.Author, &comment.Content, &comment.CreatedAt); err != nil {
			continue
		}
		comments = append(comments, comment)
	}
	return comments, nil
}

// createComment creates a new comment in the database
func createComment(ctx context.Context, postID, authorID, content string) (string, error) {
	commentID := uuid.New().String()
	_, err := DB.ExecContext(ctx, `
		INSERT INTO comments (id, post_id, author_id, content, created_at)
		VALUES (?, ?, ?, ?, strftime('%s','now'))`,
		commentID, postID, authorID, content)
	if err != nil {
		return "", err
	}
	return commentID, nil
}

// createPost creates a new post in the database
func createPost(ctx context.Context, title, content, authorID string, categoryIDs []int) (string, error) {
	postID := uuid.New().String()

	// Insert the post
	_, err := DB.ExecContext(ctx, `
		INSERT INTO posts (id, title, content, author_id, created_at)
		VALUES (?, ?, ?, ?, strftime('%s','now'))`,
		postID, title, content, authorID)
	if err != nil {
		return "", err
	}

	// Insert post-category relationships
	for _, catID := range categoryIDs {
		_, err := DB.ExecContext(ctx, `
			INSERT INTO post_categories (post_id, category_id)
			VALUES (?, ?)`, postID, catID)
		if err != nil {
			return "", err
		}
	}

	return postID, nil
}

// getPostByID retrieves a post by its ID with author information
func getPostByID(ctx context.Context, postID string) (map[string]interface{}, error) {
	var post struct {
		ID        string
		Title     string
		Content   string
		AuthorID  string
		CreatedAt int64
		Author    struct {
			Nickname string
		}
	}

	// Get post with author information
	err := DB.QueryRowContext(ctx, `
		SELECT p.id, p.title, p.content, p.author_id, p.created_at, u.nickname
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.id = ?`, postID).Scan(
		&post.ID, &post.Title, &post.Content, &post.AuthorID, &post.CreatedAt, &post.Author.Nickname)

	if err != nil {
		return nil, err
	}

	// Get categories for this post
	rows, err := DB.QueryContext(ctx, `
		SELECT c.id, c.name
		FROM categories c
		JOIN post_categories pc ON c.id = pc.category_id
		WHERE pc.post_id = ?`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []map[string]interface{}
	for rows.Next() {
		var cat struct {
			ID   int
			Name string
		}
		if err := rows.Scan(&cat.ID, &cat.Name); err != nil {
			continue
		}
		categories = append(categories, map[string]interface{}{
			"id":   cat.ID,
			"name": cat.Name,
		})
	}

	return map[string]interface{}{
		"id":         post.ID,
		"title":      post.Title,
		"content":    post.Content,
		"authorId":   post.AuthorID,
		"createdAt":  post.CreatedAt,
		"author":     map[string]interface{}{"nickname": post.Author.Nickname},
		"categories": categories,
	}, nil
}

// getAllCategories retrieves all categories from the database
func getAllCategories(ctx context.Context) ([]Category, error) {
	rows, err := DB.QueryContext(ctx, "SELECT id, name FROM categories ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var cat Category
		if err := rows.Scan(&cat.ID, &cat.Name); err != nil {
			continue
		}
		categories = append(categories, cat)
	}
	return categories, nil
}
