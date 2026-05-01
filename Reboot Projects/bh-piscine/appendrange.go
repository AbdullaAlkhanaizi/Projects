package piscine

func AppendRange(min, max int) []int {
	num := []int{}
	if (min == 0 && max == 0) || (min > max) {
		err := []int(nil)
		return err
	}
	for i := min; i < max; i++ {
		num = append(num, i)
	}
	return num
}
