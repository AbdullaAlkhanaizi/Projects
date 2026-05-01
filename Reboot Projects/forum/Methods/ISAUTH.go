package Methods

import "net/http"

func IsAuthenticated(w http.ResponseWriter, r *http.Request) (bool, int) {
	cookie, err := r.Cookie("session_token")
	if err != nil || cookie.Value == "" {
		return false, 0
	}

	var userID int
	err = db.QueryRow("SELECT user_id FROM coockies WHERE session_token = ?", cookie.Value).Scan(&userID)
	if err != nil {
		// ✅ Remove invalid cookie from browser
		http.SetCookie(w, &http.Cookie{
			Name:     "session_token",
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})
		return false, 0
	}

	return true, userID
}

