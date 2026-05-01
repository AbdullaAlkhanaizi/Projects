package main

import (
	"fmt"
	"netcatclone/functions"
)

func main() {
	err := functions.Server()
	if err != nil {
		fmt.Println(err)
	}
}
