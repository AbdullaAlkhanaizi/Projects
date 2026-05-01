package functions

import (
	"fmt"
	"io"
	"net"
	"os"
)

func WelcomePrint(conn net.Conn) {
	pingu, err := os.Open("Pinguen.txt")
	if err != nil {
		fmt.Println("Error opening Pinguen.txt:", err)
		return
	}
	defer pingu.Close()
	image, err := io.ReadAll(pingu)
	if err != nil {
		fmt.Println("Error reading Pinguen.txt:", err)
		return
	}
	image = append(image, '\n')
	conn.Write(image)
	conn.Write([]byte("[Enter your name]: "))
}
