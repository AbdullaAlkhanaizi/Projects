package piscine

func IsUpper(s string) bool {
	x := 0
	for i := 0; i < len(s); i++ {
		if int(s[i]) > 65 && int(s[i]) < 90 {
			x++
		}
	}
	if x >= len(s) {
		return true
	}
	return false
}
