package piscine

import "fmt"

func DealAPackOfCards(deck []int) {
	x := 0
	for i := 1; i <= 4; i++ {
		fmt.Printf("Player %d: %d, %d, %d\n", i, deck[x+0], deck[x+1], deck[x+2])
		x += 3
	}
}
