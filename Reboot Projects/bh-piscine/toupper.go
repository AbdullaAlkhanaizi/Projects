package piscine

func ToUpper(s string) string {
	runes := []rune(s)
	for i := 0; i < len(s); i++ {
		if runes[i] >= 'A' && runes[i] <= 'Z' {
			runes[i] += 32
		}
	}
	return string(runes)
}
