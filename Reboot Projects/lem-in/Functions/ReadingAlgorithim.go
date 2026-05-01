package Functions

import (
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
)

func ReadingAlgorithm(str string) {
	patterns := []string{"^\\w+\\s\\d+\\s\\d+$", "^\\w+-\\w+$", "#.*"}
	errm := []string{"ERROR: Invalid data format, wrong room input", "ERROR: Invalid data format, wrong link input"}

	numAnt := 0
	start := ""
	end := ""
	valid := false
	var rooms []string
	var links []string
	Testfile := fmt.Sprintf("./Examples/%s", os.Args[1])
	File, err := os.ReadFile(Testfile)
	if err != nil {
		fmt.Println(err)
		os.Exit(0)
	}

	lines := strings.Split(string(File), "\n")
	for i := 1; i < len(lines); i++ {
		if lines[i] == "" {
			continue
		}
		match, err := regexp.MatchString("^\\d+$", lines[0])
		if err != nil {
			fmt.Println(err)
			os.Exit(0)
		}
		if match {
			numAnt, err = strconv.Atoi(lines[0])
			if err != nil || numAnt < 1 || numAnt > 1000000000 {
				fmt.Println("ERROR : invalid data format, invalid ants number")
				os.Exit(0)
			}
		} else {
			fmt.Println("ERROR : invalid data format")
			os.Exit(0)
		}
		if lines[i] == "##start" && i+1 < len(lines) {
			if start != "" {
				fmt.Println("ERROR : invalid data format")
				os.Exit(0)
			}

			match, err := regexp.MatchString(patterns[0], lines[i+1])
			if err != nil {
				fmt.Println(err)
				os.Exit(0)
			}
			if !match {
				fmt.Println(errm[0])
				os.Exit(0)
			}
			start = lines[i+1]
		} else if lines[i] == "##end" && i+1 < len(lines) {
			if end != "" {
				fmt.Println("ERROR : invalid data format")
				fmt.Println(lines[i])
				os.Exit(0)
			}
			match, err := regexp.MatchString(patterns[0], lines[i+1])
			if err != nil {
				fmt.Println(err)
				os.Exit(0)
			}
			if !match {
				fmt.Println(errm[0], lines[i+1])
				os.Exit(0)
			}
			end = lines[i+1]

		} else {
			valid = false
			for j := 0; j < len(patterns); j++ {
				match, _ := regexp.MatchString(patterns[j], lines[i])
				if match {
					if j == 0 {
						if regexp.MustCompile("^L").MatchString(lines[i]) {
							fmt.Println("ERROR : invalid data format")
							os.Exit(0)
						}
						L := strings.Split(lines[i], " ")
						for k := 0; k < len(rooms); k++ {
							R := strings.Split(rooms[k], " ")
							if L[0] == R[0] {
								fmt.Println("ERROR : invalid data format")
								os.Exit(0)
							}
						}
						rooms = append(rooms, lines[i])
						valid = true

					} else if j == 1 {
						if regexp.MustCompile("^L").MatchString(lines[i]) {
							fmt.Println("ERROR : invalid data format")
							os.Exit(0)
						}
						valid = true
						links = append(links, lines[i])

					} else if j == 2 {
						valid = true

					}
				}
			}
			if !valid {
				fmt.Println("ERROR : invalid data formatffff")
				os.Exit(0)

			}

		}
	}
	if end == "" || start == "" {
		fmt.Println("ERROR : invalid data format, No Start or end detected")
		os.Exit(0)
	}
	if len(links) < 1 || len(rooms) < 0 {
		fmt.Println("ERROR : invalid data format")
		os.Exit(0)
	}
	CoordinatesAlgorithm(numAnt, end, start, links, rooms, lines)
}
