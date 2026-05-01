package piscine

func TrimAtoi(s string) int {
	var num int
	var negative bool
	var isValid bool

	for _, ch := range s {
		if ch == '-' && !isValid {
			negative = true
		} else if ch >= '0' && ch <= '9' {
			digit := int(ch - '0')
			num = num*10 + digit
			isValid = true
		}
	}

	if negative {
		num = -num
	}

	return num
}
