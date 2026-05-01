package piscine

func JumpOver(str string) string {
	if str == "" {
		return "\n"
	}
	if len(str) < 3 {
		return "\n"
	}
	newstr := ""
	for i := 2; i < len(str); i = i + 3 {
		newstr += string(str[i])
	}
	return newstr + "\n"
}
