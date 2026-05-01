package Methods

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strconv"
	"strings"
)

func NewDisscutionHandler(w http.ResponseWriter, r *http.Request) {
	auth, userID := IsAuthenticated(w, r)
	if !auth {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	if r.Method == http.MethodGet {
		temp, err := template.ParseFiles("html/newDiscussion.html")
		if err != nil {
			ErrorRender(w, 500, "Template loading error")
			return
		}

		rows, err := db.Query("SELECT id, name FROM categories")
		if err != nil {
			ErrorRender(w, 500, "Failed to load categories.")
			return
		}
		defer rows.Close()

		type Category struct {
			ID   int
			Name string
		}
		var categories []Category
		for rows.Next() {
			var cat Category
			if err := rows.Scan(&cat.ID, &cat.Name); err != nil {
				continue
			}
			categories = append(categories, cat)
		}

		temp.Execute(w, categories)
		return
	}

	if r.Method == http.MethodPost {
		title := r.FormValue("title")
		content := r.FormValue("content")
		categoryIDs := r.Form["category[]"]

		if strings.TrimSpace(content) == "" {
			ErrorRender(w, 400, "Post is full of spaces.")
			return
		}

		if !CheckPrintable(title) || !CheckPrintable(content) {
			ErrorRender(w, 400, "Invalid character detected.")
			fmt.Println(content, title)
			return
		}

		var validCategories []string
		for _, catID := range categoryIDs {
			catID = strings.TrimSpace(catID)
			if catID == "" {
				continue
			}
			_, err := strconv.Atoi(catID)
			if err != nil {
				ErrorRender(w, 400, "Invalid category ID format.")
				return
			}

			var exists int
			err = db.QueryRow("SELECT COUNT(*) FROM categories WHERE id = ?", catID).Scan(&exists)
			if err != nil || exists == 0 {
				ErrorRender(w, 400, "Selected category does not exist.")
				return
			}

			validCategories = append(validCategories, catID)
		}

		if len(validCategories) == 0 {
			ErrorRender(w, 400, "No valid categories selected.")
			return
		}

		finalCategories := strings.Join(validCategories, ",")

		_, err := db.Exec(`
			INSERT INTO posts (user_id, category_id, title, content, created_at)
			VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
		`, userID, finalCategories, title, content)

		if err != nil {
			log.Println("Database insert error:", err)
			ErrorRender(w, 500, "Failed to save post.")
			return
		}

		http.Redirect(w, r, "/homepage", http.StatusSeeOther)
	}
}
