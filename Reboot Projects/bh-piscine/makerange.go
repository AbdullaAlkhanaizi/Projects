package piscine

func MakeRange(min, max int) []int {
	if (min == 0 && max == 0) || (min > max) {
		err := []int(nil)
		return err
	}
	num := make([]int, max-min)

	for i := 0; i < (max - min); i++ {
		num[i] = min + i
	}
	return num
}
