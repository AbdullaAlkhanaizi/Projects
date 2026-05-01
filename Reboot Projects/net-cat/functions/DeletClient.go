package functions

import (
	"net"
	"netcatclone/structs"
)

func DeletClient(conn net.Conn) {
	structs.Clientmux.Lock()
	defer structs.Clientmux.Unlock()
	conn.Close()
	delete(structs.Clients, conn)
	structs.ActiveClients--
}
