package piscine

func Rot14(s string) string {
	a := []rune(s)
	for i := 0; i < len(s); i++ {
		if a[i] == 'm' || a[i] == 'M' {
			a[i] -= rune(12)
		} else if a[i] >= 'A' && a[i] < 'M' {
			a[i] += rune(14)
		} else if a[i] >= 'N' && a[i] <= 'Z' {
			a[i] -= rune(12)
		} else if a[i] >= 'a' && a[i] < 'm' {
			a[i] += rune(14)
		} else if a[i] >= 'n' && a[i] <= 'z' {
			a[i] -= rune(12)
		}
	}
	return string(a)
}
