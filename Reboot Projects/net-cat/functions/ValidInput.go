package functions

func ValidInput(input string) bool {
	for _, ch := range input {
		if ch >= 32 && ch <= 126 {
			continue
		} else {
			return false
		}
	}
	return true
}
