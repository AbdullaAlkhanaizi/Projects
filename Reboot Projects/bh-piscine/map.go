package piscine

func Map(f func(int) bool, a []int) []bool {
	c := []bool{}
	for i := 0; i < len(a); i++ {
		f(a[i])
		c = append(c, f(a[i]))
	}
	return c
}
