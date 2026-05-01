package main

import (
	"os"

	"github.com/01-edu/z01"
)

func even(num int) bool {
	if num%2 == 0 {
		return true
	} else {
		return false
	}
}

func printStr(s string) {
	for _, r := range s {
		z01.PrintRune(r)
	}
	z01.PrintRune('\n')
}

func isEven(nbr int) bool {
	if even(nbr) == true {
		return true
	} else {
		return false
	}
}

func main() {
	lengthOfArg := len(os.Args[1:])
	EvenMsg := "I have an even number of arguments"
	OddMsg := "I have an odd number of arguments"
	if isEven(lengthOfArg) == true {
		printStr(EvenMsg)
	} else {
		printStr(OddMsg)
	}
}
