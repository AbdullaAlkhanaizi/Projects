package asciiart

func FindIndexNewLine(startindex int, arg string) int {

	for i := startindex + 1; i < len(arg); i++ {
		if arg[i] == 92 && arg[i+1] == 110 {
			return i
		}
	}

	return -1
}
