package piscine

func Atoi(s string) int {
	num := 0
	isneg := false
	cn := 0
	cp := 0
	for i := 0; i < len(s); i++ {
		if s[i] >= '0' && s[i] <= '9' {
			num *= 10
			num += int(s[i] - '0')
		} else if s[0] == '-' && cn == 0 && cp == 0 {
			isneg = true
			cn++
		} else if s[0] == '+' && cp == 0 && cn == 0 {
			isneg = false
			cp++
		} else {
			return 0
		}
	}
	if isneg {
		num *= -1
	}
	return num
}
