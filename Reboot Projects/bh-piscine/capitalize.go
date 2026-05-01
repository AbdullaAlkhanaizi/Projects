package piscine

func Capitalize(s string) string {
	runes := []rune(s)
	length := len(runes)

	for i := 0; i < length; i++ {
		if (runes[i] >= 'A' && runes[i] <= 'Z') || (runes[i] >= 'a' && runes[i] <= 'z') || (runes[i] >= '0' && runes[i] <= '9') {
			if i == 0 || !((runes[i-1] >= 'A' && runes[i-1] <= 'Z') || (runes[i-1] >= 'a' && runes[i-1] <= 'z') || (runes[i-1] >= '0' && runes[i-1] <= '9')) {
				if runes[i] >= 'a' && runes[i] <= 'z' {
					runes[i] -= 32
				}
			} else {
				if runes[i] >= 'A' && runes[i] <= 'Z' {
					runes[i] += 32
				}
			}
		}
	}

	return string(runes)
}
