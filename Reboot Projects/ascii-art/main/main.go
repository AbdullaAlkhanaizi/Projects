package main

import (
	"asciiart"
	"bytes"
	"fmt"
	"os"
	"strings"
)

func main() {
	// number of arguments
	if os.Args[1] == "" {
		fmt.Print("Empty argument")
		os.Exit(0)
	}
	str := os.Args[1]
	for i := 0; i < len(str); i++ {
		if !(str[i] >= 32 && str[i] <= 126) {
			fmt.Println("Invalid character found")
			os.Exit(0)
		}
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
	data, err := os.ReadFile("../standard.txt")
	//incase of error
	if err != nil {
		fmt.Println(err)
	}
	cleanData := bytes.ReplaceAll(data, []byte("\r"), []byte(""))
	lines := strings.Split(string(cleanData), "\n")
	if err != nil {
		fmt.Println(err)
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
	asciiart.Art(str, lines)

}
