package main

import "github.com/01-edu/z01"

func main() {
	var b int = 122
	var s int = 97

	for b >= s {
		z01.PrintRune(rune(b))
		b--
	}
	z01.PrintRune('\n')
}
