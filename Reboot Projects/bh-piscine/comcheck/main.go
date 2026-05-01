package main

import (
	"fmt"
	"os"
)

func main() {
	args := os.Args[1:]
	for _, ch := range args {
		str := ch
		if str == "01" || str == "galaxy" || str == "galaxy 01" {
			fmt.Println("Alert!!!")
			return
		}
	}
	return
}
