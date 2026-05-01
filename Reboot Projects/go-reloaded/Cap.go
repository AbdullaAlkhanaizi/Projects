package goreloaded

import (
	"regexp"
	"strconv"
	"strings"
)

func Cap(text string) string {
	tocap := regexp.MustCompile(`(\b(?:\w+\s*)+)\s*\(cap, (\d+)\)`)
	cap := regexp.MustCompile(`(\b\w+)\s*(\s*\(cap\))+`)

	//for only (cap)
	if cap.MatchString(text) {
		result1 := cap.ReplaceAllStringFunc(text, func(s string) string {
			word := cap.FindStringSubmatch(s)
			if len(word) > 0 {
				s := word[1]
				Title := strings.Title(s)
				return Title
			}
			return s
		})
		return result1
	} else {

		//for (cap, n)
		result := tocap.ReplaceAllStringFunc(text, func(match string) string {
			words := tocap.FindStringSubmatch(text)

			if len(words) > 2 {
				w := words[1]
				numwords, _ := strconv.Atoi(words[2])

				wordslist := strings.Fields(w)
				wordCount := len(wordslist)

				if numwords > wordCount {
					numwords = wordCount
				}

				for i := wordCount - numwords; i < wordCount; i++ {
					wordslist[i] = strings.Title(wordslist[i])
				}
				capwords := strings.Join(wordslist, " ")
				return capwords
			}
			return match
		})
		return result
	}
}
