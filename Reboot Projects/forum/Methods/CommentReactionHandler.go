package Methods

import (
	"database/sql"
	"net/http"
	"strconv"
)

func CommentReactionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorRender(w, 404, "Invalid request method")
		return
	}

	auth, userID := IsAuthenticated(w, r)
	if !auth {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	commentIDStr := r.FormValue("comment_id")
	commentID, err := strconv.Atoi(commentIDStr)
	if err != nil {
		ErrorRender(w, 400, "Invalid comment ID")
		return
	}

	reaction := r.FormValue("reaction")
	if reaction != "like" && reaction != "dislike" {
		ErrorRender(w, 400, "Invalid reaction type")
		return
	}

	var existingReaction string
	err = db.QueryRow("SELECT reaction FROM comment_likes WHERE user_id = ? AND comment_id = ?", userID, commentID).Scan(&existingReaction)

	if err == sql.ErrNoRows {
		_, err = db.Exec("INSERT INTO comment_likes (user_id, comment_id, reaction) VALUES (?, ?, ?)", userID, commentID, reaction)
	} else if err == nil {
		if existingReaction == reaction {
			_, err = db.Exec("DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?", userID, commentID)
		} else {
			_, err = db.Exec("UPDATE comment_likes SET reaction = ? WHERE user_id = ? AND comment_id = ?", reaction, userID, commentID)
		}
	}

	if err != nil {
		ErrorRender(w, 500, "Failed to process reaction")
		return
	}

	http.Redirect(w, r, r.Header.Get("Referer"), http.StatusSeeOther)
}
