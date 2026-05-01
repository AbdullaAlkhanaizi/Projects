package piscine

func PodiumPosition(podium [][]string) [][]string {
	str := podium
	temp := ""
	if len(podium[0][0]) == 0 {
		return str
	}

	for i := 0; i < len(str); i++ {
		for j := i + 1; j < len(str); j++ {
			t1 := str[i][0]
			t2 := str[j][0]
			if t1[0] > t2[0] {
				temp = str[i][0]
				str[i][0] = str[j][0]
				str[j][0] = temp
			}
		}
	}
	return str
}
