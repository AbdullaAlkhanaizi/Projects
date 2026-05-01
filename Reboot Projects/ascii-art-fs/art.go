package main

import (
	"bytes"
	"fmt"
	"os"
	"strings"
)

func Art(Str string, Banner string) {
	str := Str
	for i := 0; i < len(str); i++ {
		if !(str[i] >= 32 && str[i] <= 126) {
			fmt.Println("Invalid character found")
			os.Exit(0)
		}
	}
	banner := Banner
	if str == "" {
		fmt.Println("")
		return
	}
	if str == " " {
		fmt.Println(" ")
		return
	}

	// for singular newline
	if len(str) == 2 && str[0] == 92 && str[1] == 110 {
		fmt.Println()
		os.Exit(0)
	}

	//only space printed
	if str[0:] == " " {
		fmt.Print(" ")
		fmt.Print("(Only space printed)")
		os.Exit(0)
	}

	//need one for more than new line in a row
	if len(str) > 2 && str[0] == 92 && str[1] == 110 {
		for i := 0; i < len(str); i++ {
			if str[i] == 92 && str[i+1] == 110 {
				fmt.Println()
				str = str[i+2:]
			}
		}
	}
	var lines []string
	if banner == "" || banner == "Standard" {
		data, err := os.ReadFile("standard.txt")
		if err != nil {
			fmt.Println(err)
		}
		cleanData := bytes.ReplaceAll(data, []byte("\r"), []byte(""))
		lines = strings.Split(string(cleanData), "\n")
	} else if banner == "Shadow" {
		data, err := os.ReadFile("shadow.txt")
		if err != nil {
			fmt.Println(err)
		}
		cleanData := bytes.ReplaceAll(data, []byte("\r"), []byte(""))
		lines = strings.Split(string(cleanData), "\n")
	} else if banner == "Thinkertoy" {
		data, err := os.ReadFile("thinkertoy.txt")
		if err != nil {
			fmt.Println(err)
		}
		cleanData := bytes.ReplaceAll(data, []byte("\r"), []byte(""))
		lines = strings.Split(string(cleanData), "\n")
	} else {
		fmt.Println("Empty or invalid Banner type argument")
		os.Exit(0)
	}

	liness := strings.Split(str, "\\n")

	for _, line := range liness {
		if line == "" {
			fmt.Print("\n")
			continue
		} else {
			for i := 1; i <= 8; i++ {
				for _, char := range line {
					n := int(char - 32)
					index := (9 * n) + i
					fmt.Print(lines[index])

				}
				fmt.Println()
			}
		}
	}

}
