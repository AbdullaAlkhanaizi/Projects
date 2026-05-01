package main

import (
	"fmt"
	"os"
)

func main() {
	args := os.Args
	if len(args) <= 1 {
		fmt.Println("File name missing")
		return
	}
	if len(args) > 2 {
		fmt.Println("Too many arguments")
		return
	}
	filename := args[1]

	data := []byte{}
	data, error := os.ReadFile(filename)
	if error != nil {
		fmt.Print(error)
	} else {
		fmt.Print(string(data))
	}
}
