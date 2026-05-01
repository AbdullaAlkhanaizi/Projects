package piscine

func BasicAtoi(s string) int {
	num := 0

	for _, ch := range s {
		num *= 10
		num += int(ch - '0')
	}
	return num
}
