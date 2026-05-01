package piscine

func DescendAppendRange(max, min int) []int {
	num := []int{}
	if max <= min {
		return num
	}
	for i := max; i > min; i-- {
		num = append(num, i)
	}

	return num
}
