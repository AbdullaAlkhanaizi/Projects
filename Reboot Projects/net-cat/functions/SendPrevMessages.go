package functions

import (
	"net"
	"netcatclone/structs"
)

func SendPrevMessages(conn net.Conn) {
	structs.Clientmux.Lock()
	for _, msg := range structs.Messages {
		conn.Write([]byte(msg + "\n"))
	}
	structs.Clientmux.Unlock()
}
