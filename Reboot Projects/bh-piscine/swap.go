package piscine

func Swap(a *int, b *int) {
	c := 0
	c = *a
	*a = *b
	*b = c
}
