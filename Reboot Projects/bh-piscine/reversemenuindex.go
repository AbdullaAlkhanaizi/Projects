package piscine

func ReverseMenuIndex(menu []string) []string {
	str := make([]string, len(menu))
	c := 0
	for i := len(menu) - 1; i >= 0; i-- {
		str[c] = menu[i]
		c++
	}
	return str
}
