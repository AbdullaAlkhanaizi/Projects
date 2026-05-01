package piscine

import "github.com/01-edu/z01"

func PrintWordsTables(a []string) {
	for _, i := range a {
		temp := i

		for _, ch := range temp {
			z01.PrintRune(ch)
		}
		z01.PrintRune('\n')
	}
}
