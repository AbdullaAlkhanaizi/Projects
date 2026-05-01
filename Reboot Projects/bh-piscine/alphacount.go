package piscine

func AlphaCount(s string) int {
	count := 0
	for i := 0; i < len(s); i++ {
		if int(s[i]) >= 65 && int(s[i]) <= 90 {
			count++
		}
		if int(s[i]) >= 97 && int(s[i]) <= 122 {
			count++
		}
	}
	return count
}
