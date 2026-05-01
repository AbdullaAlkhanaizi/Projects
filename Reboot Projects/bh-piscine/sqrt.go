package piscine

func Sqrt(nb int) int {
	if nb < 0 {
		return 0
	}

	var root int = 0

	for root = 0; root*root <= nb; root++ {
		if root*root == nb {
			return root
		}
	}
	return 0
}
