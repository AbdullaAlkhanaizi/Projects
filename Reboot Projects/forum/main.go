package main

import (
	"fmt"
	"forum/Methods"
	"log"
	"net/http"
	"os"
	"strconv"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	Methods.InitDB()
	// InspectDatabase("users.db")

	erro := Methods.SaveTableSchemasToFile("users.db", "schema_output.sql")
	if erro != nil {
		log.Fatalf(" Error: %v", erro)
	}
	var err error
	http.HandleFunc("/", Methods.Path)
	http.HandleFunc("/login", Methods.LoginHandler)
	http.HandleFunc("/register", Methods.RegisterHandler)
	http.HandleFunc("/homepage", Methods.Homepage)
	http.HandleFunc("/loginhandler", Methods.LoginHandler)
	http.HandleFunc("/NewDisscution", Methods.NewDisscutionHandler)
	http.HandleFunc("/comment", Methods.CommentHandler)
	http.HandleFunc("/reaction", Methods.ReactionHandler)
	http.HandleFunc("/comment-reaction", Methods.CommentReactionHandler)
	http.HandleFunc("/logout", Methods.LogoutHandler)

	// Prevent listing style directory
	http.HandleFunc("/style/", func(w http.ResponseWriter, r *http.Request) {
		// Block access to "/style" root directory exactly
		if r.URL.Path == "/style/" || r.URL.Path == "/style" {
			Methods.ErrorRender(w, 404, "NIce try ^_^")
			return
		}

		// Serve static files safely
		http.StripPrefix("/style/", http.FileServer(http.Dir("style"))).ServeHTTP(w, r)
	})

	port := 8082
	p := strconv.Itoa(port)
	fmt.Printf("server started on port %s"+"\n"+"https://localhost:%s"+"\n", p, p)
	// err = http.ListenAndServe(":"+fmt.Sprint(port), nil)
	err = http.ListenAndServeTLS(":"+fmt.Sprint(port), "Security/cert.pem", "Security/key.pem", nil)

	if err != nil {
		fmt.Println("error starting server: ", err)
		os.Exit(0)
	}
}
