package structs

import (
	"sync"
)

var (
	Defaultport = "8989"
	Messages   []string
	Clientmux sync.Mutex
	MaxClients = 10
	ActiveClients = 0
)
