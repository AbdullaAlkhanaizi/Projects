package piscine

func IsNumeric(s string) bool {
	x := 0
	for i := 0; i < len(s); i++ {
		if s[i] >= '0' && s[i] <= '9' {
			x++
		}
	}
	if x == len(s) {
		return true
	}
	return false
}
