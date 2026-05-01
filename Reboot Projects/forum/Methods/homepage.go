package Methods

import (
	"database/sql"
	"forum/Static"
	"html/template"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var db *sql.DB

func Homepage(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("html/homepage.html")
	if err != nil {
		ErrorRender(w, 500, "Template error")
		return
	}

	auth, userID := IsAuthenticated(w, r)

	email := "Guest"
	name := "Guest"

	if auth {
		db.QueryRow("SELECT email FROM users WHERE id = ?", userID).Scan(&email)
		db.QueryRow("SELECT name FROM users WHERE id = ?", userID).Scan(&name)
	} else {
		userID = 0 // guest mode
	}

	// Handle post and comment reactions (only for logged-in users)
	if r.Method == http.MethodPost {
		if userID == 0 {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		switch r.URL.Path {
		case "/reaction":
			postID := r.FormValue("post_id")
			reaction := r.FormValue("reaction")

			if reaction != "like" && reaction != "dislike" {
				ErrorRender(w, 400, "Invalid reaction type")
				return
			}

			var exists string
			err := db.QueryRow("SELECT reaction FROM likes WHERE user_id = ? AND post_id = ?", userID, postID).Scan(&exists)
			if err == sql.ErrNoRows {
				_, err = db.Exec("INSERT INTO likes (user_id, post_id, reaction) VALUES (?, ?, ?)", userID, postID, reaction)
			} else if err == nil {
				_, err = db.Exec("UPDATE likes SET reaction = ? WHERE user_id = ? AND post_id = ?", reaction, userID, postID)
			}
			if err != nil {
				ErrorRender(w, 500, "Database error while updating post reaction")
				return
			}

			http.Redirect(w, r, "/homepage", http.StatusSeeOther)
			return

		case "/comment-reaction":
			commentID := r.FormValue("comment_id")
			reaction := r.FormValue("reaction")

			if reaction != "like" && reaction != "dislike" {
				ErrorRender(w, 400, "Invalid reaction type")
				return
			}

			var exists string
			err := db.QueryRow("SELECT reaction FROM comment_likes WHERE user_id = ? AND comment_id = ?", userID, commentID).Scan(&exists)
			if err == sql.ErrNoRows {
				_, err = db.Exec("INSERT INTO comment_likes (user_id, comment_id, reaction) VALUES (?, ?, ?)", userID, commentID, reaction)
			} else if err == nil {
				_, err = db.Exec("UPDATE comment_likes SET reaction = ? WHERE user_id = ? AND comment_id = ?", reaction, userID, commentID)
			}
			if err != nil {
				ErrorRender(w, 500, "Database error while updating comment reaction")
				return
			}

			http.Redirect(w, r, "/homepage", http.StatusSeeOther)
			return
		}
	}

	categoryNames := map[string]string{
		"1": "History", "2": "News", "3": "Science", "4": "Sport", "5": "Gaming",
	}

	categoryID := r.URL.Query().Get("category")
	filters := r.URL.Query()["filter"]
	activeFilters := map[string]bool{}
	for _, f := range filters {
		activeFilters[f] = true
	}
	if categoryID == "" {
		categoryID = "all"
	}

	query := `
		SELECT p.id, p.title, p.content, p.category_id, u.name, p.created_at,
		COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction = 'like'), 0),
		COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction = 'dislike'), 0)
		FROM posts p
		JOIN users u ON p.user_id = u.id
	`
	conditions := []string{}
	args := []interface{}{}

	if activeFilters["user"] && userID != 0 {
		conditions = append(conditions, "p.user_id = ?")
		args = append(args, userID)
	}
	if activeFilters["liked"] && userID != 0 {
		conditions = append(conditions, "p.id IN (SELECT post_id FROM likes WHERE user_id = ?)")
		args = append(args, userID)
	}
	if categoryID != "all" {
		conditions = append(conditions, "p.category_id LIKE ?")
		args = append(args, "%"+categoryID+"%")
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY p.created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		ErrorRender(w, 500, "Post query failed")
		return
	}
	defer rows.Close()

	var posts []Static.Post
	for rows.Next() {
		var post Static.Post
		var createdAt time.Time
		var categoryStr string
		err := rows.Scan(&post.ID, &post.Title, &post.Content, &categoryStr, &post.Author, &createdAt, &post.LikeCount, &post.DislikeCount)
		if err != nil {
			continue
		}

		post.CreatedAt = createdAt.Format("January 2, 2006 15:04")
		post.CategoryID = strings.Split(categoryStr, ",")
		for _, id := range post.CategoryID {
			if name, ok := categoryNames[id]; ok {
				post.CategoryNames = append(post.CategoryNames, name)
			}
		}

		var comments []Static.Comment
		cRows, err := db.Query(`
			SELECT c.id, c.content, u.name, c.created_at,
			COALESCE((SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND reaction = 'like'), 0),
			COALESCE((SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id AND reaction = 'dislike'), 0)
			FROM comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.post_id = ?
			ORDER BY c.created_at ASC
		`, post.ID)
		if err != nil {
			continue
		}
		for cRows.Next() {
			var comment Static.Comment
			var cTime time.Time
			err := cRows.Scan(&comment.ID, &comment.Content, &comment.Author, &cTime, &comment.LikeCount, &comment.DislikeCount)
			if err != nil {
				continue
			}
			comment.CreatedAt = cTime.Format("January 2, 2006 15:04")
			comments = append(comments, comment)
		}
		cRows.Close()
		post.Comments = comments
		posts = append(posts, post)
	}

	data := struct {
		User           Static.User
		Posts          []Static.Post
		CategoryCounts map[int]int
		ActiveFilters  map[string]bool
		ActiveCategory string
	}{
		User:           Static.User{ID: strconv.Itoa(userID), Email: email, Name: name},
		Posts:          posts,
		ActiveFilters:  activeFilters,
		ActiveCategory: categoryID,
	}

	tmpl.Execute(w, data)
}
	