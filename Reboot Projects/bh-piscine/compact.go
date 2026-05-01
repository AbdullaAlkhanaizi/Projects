package piscine

func Compact(ptr *[]string) int {
	x := 0
	arr := []string{}
	for _, ch := range *ptr {
		if ch != "" {
			arr = append(arr, ch)
			x++
		}
	}
	*ptr = arr
	return x
}
