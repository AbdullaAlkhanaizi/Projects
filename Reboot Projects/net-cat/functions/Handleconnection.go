package functions

import (
	"bufio"
	"fmt"
	"net"
	"netcatclone/structs"
	"strings"
	"time"
)

func HandleConnection(conn net.Conn, reader bufio.Reader) {
	client, exists := structs.Clients[conn]
	if !exists {
		return
	}

	for {
		Prompt := fmt.Sprintf("[%s] [%s]: ", time.Now().Format("2006-01-02 15:04:05"), client.Name)
		conn.Write([]byte(Prompt))

		userInput, err := reader.ReadString('\n')
		if err != nil {
			break
		}

		userInput = strings.TrimSpace(userInput)
		if userInput == "" {
			continue
		}

		if !(ValidInput(userInput)) {
			conn.Write([]byte("Invalid input. Please try again.\n"))
			continue
		}

		if userInput == "/leave" {
			break
		}

		clientMessage := fmt.Sprintf("%s%s", Prompt, userInput)

		structs.Clientmux.Lock()
		structs.Messages = append(structs.Messages, clientMessage)
		structs.Clientmux.Unlock()

		Broadcast(clientMessage, conn)
	}

	DeletClient(conn)

	leaveMessage := fmt.Sprintf("%s has left the chat.", client.Name)
	ConnectionMessages(leaveMessage, conn)

}
