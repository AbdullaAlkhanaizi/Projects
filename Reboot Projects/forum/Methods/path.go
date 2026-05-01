package Methods

import (
	"net/http"
)

func Path(w http.ResponseWriter, r *http.Request) {

	if r.URL.Path != "/" &&
		r.URL.Path != "/login" &&
		r.URL.Path != "/register" &&
		r.URL.Path != "/homepage" &&
		r.URL.Path != "/loginhandler" &&
		r.URL.Path != "/NewDisscution" &&
		r.URL.Path != "/comment" &&
		r.URL.Path != "/reaction" &&
		r.URL.Path != "/comment-reaction" &&
		r.URL.Path != "/logout" {
		ErrorRender(w, 404, "")
		return
	} else {
		Homepage(w, r)
	}
}
