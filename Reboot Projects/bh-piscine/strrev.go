package piscine

func StrRev(s string) string {
	r := []rune(s)
	str := ""

	for i := (len(r) - 1); i >= 0; i-- {
		str += string(r[i])
	}
	return str
}
