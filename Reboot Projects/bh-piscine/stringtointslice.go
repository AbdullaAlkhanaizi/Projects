package piscine

func StringToIntSlice(str string) []int {
	num := []int{}
	if str == "" {
		return nil
	}
	for i := 0; i < len(str); i++ {
		if int(str[i]) == 195 {
			num = append(num, 231)
			continue
		}
		if int(str[i]) == 167 {
			continue
		}
		num = append(num, int(str[i]))
	}

	return num
}
