package piscine

func RockAndRoll(n int) string {
	s1 := "rock\n"
	s2 := "roll\n"
	s3 := "rock and roll\n"
	e1 := "error: number is negative\n"
	e2 := "error: non divisible\n"
	if n < 0 {
		return e1
	} else if n%2 == 0 && n%3 == 0 {
		return s3
	} else if n%2 == 0 {
		return s1
	} else if n%3 == 0 {
		return s2
	}
	return e2
}
