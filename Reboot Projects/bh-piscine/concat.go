package piscine

func Concat(str1 string, str2 string) string {
	newStr := ""
	for i := 0; i < len(str1); i++ {
		newStr += string(str1[i])
	}
	for i := 0; i < len(str2); i++ {
		newStr += string(str2[i])
	}
	return newStr
}
