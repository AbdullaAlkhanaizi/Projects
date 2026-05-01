package functions

import (
	"fmt"
	"net"
	"netcatclone/structs"
	"time"
)

func ConnectionMessages(message string, sender net.Conn) {
	structs.Clientmux.Lock()
	defer structs.Clientmux.Unlock()
	for conn, client := range structs.Clients {
		if conn != sender {
			conn.Write([]byte("\n" + message + "\n"))
			fmt.Fprintf(conn, "[%s] [%s]: ", time.Now().Format("2006-01-02 15:04:05"), client.Name)
		}
	}
	fmt.Println(message)
}
