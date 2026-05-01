package piscine

func IsPrintable(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] >= ' ' && s[i] <= '~' {
			continue
		} else {
			return false
		}
	}
	return true
}
