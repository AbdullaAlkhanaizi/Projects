package piscine

func ActiveBits(n int) int {
	num := 0
	bits := []int{}
	for n > 0 {
		if n%2 == 1 {
			bits = append(bits, 1)
		} else {
			bits = append(bits, 0)
		}
		n /= 2
	}

	for _, ch := range bits {
		if ch == 1 {
			num++
		}
	}

	return num
}
