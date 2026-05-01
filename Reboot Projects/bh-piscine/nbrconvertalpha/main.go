package main

import (
	"os"

	"github.com/01-edu/z01"
)

func main() {
	n := os.Args[1:]

	for _, ch := range n {
		for _, r := range ch {
			z01.PrintRune(r)
		}
	}
}

func alpha(n string) string {
	for _, ch := range n {
		if ch > 26 {
			return " "
		}
	}
	if n == "--upper" {
	}

	return n
}
