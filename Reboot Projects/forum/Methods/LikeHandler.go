package Methods

import (
	"database/sql"
	"net/http"
	"strconv"
)

func ReactionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	auth, userID := IsAuthenticated(w, r)

	if !auth {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	reaction := r.FormValue("reaction")
	if reaction != "like" && reaction != "dislike" {
		ErrorRender(w, 400, "Invalid reaction type")
		return
	}

	postIDStr := r.FormValue("post_id")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		ErrorRender(w, 400, "Invalid Post ID")
		return
	}

	var existingReaction string
	err = db.QueryRow("SELECT reaction FROM likes WHERE user_id = ? AND post_id = ?", userID, postID).Scan(&existingReaction)

	if err == sql.ErrNoRows {
		_, err = db.Exec("INSERT INTO likes (user_id, post_id, reaction) VALUES (?, ?, ?)", userID, postID, reaction)
	} else if err == nil {
		if existingReaction == reaction {
			_, err = db.Exec("DELETE FROM likes WHERE user_id = ? AND post_id = ?", userID, postID)
		} else {
			_, err = db.Exec("UPDATE likes SET reaction = ? WHERE user_id = ? AND post_id = ?", reaction, userID, postID)
		}
	}

	if err != nil {
		ErrorRender(w, 500, "Failed to process reaction")
		return
	}

	http.Redirect(w, r, "/homepage", http.StatusSeeOther)
}
