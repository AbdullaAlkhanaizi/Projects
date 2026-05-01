package Methods

import (
	"html/template"
	"net/http"
)

func ErrorRender(w http.ResponseWriter, e int, context string) {
	if e == 400 {
		temp, err := template.ParseFiles("EP/400.html")
		if err != nil {
			ErrorRender(w, 500, "")
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		temp.Execute(w, context)
	}

	if e == 404 {
		temp, err := template.ParseFiles("EP/404.html")
		if err != nil {
			ErrorRender(w, 500, "")
			return
		}
		w.WriteHeader(http.StatusNotFound)
		temp.Execute(w, context)
	}

	if e == 500 {
		temp, err := template.ParseFiles("EP/500.html")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		temp.Execute(w, context)
	}
}
