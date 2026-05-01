package functions

import (
	"bufio"
	"fmt"
	"net"
	"netcatclone/structs"
	"strings"
)

func NewConnection(conn net.Conn) {

	structs.Clientmux.Lock()
	if structs.ActiveClients >= structs.MaxClients {
		conn.Write([]byte("Maximum number of clients reached, sorry! \nTry again later.\n"))
		conn.Close()
		return
	}
	structs.ActiveClients++
	structs.Clientmux.Unlock()
	WelcomePrint(conn)

	reader := bufio.NewReader(conn)
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)
	if !(ValidName(name)) {
		conn.Write([]byte("Invalid name"))
		conn.Close()
		return
	}

	structs.Clientmux.Lock()
	structs.Clients[conn] = structs.Client{Conn: conn, Name: name}
	structs.Clientmux.Unlock()

	welcomeMessage := fmt.Sprintf("%s has joined the chat!", name)
	ConnectionMessages(welcomeMessage, conn)

	SendPrevMessages(conn)

	go HandleConnection(conn, *reader)
}
