package piscine

func IsAlpha(s string) bool {
	x := 0
	for i := 0; i < len(s); i++ {
		if s[i] >= 'a' && s[i] <= 'z' || s[i] >= 'A' && s[i] <= 'Z' {
			x++
		}
		if s[i] >= '0' && s[i] <= '9' {
			x++
		}
	}

	if x == len(s) {
		return true
	}
	return false
}
