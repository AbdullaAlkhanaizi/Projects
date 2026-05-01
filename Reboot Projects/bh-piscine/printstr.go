package piscine

import "github.com/01-edu/z01"

func PrintStr(s string) {
	r := []rune(s)
	for _, ch := range r {
		z01.PrintRune(ch)
	}
}
