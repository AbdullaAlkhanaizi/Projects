package Functions

import (
	"fmt"
	"math"
	"os"
	"sort"
	"strings"

	Static "lem-in/Structs"
)

func BFSDistance(Rooms map[string]Static.Rooms, start, end string) int {

	queue := []Static.Node{{start, 0}}
	visited := make(map[string]bool)
	visited[start] = true

	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		if cur.Room == end {
			return cur.Dist
		}
		for _, nbr := range Rooms[cur.Room].Linkedrooms {
			if !visited[nbr] {
				visited[nbr] = true
				queue = append(queue, Static.Node{nbr, cur.Dist + 1})
			}
		}
	}
	return -1
}

func DFSPaths(Rooms map[string]Static.Rooms, current, end string, path []string, maxEdges int, paths *[][]string) {
	if len(path)-1 > maxEdges {
		return
	}
	if current == end && len(path)-1 <= maxEdges {
		p := make([]string, len(path))
		copy(p, path)
		*paths = append(*paths, p)
	}
	for _, nbr := range Rooms[current].Linkedrooms {
		if contains(path, nbr) {
			continue
		}
		newPath := append(path, nbr)
		DFSPaths(Rooms, nbr, end, newPath, maxEdges, paths)
	}
}

func contains(s []string, target string) bool {
	for _, v := range s {
		if v == target {
			return true
		}
	}
	return false
}

func getIntermediate(path string) map[string]bool {
	rooms := strings.Split(path, "->")
	res := make(map[string]bool)
	if len(rooms) <= 2 {
		return res
	}
	for i := 1; i < len(rooms)-1; i++ {
		res[rooms[i]] = true
	}
	return res
}

func isDisjoint(paths []Static.CompleatedPath) bool {
	used := make(map[string]bool)
	for _, p := range paths {
		intermediates := getIntermediate(p.Path)
		for room := range intermediates {
			if used[room] {
				return false
			}
			used[room] = true
		}
	}
	return true
}

func selectOptimalDisjointCombination(candidates []Static.CompleatedPath) []Static.CompleatedPath {
	var bestCombo []Static.CompleatedPath
	bestCount := 0
	bestMaxWeight := math.MaxInt32
	bestTotalWeight := math.MaxInt32

	var current []Static.CompleatedPath

	var dfs func(start int)
	dfs = func(start int) {
		if !isDisjoint(current) {
			return
		}

		if len(current) > 0 {
			currentCount := len(current)
			currentMaxWeight := 0
			currentTotalWeight := 0
			for _, cand := range current {
				if cand.Weight > currentMaxWeight {
					currentMaxWeight = cand.Weight
				}
				currentTotalWeight += cand.Weight
			}

			update := false
			if currentCount > bestCount {
				update = true
			} else if currentCount == bestCount {
				if currentMaxWeight < bestMaxWeight {
					update = true
				} else if currentMaxWeight == bestMaxWeight && currentTotalWeight < bestTotalWeight {
					update = true
				}
			}

			if update {
				bestCount = currentCount
				bestMaxWeight = currentMaxWeight
				bestTotalWeight = currentTotalWeight
				bestCombo = append([]Static.CompleatedPath(nil), current...)
			}
		}

		for i := start; i < len(candidates); i++ {
			current = append(current, candidates[i])
			dfs(i + 1)
			current = current[:len(current)-1]
		}
	}

	dfs(0)
	return bestCombo
}

func FindAntPaths(Rooms map[string]Static.Rooms, start, end string, tolerance int) []Static.CompleatedPath {
	optimal := BFSDistance(Rooms, start, end)
	if optimal < 0 {
		fmt.Println("No path found")
		os.Exit(0)
	}
	maxEdges := optimal + tolerance

	var allPaths [][]string
	DFSPaths(Rooms, start, end, []string{start}, maxEdges, &allPaths)

	var candidates []Static.CompleatedPath
	for _, p := range allPaths {
		if len(p) < 2 {
			continue
		}
		pathStr := strings.Join(p, "->")
		weight := len(p) - 1
		cand := Static.CompleatedPath{Path: pathStr, Weight: weight}
		candidates = append(candidates, cand)
	}

	finalPaths := selectOptimalDisjointCombination(candidates)
	sort.SliceStable(finalPaths, func(i, j int) bool {
		return finalPaths[i].Weight < finalPaths[j].Weight
	})
	return finalPaths
}
