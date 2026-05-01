package piscine

func Unmatch(a []int) int {
	um := -1
	e := 0
	count := 0
	for i := 0; i < len(a); i++ {
		e = a[i]
		count = 0
		for j := 0; j < len(a); j++ {
			if e == a[j] {
				count++
			}
		}
		if count%2 != 0 {
			um = a[i]
			return um

		}
	}
	return um
}
