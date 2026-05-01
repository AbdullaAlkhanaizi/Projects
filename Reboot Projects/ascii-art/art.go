package asciiart

import (
	"fmt"
	"strings"
)

func Art(arg string, arts []string) {

	lines := strings.Split(arg, "\\n")

	for _, line := range lines {
		if line == "" {
			fmt.Print("\n")
			continue
		} else {
			for i := 1; i <= 8; i++ {
				for _, char := range line {
					n := int(char - 32)
					index := (9 * n) + i
					fmt.Print(arts[index])

				}
				fmt.Println()
			}
		}
	}

}
