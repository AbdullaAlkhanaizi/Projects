package main

import (
	"fmt"
	"os"
)

var n int = 9

func main() {
	args := os.Args[1:]

	isValid, board := isValidBoard(args)
	if isValid {
		Print(board)
		fmt.Println(IsValidColumn(board))
	} else {
		fmt.Println("Error")
	}
}

func isValidBoard(args []string) (bool, [][]rune) {
	// less or more than n rows given
	if len(args) != n {
		return false, nil
	}

	// map with valid numbers
	numbers := map[rune]bool{}
	for i := '0'; i <= '9'; i++ {
		numbers[i] = true
	}

	board := make([][]rune, n)
	for r, str := range args {
		board[r] = []rune(str) // assign row

		if len(board[r]) != n {
			return false, nil
		}
		numbersIn := map[rune]bool{}

		for j, n := range board[r] {
			if n == '.' {
				board[r][j] = '0'
			}

			if !numbers[board[r][j]] {
				return false, [][]rune{}
			}

			if board[r][j] != '0' && numbersIn[board[r][j]] {
				return false, [][]rune{}
			} else {
				numbersIn[board[r][j]] = true
			}
		}
	}

	return true, board
}

func IsValidColumn(board [][]rune) bool {
	n := 9
	isfound := false
	x := ' '
	for c := 0; c < n; c++ {
		for r := 0; r < n; r++ {
			if board[r][c] >= '1' && board[r][c] <= '9' {
				x = board[r][c]
				isfound = true
			}
			if isfound {
				for o := r + 1; o < n; o++ {
					if board[o][c] == x {
						return false
					}
				}
				isfound = false
			}
		}
	}
	return true
}

func UsedInRow(board [][]rune, row int, num rune) bool {
	for i := 0; i < n; i++ {
		if board[row][i] == num {
			return true
		}
	}
	return false
}

func UsedInColumn(board [][]rune, column int, num rune) bool {
	for i := 0; i < n; i++ {
		if board[i][column] == num {
			return true
		}
	}
	return false
}

func UsedInBox(board [][]rune, row int, column int, num rune) bool {
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			if board[i+row][j+column] == num {
				return true
			}
		}
	}
	return false
}

func Print(board [][]rune) {
	for i := 0; i < n; i++ {
		for j := 0; j < n; j++ {
			fmt.Print(string(board[i][j]))
			if j < 8 {
				fmt.Print(", ")
			}
		}
		fmt.Println("")
	}
}
