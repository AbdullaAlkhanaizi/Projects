package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	app "real-time-forum/GO"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// Global variables
var (
	Port = ":8080"
	db   *sql.DB
	hub  *app.Hub
)

func main() {
	db = app.MustOpendb()
	defer db.Close()

	jsFS := http.FileServer(http.Dir("./JS"))
	http.Handle("/JS/", http.StripPrefix("/JS/", jsFS))

	staticFS := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", staticFS))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Handle API routes that don't exist
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":  "API endpoint not found",
				"path":   r.URL.Path,
				"method": r.Method,
				"status": 404,
			})
			return
		}

		// For all other routes, serve the main app (SPA routing)
		http.ServeFile(w, r, "./static/index.html")
	})

	// Initialize WebSocket hub for private messaging
	hub = app.NewHub()
	go hub.Run()

	app.InitDB(db)
	app.InitHub(hub)

	S := &app.Server{DB: db, Hub: hub}

	// Public endpoints
	http.HandleFunc("/api/signup", app.Ratelimitmiddleware(5, time.Minute, app.HandleRegister))
	http.HandleFunc("/api/login", app.Ratelimitmiddleware(5, time.Minute, app.HandleLogin))

	// Protected endpoints (require auth)
	http.Handle("/api/logout", app.AuthMiddleware(http.HandlerFunc(app.HandleLogout)))
	http.Handle("/api/me", app.AuthMiddleware(http.HandlerFunc(app.HandleMe)))
	http.Handle("/api/categories", app.AuthMiddleware(http.HandlerFunc(app.HandleListCategories)))
	http.Handle("/api/posts/", app.AuthMiddleware(http.HandlerFunc(S.PostsSubtree)))
	http.Handle("/api/users", app.AuthMiddleware(http.HandlerFunc(app.HandleGetAllUsers(db))))
	http.Handle("/ws", app.AuthMiddleware(http.HandlerFunc(app.HandleWebSocket)))
	http.Handle("/api/online-users", app.AuthMiddleware(http.HandlerFunc(app.HandleGetOnlineUsers)))
	http.Handle("/api/messages/send", app.AuthMiddleware(app.Ratelimitmiddleware(30, time.Minute, app.HandleSendMessage)))
	http.Handle("/api/conversations", app.AuthMiddleware(http.HandlerFunc(app.HandleGetConversations)))
	http.Handle("/api/messages", app.AuthMiddleware(http.HandlerFunc(app.HandleGetMessages)))
	http.Handle("/api/user-messages", app.AuthMiddleware(http.HandlerFunc(app.HandleGetUserMessages)))

	// Static files, also wrapped in middleware (except login.html)

	// Debug endpoint
	http.HandleFunc("/api/debug/session", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		user, ok := app.Requireuser(w, r)
		if !ok {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"authenticated": false,
				"error":         "No valid session",
			})
			return
		}

		tc, tuc := hub.Stats()
		json.NewEncoder(w).Encode(map[string]any{
			"authenticated":    true,
			"user":             app.PublicUser(user),
			"onlineUsers":      hub.GetOnlineUsers(),
			"totalClients":     tc,
			"totalUserClients": tuc,
			"hubStatus":        "active",
		})

	})

	http.Handle("/api/posts", app.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			app.HandleListPosts(w, r)
		case http.MethodPost:
			if app.CheckRateLimit(r, 10, time.Minute) {
				http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
				return
			}
			app.HandleCreatePost(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})))

	fmt.Printf("server started on %s\n", Port)
	fmt.Printf("https://localhost%s\n", Port)
	if err := http.ListenAndServeTLS(Port, "Security/cert.pem", "Security/key.pem", nil); err != nil {
		fmt.Println("Error starting server:", err)
		os.Exit(1)
	}
}
