package piscine

func StrLen(s string) int {
	r := []rune(s)
	count := 0
	for _, ch := range r {
		count++
		ch++
	}
	return count
}
