package piscine

func CollatzCountdown(start int) int {
	count := 0
	if start == 0 || start < 0 {
		return -1
	}
	for start != 1 {
		if start%2 == 0 {
			start /= 2
			count++
		} else if start%2 != 0 {
			start = 3*start + 1
			count++
		}
	}
	return count
}
