package piscine

func IterativeFactorial(nb int) int {
	if nb < 0 {
		return 0
	}

	fac := 1

	for i := 1; i <= nb; i++ {

		if fac > 9223372036854775807/i {
			return 0
		}

		fac *= i
	}
	return fac
}
