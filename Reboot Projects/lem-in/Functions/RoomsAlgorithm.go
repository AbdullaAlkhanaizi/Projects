package Functions

import (
	"fmt"
	Static "lem-in/Structs"
	"os"
	"strings"
)

func RoomsAlgorithm(lines []string, links []string, endRoom string, startRoom string, antNumber int, rooms []string) {
	var L [][]string
	for i := 0; i < len(links); i++ {
		L = append(L, strings.Split(links[i], "-"))
	}
	Rooms := make(map[string]Static.Rooms)
	for i := 0; i < len(L); i++ {
		n0 := L[i][0]
		n1 := L[i][1]

		if _, exists := Rooms[n0]; exists {
			Rooms[n0] = Static.Rooms{
				Linkedrooms: append(Rooms[n0].Linkedrooms, n1),
			}
		} else {
			Rooms[n0] = Static.Rooms{
				Linkedrooms: []string{n1},
			}
		}

		if _, exists := Rooms[n1]; exists {
			Rooms[n1] = Static.Rooms{
				Linkedrooms: append(Rooms[n1].Linkedrooms, n0),
			}
		} else {
			Rooms[n1] = Static.Rooms{
				Linkedrooms: []string{n0},
			}
		}
	}
	for i := 0; i < len(L); i++ {
		if L[i][0] == L[i][1] {
			fmt.Println("ERROR : invalid data format")
			os.Exit(0)
		}
	}
	var S [][]string
	for i := 0; i < len(rooms); i++ {
		S = append(S, strings.Split(rooms[i], " "))
	}
	flag := false
	for _, r := range L {
		flag = false
		for i := 0; i < len(rooms); i++ {
			if r[0] == string(S[i][0]) {
				flag = true
				break
			}
		}
		if !flag {
			fmt.Println("ERROR : invalid data format")
			os.Exit(0)
		}
	}
	flag = false
	for _, r := range L {
		flag = false
		for i := 0; i < len(rooms); i++ {
			if r[1] == string(S[i][0]) {
				flag = true
				break
			}
		}
		if !flag {
			fmt.Println("ERROR : invalid data format")
			os.Exit(0)
		}
	}

	paths := FindAntPaths(Rooms, startRoom, endRoom, 2)

	SimulateAnts(paths, antNumber, Rooms, startRoom, endRoom, lines)
}
