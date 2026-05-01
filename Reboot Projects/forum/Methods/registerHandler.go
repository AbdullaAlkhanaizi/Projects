package Methods

import (
	"fmt"
	"html/template"
	"net/http"
	"regexp"

	"golang.org/x/crypto/bcrypt"
)

func isValidEmail(email string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com)$`)
	return re.MatchString(email)
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		temp, err := template.ParseFiles("html/register.html")
		if err != nil {
			ErrorRender(w, 500, "File not found")
			return
		}
		temp.Execute(w, nil)
		return
	}

	if r.Method == http.MethodPost {
		name := r.FormValue("name")
		email := r.FormValue("email")
		password := r.FormValue("password")

		if !CheckPrintable(name) || !CheckPrintable(email) || !CheckPrintable(password) {
			ErrorRender(w, 400, "Invalid characters detected.")
			return
		}

		// ✅ Email format validation (simple regex)
		emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
		if !emailRegex.MatchString(email) {
			ErrorRender(w, 400, "Invalid email format.")
			return
		}

		// ✅ Hash the password
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), 14)
		if err != nil {
			ErrorRender(w, 500, "Password hashing failed.")
			return
		}

		// ✅ Insert into users table
		_, err = db.Exec("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", name, email, string(hashed))
		if err != nil {
			ErrorRender(w, 500, "User already exists or DB error.")
			fmt.Println("DB Error:", err)
			return
		}

		// Optionally, auto-login the user here

		http.Redirect(w, r, "/", http.StatusSeeOther)
	}
}
