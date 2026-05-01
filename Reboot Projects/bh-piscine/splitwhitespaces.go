package piscine

func SplitWhiteSpaces(s string) []string {
	str := []string{}
	temp := ""
	for i := 0; i < len(s); i++ {
		if s[i] != ' ' && s[i] != '\n' && s[i] != '\t' {
			temp += string(s[i])
		}
		if (s[i] == ' ' || s[i] == '\n' || s[i] == '\t') || i == len(s)-1 {
			if temp == "" {
				continue
			}
			str = append(str, string(temp))
			temp = ""
		}
	}
	return str
}
