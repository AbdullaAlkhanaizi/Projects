package piscine

func findnextprime(n int) int {
	if n <= 2 {
		return 2
	}

	isPrime := func(n int) bool {
		if n <= 1 {
			return false
		}
		if n <= 3 {
			return true
		}
		if n%2 == 0 || n%3 == 0 {
			return false
		}
		for i := 5; i*i <= n; i += 6 {
			if n%i == 0 || n%(i+2) == 0 {
				return false
			}
		}
		return true
	}

	if n%2 == 0 {
		n++
	}

	for {
		if isPrime(n) {
			return n
		}
		n += 2
	}
}
