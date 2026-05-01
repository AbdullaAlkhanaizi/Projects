package Methods

import (
	"html/template"
	"net/http"
	"strconv"
	"strings"
)

func CommentHandler(w http.ResponseWriter, r *http.Request) {
	auth, userID := IsAuthenticated(w, r)

	if !auth {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	if r.Method == http.MethodGet {
		postIDStr := r.URL.Query().Get("post_id")
		postID, err := strconv.Atoi(postIDStr)
		if err != nil {
			ErrorRender(w, 400, "invalid post id")
			return
		}

		row := db.QueryRow("SELECT title, content FROM posts WHERE id = ?", postID)
		var title, content string
		err = row.Scan(&title, &content)
		if err != nil {
			http.Error(w, "Post not found", http.StatusNotFound)
			return
		}

		temp, err := template.ParseFiles("html/comment.html")
		if err != nil {
			http.Error(w, "Failed to load comment page", http.StatusInternalServerError)
			return
		}

		data := struct {
			PostID  int
			Title   string
			Content string
		}{
			PostID:  postID,
			Title:   title,
			Content: content,
		}

		temp.Execute(w, data)
		return
	}

	if r.Method == http.MethodPost {
		postIDStr := r.FormValue("post_id")
		content := r.FormValue("content")

		if !CheckPrintable(content) {
			ErrorRender(w, 400, "Invalid character detected.")
			return
		}

		if postIDStr == "" || content == "" {
			ErrorRender(w, 400, "Empty fields.")
			return
		}

		postID, err := strconv.Atoi(postIDStr)
		if err != nil {
			ErrorRender(w, 400, "Invalid Post ID format.")
			return
		}

		if len(content) > 256 {
			ErrorRender(w, 400, "Comment too long.")
			return
		}

		if strings.TrimSpace(content) == "" {
			ErrorRender(w, 400, "Comment is full of spaces.")
			return
		}

		_, err = db.Exec("INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)", userID, postID, content)
		if err != nil {
			ErrorRender(w, 500, "Faild to insert into database.")
			return
		}

		http.Redirect(w, r, "/homepage", http.StatusSeeOther)
	} else {
		ErrorRender(w, 404, "Invalid request method.")
	}
}
