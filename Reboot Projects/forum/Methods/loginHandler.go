package Methods

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"html/template"
	"log"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func SetDB(database *sql.DB) {
	db = database
}

func generateSessionToken() string {
	token := make([]byte, 16)
	_, err := rand.Read(token)
	if err != nil {
		log.Println("Failed to generate token:", err)
		return ""
	}
	return hex.EncodeToString(token)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		tmpl, err := template.ParseFiles("html/login.html")
		if err != nil {
			ErrorRender(w, 500, "Template Error")
			return
		}
		tmpl.Execute(w, nil)
		return
	}

	if r.Method == http.MethodPost {
		email := strings.TrimSpace(r.FormValue("email"))
		password := strings.TrimSpace(r.FormValue("password"))

		var userID int
		var hashedPassword string

		err := db.QueryRow("SELECT id, password FROM users WHERE email = ? or name= ?", email, email).
			Scan(&userID, &hashedPassword)
		if err != nil {
			log.Println("Login failed: user not found or DB error:", err)
			ErrorRender(w, 400, "Invalid Email or Password")
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
		if err != nil {
			log.Println("Login failed: wrong password:", err)
			ErrorRender(w, 400, "Invalid Email or Password")
			return
		}

		sessionToken := generateSessionToken()
		if sessionToken == "" {
			ErrorRender(w, 500, "Token generation failed")
			return
		}

		// Delete previous session if exists
		db.Exec("DELETE FROM coockies WHERE user_id = ?", userID)

		_, err = db.Exec("INSERT INTO coockies (user_id, session_token) VALUES (?, ?)", userID, sessionToken)
		if err != nil {
			log.Println("Failed to store session token:", err)
			ErrorRender(w, 500, "Server Error")
			return
		}
		http.SetCookie(w, &http.Cookie{
			Name:   "user",
			Value:  "",
			Path:   "/",
			MaxAge: -1,
		})

		http.SetCookie(w, &http.Cookie{
			Name:     "session_token",
			Value:    sessionToken,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,                    
			SameSite: http.SameSiteStrictMode, 
			MaxAge:   86400 * 7,               
		})

		http.Redirect(w, r, "/homepage", http.StatusSeeOther)
	}
}
