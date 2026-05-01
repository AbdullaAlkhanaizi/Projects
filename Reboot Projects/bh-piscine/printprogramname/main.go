package main

import (
	"os"

	"github.com/01-edu/z01"
)

func main() {
	arg := os.Args
	r := []rune(arg[0])
	for i := len(r) - 1; i > 0; i-- {
		if r[i] == 47 {
			for j := i + 1; j < len(r); j++ {
				z01.PrintRune((r[j]))
			}
			z01.PrintRune('\n')
			break
		}
	}
}
