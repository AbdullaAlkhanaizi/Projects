package main

import (
	"os"

	"github.com/01-edu/z01"
)

func main() {
	arg := os.Args

	for i := len(arg) - 1; i > 0; i-- {
		arg := os.Args[i]
		for j := 0; j < len(arg); j++ {
			r := []rune(arg)
			z01.PrintRune(r[j])
		}
		z01.PrintRune('\n')
	}
}
