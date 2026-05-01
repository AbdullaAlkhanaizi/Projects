package piscine

func ShoppingListSort(slice []string) []string {
	arr := slice
	temp := ""
	for i := 0; i < len(arr); i++ {
		for j := i + 1; j < len(arr); j++ {
			if len(arr[i]) > len(arr[j]) {
				temp = arr[i]
				arr[i] = arr[j]
				arr[j] = temp
			}
		}
	}
	return arr
}
