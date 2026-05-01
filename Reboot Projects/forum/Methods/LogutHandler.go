package Methods

import (
	"net/http"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// ✅ Get the session_token cookie
	cookie, err := r.Cookie("session_token")
	if err == nil && cookie.Value != "" {
		// ✅ Delete from coockies table
		db.Exec("DELETE FROM coockies WHERE session_token = ?", cookie.Value)
	}

	// ✅ Delete session_token cookie from browser
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1, // expires immediately
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})

	// ✅ Redirect to homepage as guest
	http.Redirect(w, r, "/homepage", http.StatusSeeOther)
}
