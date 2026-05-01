package piscine

func BasicAtoi2(s string) int {
	num := 0

	for i := 0; i < len(s); i++ {
		if s[0] == 0 {
			return 0
		} else if s[i] == ' ' {
			return 0
		} else if s[i] >= '0' && s[i] <= '9' {
			num *= 10
			num += int(s[i] - '0')
		} else {
			return 0
		}
	}

	return num
}
