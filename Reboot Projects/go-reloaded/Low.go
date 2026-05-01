package goreloaded

import (
	"regexp"
	"strconv"
	"strings"
)

func Low(text string) string {
	tolow:= regexp.MustCompile(`(\b(?:\w+\s*)+)\s*\(low, (\d+)\)`)
	low:= regexp.MustCompile(`(\b\w+)\s*(\s*\(low\))+`)

	//for only (low)
	if low.MatchString(text) {

		result1 := low.ReplaceAllStringFunc(text, func(match string) string {
			word := low.FindStringSubmatch(match)

			if len(word) > 0 {
				w := (word[1])
				return strings.ToLower(w)
			}
			return match
		})
		return result1
	}

	result:= tolow.ReplaceAllStringFunc(text, func(s string) string {
		wordMatch:= tolow.FindStringSubmatch(s)
		if len(wordMatch) > 2 {
			words:= wordMatch[1]
			numwords, _ := strconv.Atoi(wordMatch[2])

			wordslist:= strings.Fields(words)
			wordcount:= len(wordslist)

			if numwords < wordcount {
				numwords = wordcount
			}
			for i:= wordcount- numwords; i< wordcount; i++{
				wordslist[i]= strings.ToLower(wordslist[i])
			}
			Lowerwords:= strings.Join(wordslist, " ")
			return Lowerwords
		}
		return s
	})

	return result


}

