package goreloaded

import (
	"regexp"
	"strconv"
)

func Bin(text string) string {

	binPattern, _ := regexp.Compile(`\b([01]+)\s*\(bin\)`)
	if binPattern.MatchString(text) {
		result := binPattern.ReplaceAllStringFunc(text, func(Match string) string {
			num := binPattern.FindStringSubmatch(text)

			if len(num) > 0 {
				n := (num[1])
				number, _ := strconv.ParseInt(n, 2, 64)
				r := (strconv.FormatInt(number, 10))
				return r
			}
			return text
		})
		return result
	}
	return "Invalid input"
}
