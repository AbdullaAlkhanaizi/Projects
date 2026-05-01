package main

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"strings"
	"text/template"
)

var text *template.Template

func path(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/ascii-art" && r.URL.Path != "/" && r.URL.Path != "?:" && r.URL.Path != "400" {
		fmt.Printf("%s A 404 error ocurred with the path: %s \n", r.RemoteAddr, r.URL.Path)
		http.Error(w, "page not found", http.StatusNotFound)
		return
	}

	fmt.Printf("Successful connection from %s \n", r.RemoteAddr)

	t, err := template.ParseFiles("templates/index.html")
	if err != nil {
		fmt.Printf("Error parsing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = t.Execute(w, nil)
	if err != nil {
		fmt.Printf("Error executing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

func Handler(w http.ResponseWriter, r *http.Request) {
	var lines []string
	if r.Method == http.MethodPost {

		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Unable to parse form", http.StatusBadRequest)
			return
		}

		inputText := r.FormValue("Textarea")
		if inputText == "" {
			http.Error(w, "Bad Request: Invalid input", http.StatusBadRequest)
			return
		}
		

		inputBannertype := r.FormValue("Banner type")
		if inputBannertype == "" || inputBannertype == "Standard" {
			data, err := os.ReadFile("standard.txt")
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			cleanData := bytes.ReplaceAll(data, []byte("\r"), []byte(""))
			lines = strings.Split(string(cleanData), "\n")
		} else if inputBannertype == "Shadow" {
			data, err := os.ReadFile("shadow.txt")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			cleanData := bytes.ReplaceAll(data, []byte("\r"), []byte(""))
			lines = strings.Split(string(cleanData), "\n")
		} else if inputBannertype == "Thinkertoy" {
			data, err := os.ReadFile("thinkertoy.txt")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			cleanData := bytes.ReplaceAll(data, []byte("\r"), []byte(""))
			lines = strings.Split(string(cleanData), "\n")
		} else {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		}

		output := AsciiArt(w, inputText, lines)

		if output == nil {
			http.Error(w, "Bad Request: Invalid input", http.StatusBadRequest)
		} else {
			text.ExecuteTemplate(w, "index.html", string(output))
		}
	} else {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
	}

}
func handelbadreq(w http.ResponseWriter, r *http.Request) {

	t, err := template.ParseFiles("templates/400.html")
	if err != nil {
		fmt.Printf("Error parsing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = t.Execute(w, nil)
	if err != nil {
		fmt.Printf("Error executing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}
func handelNotFound(w http.ResponseWriter, r *http.Request) {

	t, err := template.ParseFiles("templates/404.html")
	if err != nil {
		fmt.Printf("Error parsing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = t.Execute(w, nil)
	if err != nil {
		fmt.Printf("Error executing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

func main() {

	var err error
	text, err = template.ParseFiles("templates/index.html", "templates/404.html", "templates/400.html")
	if err != nil {
		fmt.Println("Error parsing templates:", err)
		return
	}

	http.HandleFunc("/", path)
	http.HandleFunc("/404", handelNotFound)
	http.HandleFunc("/ascii-art", Handler)
	http.HandleFunc("/400", handelbadreq)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	fmt.Println("Server is running on port 8000...")
	err = http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}

}

func AsciiArt(w http.ResponseWriter, arg string, arts []string) []byte {
	var builder strings.Builder
	normalizedArg := strings.ReplaceAll(arg, "\r\n", "\n")
	normalizedArg = strings.ReplaceAll(normalizedArg, "\r", "\n")

	lines := strings.Split(normalizedArg, "\n")

	for _, line := range lines {
		for i := 1; i <= 8; i++ {
			if line == "" {
				builder.WriteString("\n")
				break
			}
			for _, char := range line {
				if char < 32 || char > 126 {
					return nil
					}
				n := int(char - 32)
				index := (9 * n) + i
				builder.WriteString(arts[index])
			}
			builder.WriteString("\n")
		}
	}
	return []byte(builder.String())
}
