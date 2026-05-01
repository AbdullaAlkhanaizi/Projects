package app

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Authentication Handlers

// Handleregister Handles user registration
func HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var in struct {
		Nickname  string `json:"nickname"`
		Email     string `json:"email"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Age       int    `json:"age"`
		Gender    string `json:"gender"`
		Password  string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "bad json", 400)
		return
	}

	// Validate all input fields
	if err := ValidateEmail(in.Email); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := ValidateNickname(in.Nickname); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := ValidateName(in.FirstName, "firstName"); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := ValidateName(in.LastName, "lastName"); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := ValidateAge(in.Age); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := ValidateGender(in.Gender); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := ValidatePassword(in.Password); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	// Sanitize input fields
	in.Email = strings.TrimSpace(in.Email)
	in.Nickname = strings.TrimSpace(in.Nickname)
	in.FirstName = strings.TrimSpace(in.FirstName)
	in.LastName = strings.TrimSpace(in.LastName)
	in.Gender = strings.TrimSpace(in.Gender)

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "hash failed", 500)
		return
	}

	u := User{
		ID:           uuid.New().String(),
		Nickname:     in.Nickname,
		Email:        in.Email,
		First:        in.FirstName,
		Last:         in.LastName,
		Age:          in.Age,
		Gender:       in.Gender,
		PasswordHash: string(hash),
	}
	if err := createUser(r.Context(), u); err != nil {
		log.Printf("❌ Failed to create user %s: %v", u.Nickname, err)
		http.Error(w, "register failed", 400)
		return
	}

	log.Printf("✅ User %s (%s) registered successfully", u.Nickname, u.ID)

	// Implement single session per user - delete any existing sessions
	log.Printf("🔐 Deleting any existing sessions for new user %s", u.Nickname)
	deleteAllUserSessions(r.Context(), u.ID)

	// Create new session
	sessionToken, err := createSession(r.Context(), u.ID, 24*7)
	if err != nil {
		log.Printf("Failed to create session: %v", err)
		http.Error(w, "Server Error", 500)
		return
	}
	setSessionCookie(w, sessionToken, 3600*24*7)
	log.Printf("🔐 Created session for new user %s (%s)", u.Nickname, u.ID)

	json.NewEncoder(w).Encode(map[string]any{"user": PublicUser(u)})
}

// HandleLogin Handles user login
func HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	var in struct {
		Nickname string `json:"nickname"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "bad json", 400)
		return
	}
	// Validate input fields
	if err := ValidateEmail(in.Email); err != nil {
		in.Nickname = strings.TrimSpace(in.Email)

	} else {
		in.Email = strings.TrimSpace(in.Email)
	}
	if in.Password == "" {
		http.Error(w, "password is required", 400)
		return
	}
	if ContainsNonPrintable(in.Password) {
		http.Error(w, "password contains invalid characters", 400)
		return
	}

	u, err := authenticateUser(r.Context(), in.Nickname, in.Email, in.Password)
	if err != nil {
		http.Error(w, "login failed", 401)
		return
	}

	// Implement single session per user - delete existing sessions to log out other devices
	log.Printf("🔐 User %s (%s) logging in - enforcing single session", u.Nickname, u.ID)
	deleteAllUserSessions(r.Context(), u.ID)

	// Create new session
	sessionToken, err := createSession(r.Context(), u.ID, 24*7)
	if err != nil {
		log.Printf("Failed to create session: %v", err)
		http.Error(w, "Server Error", 500)
		return
	}
	setSessionCookie(w, sessionToken, 3600*24*7)
	log.Printf("🔐 Created new session for %s (%s)", u.Nickname, u.ID)
	json.NewEncoder(w).Encode(map[string]any{"user": PublicUser(u)})
}

// HandleMe returns the current user's information
func HandleMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	u, ok := Requireuser(w, r)
	if !ok {
		return
	}
	json.NewEncoder(w).Encode(map[string]any{"user": PublicUser(u)})
}

// HandleLogout Handles user logout
func HandleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if c, err := r.Cookie("session"); err == nil {
		deleteSession(r.Context(), c.Value)
	}
	setSessionCookie(w, "", -1)
	json.NewEncoder(w).Encode(map[string]any{"ok": true})
}

// Post and category Handlers

// HandleCreatePost Handles post creation
func HandleCreatePost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	u, ok := Requireuser(w, r)
	if !ok {
		return
	}

	var in struct {
		Title       string `json:"title"`
		Content     string `json:"content"`
		CategoryIDs []int  `json:"categoryIds"`
	}

	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "bad json", 400)
		return
	}

	// Validate input fields
	if err := ValidatePostTitle(in.Title); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := ValidatePostContent(in.Content); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if len(in.CategoryIDs) == 0 {
		http.Error(w, "at least one category is required", 400)
		return
	}
	if len(in.CategoryIDs) > 3 {
		http.Error(w, "maximum 3 categories allowed", 400)
		return
	}

	// Sanitize input
	in.Title = strings.TrimSpace(in.Title)
	in.Content = strings.TrimSpace(in.Content)

	postID, err := createPost(r.Context(), in.Title, in.Content, u.ID, in.CategoryIDs)
	if err != nil {
		http.Error(w, "create post failed", 500)
		return
	}

	// Get the created post with full details for broadcasting
	post, err := getPostByID(r.Context(), postID)
	if err != nil {
		log.Printf("Error getting created post for broadcast: %v", err)
	} else {
		// Broadcast the new post to all connected clients
		HubInstance.BroadcastPostUpdate(map[string]interface{}{
			"action": "new_post",
			"post":   post,
		})
		log.Printf("📢 Broadcasted new post: %s", in.Title)
	}

	json.NewEncoder(w).Encode(map[string]any{"ok": true, "postId": postID})
}

// HandleListCategories returns all categories
func HandleListCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	categories, err := getAllCategories(r.Context())
	if err != nil {
		http.Error(w, "DB error", 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"items": categories})
}

// HandleListPosts returns a list of posts
func HandleListPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	rows, err := DB.Query(`
		SELECT p.id, p.title, p.content, p.created_at, u.nickname
		FROM posts p
		JOIN users u ON p.author_id = u.id
		ORDER BY p.created_at DESC
		LIMIT ?`, limit)
	if err != nil {
		http.Error(w, "DB err", 500)
		return
	}
	defer rows.Close()

	var items []PostItem
	for rows.Next() {
		var p PostItem
		if err := rows.Scan(&p.ID, &p.Title, &p.Content, &p.CreatedAt, &p.Author); err == nil {
			p.Cats, _ = categoriesForPost(r.Context(), p.ID)
			items = append(items, p)
		}
	}
	json.NewEncoder(w).Encode(map[string]any{"items": items})
}

// Server methods for handling post-related routes

// postsSubtree Handles routes under /api/posts/
func (s *Server) PostsSubtree(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/posts/")
	if path == "" {
		http.NotFound(w, r)
		return
	}

	parts := strings.Split(path, "/")
	postID := parts[0]

	if len(parts) == 1 {
		// /api/posts/{id}
		s.HandleGetPost(w, r, postID)
	} else if len(parts) == 2 && parts[1] == "comments" {
		// /api/posts/{id}/comments
		switch r.Method {
		case http.MethodGet:
			s.HandleGetCommentsFor(w, r, postID)
		case http.MethodPost:
			// Rate limit comment creation: 20 comments per minute
			if CheckRateLimit(r, 20, time.Minute) {
				http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
				return
			}
			s.HandleCreateCommentFor(w, r, postID)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	} else {
		http.NotFound(w, r)
	}
}

// HandleGetPost returns a specific post
func (s *Server) HandleGetPost(w http.ResponseWriter, r *http.Request, postID string) {
	w.Header().Set("Content-Type", "application/json")

	var post PostItem
	err := s.DB.QueryRow(`
		SELECT p.id, p.title, p.content, p.created_at, u.nickname
		FROM posts p
		JOIN users u ON p.author_id = u.id
		WHERE p.id = ?`, postID).Scan(&post.ID, &post.Title, &post.Content, &post.CreatedAt, &post.Author)
	if err != nil {
		http.Error(w, "post not found", 404)
		return
	}

	post.Cats, _ = categoriesForPost(r.Context(), post.ID)
	json.NewEncoder(w).Encode(post)
}

// HandleGetCommentsFor returns comments for a specific post
func (s *Server) HandleGetCommentsFor(w http.ResponseWriter, r *http.Request, postID string) {
	w.Header().Set("Content-Type", "application/json")

	comments, err := getCommentsForPost(r.Context(), postID)
	if err != nil {
		http.Error(w, "DB error", 500)
		return
	}

	json.NewEncoder(w).Encode(comments)
}

// HandleCreateCommentFor creates a comment for a specific post
func (s *Server) HandleCreateCommentFor(w http.ResponseWriter, r *http.Request, postID string) {
	user, ok := Requireuser(w, r)
	if !ok {
		return
	}

	var in struct {
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "bad json", 400)
		return
	}

	// Validate comment content
	if err := ValidateComment(in.Content); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	// Sanitize input
	in.Content = strings.TrimSpace(in.Content)

	commentID, err := createComment(r.Context(), postID, user.ID, in.Content)
	if err != nil {
		http.Error(w, "create comment failed", 500)
		return
	}

	// Broadcast the new comment to all connected clients
	commentData := map[string]interface{}{
		"action":    "new_comment",
		"commentId": commentID,
		"postId":    postID,
		"content":   in.Content,
		"author":    map[string]interface{}{"nickname": user.Nickname},
		"createdAt": time.Now().Unix(),
	}
	HubInstance.BroadcastCommentUpdate(commentData)
	log.Printf("📢 Broadcasted new comment on post: %s", postID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"ok": true, "commentId": commentID})
}

// Private messaging Handlers

// HandleSendMessage Handles sending a private message
func HandleSendMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	user, ok := Requireuser(w, r)
	if !ok {
		return
	}

	var req struct {
		ToUserID string `json:"toUserId"`
		Content  string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad json", 400)
		return
	}

	// Validate input fields
	if req.ToUserID == "" {
		http.Error(w, "recipient user ID is required", 400)
		return
	}
	if err := ValidateMessage(req.Content); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	// Sanitize input
	req.Content = strings.TrimSpace(req.Content)

	// Get or create conversation
	conversationID, err := getOrCreateConversation(r.Context(), user.ID, req.ToUserID)
	if err != nil {
		log.Printf("Error creating conversation: %v", err)
		http.Error(w, "failed to create conversation", 500)
		return
	}

	// Send message
	message, err := sendMessage(r.Context(), conversationID, user.ID, req.Content)
	if err != nil {
		log.Printf("Error sending message: %v", err)
		http.Error(w, "failed to send message", 500)
		return
	}

	// Send via WebSocket to recipient if online
	HubInstance.SendPrivateMessage(user.ID, req.ToUserID, message)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": message,
	})
}

// HandleGetConversations gets all conversations for the current user
func HandleGetConversations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	user, ok := Requireuser(w, r)
	if !ok {
		return
	}

	conversations, err := getUserConversations(r.Context(), user.ID)
	if err != nil {
		log.Printf("Error getting conversations: %v", err)
		http.Error(w, "failed to get conversations", 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"conversations": conversations,
	})
}

// HandleGetMessages gets messages for a specific conversation
func HandleGetMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	_, ok := Requireuser(w, r)
	if !ok {
		return
	}

	conversationID := r.URL.Query().Get("conversationId")
	if conversationID == "" {
		http.Error(w, "missing conversationId", 400)
		return
	}

	// TODO: Verify user has access to this conversation

	// Get pagination parameters from query string
	limit := 50 // Default to 50 messages (much more reasonable)
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	log.Printf("📨 Fetching messages for conversation %s with limit=%d, offset=%d", conversationID, limit, offset)

	messages, err := getMessages(r.Context(), conversationID, limit, offset)
	if err != nil {
		log.Printf("Error getting messages: %v", err)
		http.Error(w, "failed to get messages", 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"messages": messages,
	})
}

// HandleGetUserMessages gets messages between current user and another user directly
func HandleGetUserMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	user, ok := Requireuser(w, r)
	if !ok {
		return
	}

	otherUserID := r.URL.Query().Get("userId")
	if otherUserID == "" {
		http.Error(w, "missing userId", 400)
		return
	}

	// Get pagination parameters
	limit := 50 // Default to 50 messages
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	log.Printf("📨 Fetching messages between users %s and %s with limit=%d, offset=%d", user.ID, otherUserID, limit, offset)

	// Get messages between the two users directly
	messages, err := getMessagesBetweenUsers(r.Context(), user.ID, otherUserID, limit, offset)
	if err != nil {
		log.Printf("Error getting messages between users: %v", err)
		http.Error(w, "failed to get messages", 500)
		return
	}

	log.Printf("✅ Found %d messages between users %s and %s", len(messages), user.ID, otherUserID)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"messages": messages,
	})
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Public routes (allowed without login)
		PublicPaths := []string{
			"/#/login",
			"/api/signup",
			"/api/me", // optional: root page redirecting to login
		}

		// Allow Public routes
		for _, path := range PublicPaths {
			if r.URL.Path == path {
				next.ServeHTTP(w, r)
				return
			}
		}

		// Check session (your existing Requireuser logic)
		_, ok := Requireuser(w, r)
		if !ok {
			http.Redirect(w, r, "/#/login", http.StatusFound) // redirect guest
			return
		}

		// Continue to requested page if authenticated
		next.ServeHTTP(w, r)
	})
}
