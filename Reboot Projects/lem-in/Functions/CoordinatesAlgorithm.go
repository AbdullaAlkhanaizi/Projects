package Functions

import (
	"fmt"
	"os"
	"strings"
)

func CoordinatesAlgorithm(antNumber int, end string, start string, links []string, rooms []string, lines []string) {
	var cords [][]string
	for i := 0; i < len(rooms); i++ {
		cords = append(cords, strings.Split(rooms[i], " "))
	}
	for i := 0; i < len(cords); i++ {
		for j := 0; j < len(cords); j++ {
			if cords[i][1] == cords[j][1] && cords[i][2] == cords[j][2] && cords[i][0] != cords[j][0] {
				fmt.Println("Invalid file format: Duplicate coordinates found")
				os.Exit(0)
			}
		}
	}

	
	temp := strings.Split(start, " ")
	startroom := temp[0]
	temp1 := strings.Split(end, " ")
	endroom := temp1[0]
	
	RoomsAlgorithm(lines, links, endroom, startroom, antNumber, rooms)
}
