package piscine

func IsLower(s string) bool {
	x := 0
	for i := 0; i < len(s); i++ {
		if (s[i]) >= 'a' && (s[i]) <= 'z' {
			x++
		}
	}
	if x == len(s) {
		return true
	}
	return false
}
