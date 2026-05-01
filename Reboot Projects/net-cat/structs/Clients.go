package structs

import "net"

type Client struct {
	Conn net.Conn
	Name string
}

var Clients = make(map[net.Conn]Client)

