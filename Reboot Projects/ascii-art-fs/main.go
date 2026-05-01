package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 3 || len(os.Args) > 3{
		fmt.Println("Invalid number of arguments")
		os.Exit(1)
	}
	if os.Args[1]== ""{
		fmt.Println("Strings argument empty")
		os.Exit(1)
	}
	if os.Args[2]== "" {
		fmt.Println("Banner argument empty")
		os.Exit(1)
	}
	
	Art(os.Args[1], os.Args[2])
	
}
