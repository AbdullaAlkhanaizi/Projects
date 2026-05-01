package main

import (
	"fmt"
	"goreloaded"
	"os"
	"regexp"
)

func main() {
	// Reading Sample.txt
	str, err := os.ReadFile("sample.txt")
	if err != nil {
		fmt.Print(err)
	}
	text := string(str)
	isValid := regexp.MustCompile(`^[a-zA-Z0-9.,;:!?()'\s]+$`)
	if !(isValid.MatchString(text)) {
		fmt.Println("Invalid input")
		os.Exit(01)
	}
	fmt.Println("text before processing: " + text)
	// end of reading
	// processing (bin) / (hex) / (Cap) / (Low) / (Up) if found in --> text

	binPattern := regexp.MustCompile(`\s*\(bin\)`)
	if binPattern.MatchString(text) {
		text = goreloaded.Bin(text)
	}

	HexPattern, _ := regexp.Compile(`\s*\(hex\)`)
	if HexPattern.MatchString(text) {
		text = goreloaded.Hex(text)
	}

	cap := regexp.MustCompile(`\s*\(cap\)`)
	tocap := regexp.MustCompile(`(\b(?:\w+\s*)+)\s*\(cap, (\d+)\)`)
	if cap.MatchString(text) {
		text = goreloaded.Cap(text)
	}
	if tocap.MatchString(text) {
		text = goreloaded.Cap(text)
	}

	low, _ := regexp.Compile(`\s*\(low\)`)
	tolow := regexp.MustCompile(`(\b(?:\w+\s*)+)\s*\(low, (\d+)\)`)
	if low.MatchString(text) {
		text = goreloaded.Low(text)
	}
	if tolow.MatchString(text) {
		text = goreloaded.Low(text)
	}

	up := regexp.MustCompile(`\s*\(up\)`)
	toUp := regexp.MustCompile(`(\b(?:\w+\s*)+)\s*\(up, (\d+)\)`)
	if up.MatchString(text) {
		text = goreloaded.Up(text)
	}
	if toUp.MatchString(text) {
		text = goreloaded.Up(text)
	}

	// punctuation processing

	slices := []byte(text)

	punctuation := regexp.MustCompile(`[.,;:!?]`)

	if punctuation.MatchString(text) {
		s := ""
		for i := 0; i < len(slices); i++ {
			if i != 0 {
				if (slices[i] == ',' && slices[i-1] == ' ') || (slices[i] == '.' && slices[i-1] == ' ') || (slices[i] == ';' && slices[i-1] == ' ') || (slices[i] == ':' && slices[i-1] == ' ') || (slices[i] == '!' && slices[i-1] == ' ') || (slices[i] == '?' && slices[i-1] == ' ') {
					slices = append(slices[:i-1], slices[i:]...)
					i--
				} else if (slices[i] == ',' && slices[i+1] == ' ') || (slices[i] == '.' && slices[i+1] == ' ') || (slices[i] == ';' && slices[i+1] == ' ') || (slices[i] == ':' && slices[i+1] == ' ') || (slices[i] == '!' && slices[i+1] == ' ') || (slices[i] == '?' && slices[i+1] == ' ') {
					slices = append(slices[:i+1], slices[i+2:]...)
					i--
				}
			}

			// space processing
			if i != len(slices)-1 {
				if slices[i] == ' ' && slices[i+1] == ' ' {
					slices = append(slices[:i], slices[i+1:]...)
				}
			}

			text = string(slices)
		}
		
		for i := 0; i < len(slices); i++ {
			// Append the current character to the result
			s += string(slices[i])
			
			// Check if the current character is a punctuation mark
			if slices[i] == ',' || slices[i] == '.' || slices[i] == '?' || slices[i] == '!' || slices[i] == ';' || slices[i] == ':' {
				// Check if the next character is a letter
				if i+1 < len(slices) && ((slices[i+1] >= 'a' && slices[i+1] <= 'z') || (slices[i+1] >= 'A' && slices[i+1] <= 'Z')) {
					s += " "
				}
			}
		}
		
		text = s
		slices =[]byte (text)
	
	}
	// quote processing
	firstquote := true

	for i := 0; i < len(slices); i++ {
		if slices[i] == '\'' && i != len(slices)-1 && (slices[i+1] >= 'a' && slices[i+1] <= 'z' || slices[i+1] >= 'A' && slices[i+1] <= 'Z') {
			firstquote = false
		} else {
			if slices[i] == '\'' && firstquote {
				firstquote = false
				slices = append(slices[:i+1], slices[i+2:]...)
			} else if slices[i] == '\'' && !firstquote {
				firstquote = true
				slices[i-1] = slices[i]
				slices[i] = ' '
			}
		}
	}
	text = string(slices)
	// processing a --> an
	s := ""
	if len(slices) > 1 {
		for i := 0; i < len(slices); i++ {
			if slices[i] == 'a' || slices[i] == 'A' {

				if (i+1 < len(slices) && slices[i+1] == ' ') &&
					(slices[i+2] == 'a' || slices[i+2] == 'e' || slices[i+2] == 'i' || slices[i+2] == 'o' || slices[i+2] == 'u' || slices[i+2] == 'A' || slices[i+2] == 'E' || slices[i+2] == 'I' || slices[i+2] == 'O' || slices[i+2] == 'U') {
					s += string(slices[i]) + "n"
				} else {
					s += string(slices[i])
				}
			} else {
				s += string(slices[i])
			}
		}
		text = s
	} else {
		fmt.Println("invalid input")
	}
	fmt.Print("text after processing: " + string(text))
	// writing to result.txt
	os.WriteFile("result.txt", []byte(text), 1)
}
