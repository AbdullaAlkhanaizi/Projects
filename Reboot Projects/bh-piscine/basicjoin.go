package piscine

func BasicJoin(elems []string) string {
	conc := ""
	for i := 0; i < len(elems); i++ {
		conc += elems[i]
	}
	return conc
}
