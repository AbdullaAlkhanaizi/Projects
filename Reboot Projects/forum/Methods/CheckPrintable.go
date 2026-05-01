package Methods

import "unicode"

func CheckPrintable(str string) bool {

	for _, ch := range str {
		if !unicode.IsPrint(ch) && ch != '\n' && ch != '\r' {
			return false
		}
	}
	return true
}
