package piscine

func Split(s, sep string) []string {
	var str []string
	n := len(sep)
	start := 0

	for i := 0; i <= len(s)-n; i++ {
		if s[i:i+n] == sep {
			str = append(str, s[start:i])
			start = i + n
			i = start - 1
		}
	}

	str = append(str, s[start:])

	return str
}
