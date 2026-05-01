package app

import "database/sql"

var DB *sql.DB       // set once from main
var HubInstance *Hub // set once from main

func InitDB(d *sql.DB) { DB = d }
func InitHub(h *Hub)   { HubInstance = h }

func (h *Hub) Stats() (totalClients, totalUserClients int) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()
	return len(h.Clients), len(h.UserClients)
}

