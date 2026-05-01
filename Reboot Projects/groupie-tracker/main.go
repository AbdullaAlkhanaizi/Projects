package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"strconv"
)

type Band struct {
	ID           int      `json:"id"`
	Image        string   `json:"image"`
	Name         string   `json:"name"`
	Members      []string `json:"members"`
	CreationDate int      `json:"creationDate"`
	FirstAlbum   string   `json:"firstAlbum"`
	L            []string
	D            []string
	R            map[string][]string
}

type Locations struct {
	ID       int      `json:"id"`
	Location []string `json:"locations"`
}

type Date struct {
	ID    int      `json:"id"`
	Dates []string `json:"dates"`
}

type Relation struct {
	ID        int                 `json:"id"`
	Relations map[string][]string `json:"datesLocations"`
}

func path(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/detail/" && r.URL.Path != "/404" && r.URL.Path != "/400" && r.URL.Path != "/500" {
		erender(w, "404")
		return
	}
	handler(w)
}

func fetchArtData(url string) ([]Band, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch data1: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}
	var bands []Band
	err = json.Unmarshal(body, &bands)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	return bands, err
}

func fetchLData(url string, bandID int, w http.ResponseWriter) ([]string, error) {
	resp, err := http.Get(fmt.Sprintf("%s/%d", url, bandID))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch locations: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var locations Locations
	err = json.Unmarshal(body, &locations)
	if err != nil {
		erender(w, "500")
		return nil, fmt.Errorf("failed to 2 unmarshal JSON: %v", err)
	}

	return locations.Location, nil
}

func fetchDData(url string, bandID int) ([]string, error) {
	resp, err := http.Get(fmt.Sprintf("%s/%d", url, bandID))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch locations: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var date Date
	err = json.Unmarshal(body, &date)
	if err != nil {
		return nil, fmt.Errorf("failed to 2 unmarshal JSON: %v", err)
	}

	return date.Dates, nil
}

func fetchRData(url string, bandID int, w http.ResponseWriter) (map[string][]string, error) {
	resp, err := http.Get(fmt.Sprintf("%s/%d", url, bandID))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch locations: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var relations Relation
	err = json.Unmarshal(body, &relations)
	if err != nil {
		erender(w, "500")
		return nil, err
	}

	return relations.Relations, nil
}

func Render(w http.ResponseWriter, bands []Band) {
	temp, err := template.ParseFiles("templates/index.html")
	if err != nil {
		erender(w, "500")
		return
	}
	err = temp.Execute(w, bands)
	if err != nil {
		erender(w, "500")
		return
	}
}

func handler(w http.ResponseWriter) {
	artisturl := "https://groupietrackers.herokuapp.com/api/artists"

	bands, err := fetchArtData(artisturl)
	if err != nil {
		fmt.Println("Error fetching data:", err)
		return
	}

	Render(w, bands)
}

func fetchSingleBandData(url string) (Band, error) {
	resp, err := http.Get(url)
	if err != nil {
		return Band{}, fmt.Errorf("failed to fetch band data: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return Band{}, fmt.Errorf("failed to read response body: %v", err)
	}

	var band Band
	err = json.Unmarshal(body, &band)
	if err != nil {
		return Band{}, fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	return band, nil
}

func detailsHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/detail/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		erender(w, "400")
	}

	if id <= 0 || id >= 53 {
		erender(w, "404")
	}
	artisturl := fmt.Sprintf("https://groupietrackers.herokuapp.com/api/artists/%d", id)
	band, err := fetchSingleBandData(artisturl)
	if err != nil {
		erender(w, "500")
	}

	locationurl := "https://groupietrackers.herokuapp.com/api/locations"
	relationsurl := "https://groupietrackers.herokuapp.com/api/relation"
	dateurl := "https://groupietrackers.herokuapp.com/api/dates"

	band.L, err = fetchLData(locationurl, id, w)
	if err != nil {
		fmt.Println("Error fetching locations:", err)
		erender(w, "500")
		return
	}

	band.D, err = fetchDData(dateurl, id)
	if err != nil {
		fmt.Println("Error fetching dates:", err)
		erender(w, "500")
		return
	}

	band.R, err = fetchRData(relationsurl, id, w)
	if err != nil {
		fmt.Println("Error fetching relations:", err)
		erender(w, "500")
		return
	}

	temp, err := template.ParseFiles("templates/detail.html")
	if err != nil {
		erender(w, "500")
		return
	}
	err = temp.Execute(w, band)
	if err != nil {
		erender(w, "500")
		return
	}
}

func erender(w http.ResponseWriter, e string) {
	if e == "400" {
		temp, err := template.ParseFiles("templates/400.html")
		if err != nil {
			erender(w, "500")
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		temp.Execute(w, e)
	}

	if e == "404" {
		temp, err := template.ParseFiles("templates/404.html")
		if err != nil {
			erender(w, "500")
			return
		}
		w.WriteHeader(http.StatusNotFound)
		temp.Execute(w, e)
	}

	if e == "500" {
		temp, err := template.ParseFiles("templates/500.html")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		temp.Execute(w, e)
	}
}

func main() {
	http.HandleFunc("/", path)
	http.HandleFunc("/detail/", detailsHandler)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	port := 8080
	p := strconv.Itoa(port)
	fmt.Printf("server started on port %s"+"\n"+"http://localhost:%s"+"\n", p, p)
	err := http.ListenAndServe(":"+fmt.Sprint(port), nil)
	if err != nil {
		fmt.Println("error starting server: ", err)
		os.Exit(0)
	}
}
