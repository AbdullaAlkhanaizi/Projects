package piscine

import "github.com/01-edu/z01"

func PrintComb2() {
	for i := '0'; i <= '9'; i++ {
		for j := '0'; j <= '9'; j++ {
			for o := '0'; o <= '9'; o++ {
				for p := '0'; p <= '9'; p++ {
					if i < o || i == o && j < p {
						if i == '9' && j == '8' && o == '9' && p == '9' {
							z01.PrintRune(i)
							z01.PrintRune(j)
							z01.PrintRune(' ')
							z01.PrintRune(o)
							z01.PrintRune(p)
							z01.PrintRune('\n')
							return
						}
						z01.PrintRune(i)
						z01.PrintRune(j)
						z01.PrintRune(' ')
						z01.PrintRune(o)
						z01.PrintRune(p)
						z01.PrintRune(',')
						z01.PrintRune(' ')
					}
				}
			}
		}
	}
}
