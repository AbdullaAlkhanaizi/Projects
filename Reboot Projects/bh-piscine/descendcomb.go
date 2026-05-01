package piscine

import "github.com/01-edu/z01"

func DescendComb() {
	for Q := '9'; Q >= '0'; Q-- {
		for W := '9'; W >= '0'; W-- {
			for E := '9'; E >= '0'; E-- {
				for R := '9'; R >= '0'; R-- {
					if Q > E || Q == E && W > R {
						if Q == '0' && W == '1' && E == '0' && R == '0' {
							z01.PrintRune(Q)
							z01.PrintRune(W)
							z01.PrintRune(' ')
							z01.PrintRune(E)
							z01.PrintRune(R)
							return
						}
						z01.PrintRune(Q)
						z01.PrintRune(W)
						z01.PrintRune(' ')
						z01.PrintRune(E)
						z01.PrintRune(R)
						z01.PrintRune(',')
						z01.PrintRune(' ')
					}
				}
			}
		}
	}
}
