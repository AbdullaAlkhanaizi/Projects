package goreloaded

import (
	"regexp"
	"strconv"
)

func Hex(text string) string {

	HexPattern, _ := regexp.Compile(`([0-9a-fA-F]+)\s*\(hex\)`)
	if HexPattern.MatchString(text) {
		result := HexPattern.ReplaceAllStringFunc(text, func(Match string) string {
			num := HexPattern.FindStringSubmatch(text)

			if len(num) > 0 {
				n := (num[1])
				number, _ := strconv.ParseInt(n, 16, 64)
				r := (strconv.FormatInt(number, 10))
				return r
			}
			return text
		})
		return result
	}
	return "Invalid input"
}
