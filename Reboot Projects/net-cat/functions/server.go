package functions

import (
	"fmt"
	"net"
	"os"
)

func Server() error {
	port := Port(os.Args)
	if port == "e1" {
		err := fmt.Errorf("[USAGE]: ./TCPChat $port")
		return err
	}
	if port == "e2" {
		err := fmt.Errorf("Ivalid character/s in port")
		return err
	}

	listener, err := net.Listen("tcp", port)
	if err != nil {
		return err
	}
	defer listener.Close()

	fmt.Printf("Server started on port %s\n", port)

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("Error accepting connection:", err)
			continue
		}

		go NewConnection(conn)
	}
}
