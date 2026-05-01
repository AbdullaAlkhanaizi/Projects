package main

import "github.com/01-edu/z01"

type point struct {
	x int
	y int
}

func setPoint(ptr *point) {
	ptr.x = 42
	ptr.y = 21
}

func main() {
	points := &point{}

	setPoint(points)
	a := "x = "
	b := ", y = "
	for _, ch := range a {
		z01.PrintRune(ch)
	}
	IntoRune(points.x)

	for _, ch := range b {
		z01.PrintRune(ch)
	}
	IntoRune(points.y)
	z01.PrintRune('\n')
}

func check(r int) {
	c := '0'

	for i := 1; i <= r%10; i++ {
		c++
	}
	for i := -1; i >= r%10; i-- {
		c++
	}
	if r/10 != 0 {
		check(r / 10)
	}
	z01.PrintRune(c)
	return
}

func IntoRune(n int) {
	check(n)
}
