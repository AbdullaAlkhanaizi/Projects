package piscine

func LoafOfBread(str string) string {
	if len(str) == 0 {
		return "\n"
	}
	if len(str) < 5 {
		return "Invalid Output\n"
	}
	newstr := ""
	count := 0
	for i := 0; i < len(str); i++ {
		if str[i] != ' ' {
			if count == 5 {
				newstr += " "
				count = 0

			} else {
				newstr += string(str[i])
				count++
			}
		}
	}
	newstr += "\n"
	return newstr
}
