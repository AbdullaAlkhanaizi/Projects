package goreloaded

import (
	"regexp"
	"strconv"
	"strings"
)

func Up(text string) string {
	toUp := regexp.MustCompile(`(\b(?:\w+\s*)+)\s*\(up, (\d+)\)`)
	up := regexp.MustCompile(`(\b\w+)\s*(\s*\(up\))+`)

	//if only (up)
	if up.MatchString(text) {
		result1 := up.ReplaceAllStringFunc(text, func(s string) string {
			word := up.FindStringSubmatch(s)
			if len(word) > 0 {
				s := word[1]
				r := strings.ToUpper(s)
				return r
			}
			return s
		})
		return result1
	}

	//for (up, n)
	result := toUp.ReplaceAllStringFunc(text, func(match string) string {
		wordMatch := toUp.FindStringSubmatch(match)
		if len(wordMatch) > 2 {
			words := wordMatch[1]
			numWords, _ := strconv.Atoi(wordMatch[2])

			wordList := strings.Fields(words)
			wordCount := len(wordList)

			if numWords > wordCount {
				numWords = wordCount
			}

			for i := wordCount - numWords; i < wordCount; i++ {
				wordList[i] = strings.ToUpper(wordList[i])
			}

			Upperwords := strings.Join(wordList, " ")
			return Upperwords
		}
		return match
	})

	return result
}
