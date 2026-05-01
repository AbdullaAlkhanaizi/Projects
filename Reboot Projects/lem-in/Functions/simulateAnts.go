package Functions

import (
	"fmt"
	"sort"
	"strings"

	Static "lem-in/Structs"
)

func SimulateAnts(paths []Static.CompleatedPath, antCount int, Rooms map[string]Static.Rooms, start, end string, lines []string) {
	var simPaths []Static.SimPath
	for _, L := range lines {
		fmt.Println(L)
	}
	fmt.Print("\n")

	for _, cp := range paths {
		roomList := strings.Split(cp.Path, "->")
		if len(roomList) < 2 {
			continue
		}
		if len(roomList) == 2 {

			simPaths = append(simPaths, Static.SimPath{
				Rooms:     roomList,
				Length:    1,
				Assigned:  0,
				Injected:  0,
				Positions: nil,
			})
		} else {

			pipeline := make([]int, len(roomList)-2)
			simPaths = append(simPaths, Static.SimPath{
				Rooms:     roomList,
				Length:    len(roomList) - 1,
				Assigned:  0,
				Injected:  0,
				Positions: pipeline,
			})
		}
	}

	sort.Slice(simPaths, func(i, j int) bool {
		return simPaths[i].Length < simPaths[j].Length
	})

	T := simPaths[0].Length
	for {
		totalCapacity := 0
		for _, sp := range simPaths {
			if T >= sp.Length {
				totalCapacity += T - sp.Length + 1
			}
		}
		if totalCapacity >= antCount {
			break
		}
		T++
	}

	remaining := antCount
	for i := range simPaths {
		if T >= simPaths[i].Length {
			alloc := T - simPaths[i].Length + 1
			if alloc > remaining {
				alloc = remaining
			}
			simPaths[i].Assigned = alloc
			remaining -= alloc
		}
	}

	nextAnt := 1
	finished := 0

	for finished < antCount {
		var moves []string

		for i := range simPaths {
			sp := &simPaths[i]
			if sp.Length == 1 {
				continue
			}
			n := len(sp.Positions)
			if n > 0 && sp.Positions[n-1] != 0 {
				ant := sp.Positions[n-1]
				sp.Positions[n-1] = 0
				finished++
				moves = append(moves, fmt.Sprintf("L%d-%s", ant, sp.Rooms[len(sp.Rooms)-1]))
			}
			for j := n - 1; j > 0; j-- {
				if sp.Positions[j-1] != 0 && sp.Positions[j] == 0 {
					ant := sp.Positions[j-1]
					sp.Positions[j] = ant
					sp.Positions[j-1] = 0
					moves = append(moves, fmt.Sprintf("L%d-%s", ant, sp.Rooms[j+1]))
				}
			}
		}

		for i := range simPaths {
			if nextAnt > antCount {
				break
			}
			sp := &simPaths[i]
			if sp.Injected < sp.Assigned {
				if sp.Length == 1 {
					moves = append(moves, fmt.Sprintf("L%d-%s", nextAnt, sp.Rooms[1]))
					sp.Injected++
					nextAnt++
					finished++
				} else {
					if sp.Positions[0] == 0 {
						moves = append(moves, fmt.Sprintf("L%d-%s", nextAnt, sp.Rooms[1]))
						sp.Positions[0] = nextAnt
						sp.Injected++
						nextAnt++
					}
				}
			}
		}

		if len(moves) > 0 {
			fmt.Println(strings.Join(moves, " "))
		}
	}
}
