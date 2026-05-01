package main

import (
	"fmt"
	"lem-in/Functions"
	"os"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run main.go [test file name]")
		fmt.Println("Example: go run . test0.txt")
		os.Exit(1)
	}
	Functions.ReadingAlgorithm(os.Args[1])
}
