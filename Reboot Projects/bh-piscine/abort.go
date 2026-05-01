package piscine

func Abort(a, b, c, d, e int) int {
	arr := []int{a, b, c, d, e}
	temp := 0
	for i := 0; i < 5; i++ {
		for j := i + 1; j < 5; j++ {
			if arr[i] < arr[j] {
				temp = arr[i]
				arr[i] = arr[j]
				arr[j] = temp
			}
		}
	}
	return arr[2]
}
