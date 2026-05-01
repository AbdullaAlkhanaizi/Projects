package app

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow connections from any origin
	},
}

// newHub creates a new WebSocket Hub
func NewHub() *Hub {
	return &Hub{
		Clients:        make(map[*Client]bool),
		UserClients:    make(map[string]*Client),
		Broadcast:      make(chan []byte),
		PrivateMsg:     make(chan *PrivateMessage),
		Register:       make(chan *Client),
		Unregister:     make(chan *Client),
		PendingOffline: make(map[string]*time.Timer),
	}
}

// run starts the Hub's main event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Mutex.Lock()
			h.Clients[client] = true
			h.UserClients[client.userID] = client

			// Cancel any pending offline status for this user (they're reconnecting)
			if timer, exists := h.PendingOffline[client.userID]; exists {
				timer.Stop()
				delete(h.PendingOffline, client.userID)
				log.Printf("🔄 Cancelled pending offline status for reconnecting user: %s", client.username)
			}

			TotalClients := len(h.Clients)
			totalUserClients := len(h.UserClients)
			h.Mutex.Unlock()

			log.Printf("🔗 Client connected: %s (%s). Total Clients: %d, Total user Clients: %d",
				client.username, client.userID, TotalClients, totalUserClients)

			// Send welcome message with current online users to the new client
			h.sendWelcomeMessage(client, DB)

			// Notify all OTHER Clients about user coming online (exclude the new user)
			h.BroadcastUserStatusExcept(client.userID, client.username, "online", client.userID)

		case client := <-h.Unregister:
			h.Mutex.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				delete(h.UserClients, client.userID)
				close(client.send)
			}
			TotalClients := len(h.Clients)
			totalUserClients := len(h.UserClients)
			h.Mutex.Unlock()
			log.Printf("❌ Client disconnected: %s (%s). Total Clients: %d, Total user Clients: %d",
				client.username, client.userID, TotalClients, totalUserClients)

			// Instead of immediately Broadcasting offline status,
			// schedule a delayed offline Broadcast to allow for reconnections
			h.ScheduleOfflineStatus(client.userID, client.username)

		case message := <-h.Broadcast:
			h.Mutex.Lock()
			for client := range h.Clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.Clients, client)
					delete(h.UserClients, client.userID)
				}
			}
			h.Mutex.Unlock()

		case PrivateMsg := <-h.PrivateMsg:
			h.Mutex.Lock()
			if targetClient, ok := h.UserClients[PrivateMsg.ToUserID]; ok {
				select {
				case targetClient.send <- PrivateMsg.Message:
				default:
					close(targetClient.send)
					delete(h.Clients, targetClient)
					delete(h.UserClients, targetClient.userID)
				}
			}
			h.Mutex.Unlock()
		}
	}
}

// BroadcastUserStatus sends user status updates to all Clients
func (h *Hub) BroadcastUserStatus(userID, username, status string) {
	message := Message{
		Type: "user_status",
		Data: map[string]interface{}{
			"userId":   userID,
			"username": username,
			"status":   status,
		},
		Time: time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling user status message: %v", err)
		return
	}

	h.Broadcast <- messageBytes
}

// BroadcastUserStatusExcept sends user status updates to all Clients except the excluded one
func (h *Hub) BroadcastUserStatusExcept(userID, username, status string, excludeUserID string) {
	message := Message{
		Type: "user_status",
		Data: map[string]interface{}{
			"userId":   userID,
			"username": username,
			"status":   status,
		},
		Time: time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling user status message: %v", err)
		return
	}

	// Send to all Clients except the excluded one
	h.Mutex.Lock()
	for client := range h.Clients {
		if client.userID != excludeUserID {
			select {
			case client.send <- messageBytes:
			default:
				close(client.send)
				delete(h.Clients, client)
				delete(h.UserClients, client.userID)
			}
		}
	}
	h.Mutex.Unlock()
}

// sendWelcomeMessage sends a welcome message with all users
func (h *Hub) sendWelcomeMessage(client *Client, DB *sql.DB) {
	allUsers, err := h.GetAllUsersWithStatus(DB)
	if err != nil {
		log.Printf("❌ Failed to get all users for welcome message: %v", err)
		return
	}

	welcomeMsg := Message{
		Type: "welcome",
		Data: map[string]interface{}{
			"message": "Connected to Real-time Forum",
			"users":   allUsers, // <-- send all users
		},
		UserID:   client.userID,
		Username: client.username,
		Time:     time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(welcomeMsg)
	if err != nil {
		log.Printf("❌ Error marshaling welcome message: %v", err)
		return
	}

	select {
	case client.send <- messageBytes:
	default:
		close(client.send)
		delete(h.Clients, client)
		delete(h.UserClients, client.userID)
	}
}

// getAllUsersWithStatus fetches all users from DB and sets IsOnline
func (h *Hub) GetAllUsersWithStatus(DB *sql.DB) ([]UserWithStatus, error) {
	rows, err := DB.Query("SELECT id, nickname FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []UserWithStatus{}
	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	for rows.Next() {
		var u UserWithStatus
		if err := rows.Scan(&u.ID, &u.Nickname); err != nil {
			continue
		}
		_, u.IsOnline = h.UserClients[u.ID]
		users = append(users, u)
	}

	return users, nil
}

// getOnlineUsersExcept returns all online users except the excluded one
func (h *Hub) GetOnlineUsersExcept(excludeUserID string) []OnlineUser {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	log.Printf("🔍 Getting online users excluding: %s", excludeUserID)
	log.Printf("📊 Total user Clients in Hub: %d", len(h.UserClients))

	users := make([]OnlineUser, 0, len(h.UserClients))
	for userID, client := range h.UserClients {
		log.Printf("👤 Checking user: %s (%s)", client.username, userID)
		if userID != excludeUserID {
			user := OnlineUser{
				ID:       userID,
				Username: client.username,
			}
			users = append(users, user)
			log.Printf("✅ Added user to list: %s (%s)", client.username, userID)
		} else {
			log.Printf("⏭️ Skipping excluded user: %s (%s)", client.username, userID)
		}
	}

	log.Printf("📋 Final online users list: %+v", users)
	return users
}

// getOnlineUsers returns all online users
func (h *Hub) GetOnlineUsers() []OnlineUser {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	users := make([]OnlineUser, 0, len(h.UserClients))
	for userID, client := range h.UserClients {
		users = append(users, OnlineUser{
			ID:       userID,
			Username: client.username,
		})
	}

	return users
}

// sendPrivateMessage sends a private message to a specific user if they're online
func (h *Hub) SendPrivateMessage(fromUserID, toUserID string, message *ChatMessage) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	// Find the recipient client
	if client, ok := h.UserClients[toUserID]; ok {
		// Create WebSocket message
		wsMessage := Message{
			Type:     "private_message",
			Data:     message,
			UserID:   fromUserID,
			ToUserID: toUserID,
			Time:     time.Now().Unix(),
		}

		messageBytes, err := json.Marshal(wsMessage)
		if err != nil {
			log.Printf("Error marshaling private message: %v", err)
			return
		}

		// Send to recipient
		select {
		case client.send <- messageBytes:
			log.Printf("📨 Private message sent from %s to %s", fromUserID, toUserID)
		default:
			log.Printf("❌ Failed to send private message to %s (channel full)", toUserID)
		}
	} else {
		log.Printf("📭 User %s is offline, message stored but not delivered", toUserID)
	}
}

// scheduleOfflineStatus schedules a delayed offline status Broadcast for a user
func (h *Hub) ScheduleOfflineStatus(userID, username string) {
	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	// Cancel any existing timer for this user
	if existingTimer, exists := h.PendingOffline[userID]; exists {
		existingTimer.Stop()
	}

	// Set a new timer for 3 seconds delay
	timer := time.AfterFunc(3*time.Second, func() {
		h.Mutex.Lock()
		// Check if user is still offline (not reconnected)
		if _, isOnline := h.UserClients[userID]; !isOnline {
			// User is still offline, Broadcast the status
			h.Mutex.Unlock()
			log.Printf("⏰ Broadcasting delayed offline status for user: %s", username)
			h.BroadcastUserStatus(userID, username, "offline")

			// Clean up the timer
			h.Mutex.Lock()
			delete(h.PendingOffline, userID)
			h.Mutex.Unlock()
		} else {
			// User reconnected, just clean up the timer
			log.Printf("🔄 User %s reconnected before offline timeout", username)
			delete(h.PendingOffline, userID)
			h.Mutex.Unlock()
		}
	})

	h.PendingOffline[userID] = timer
	log.Printf("⏰ Scheduled offline status for user %s in 3 seconds", username)
}
func HandleGetAllUsers(DB *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		// Optional: check authentication
		user, ok := Requireuser(w, r)
		if !ok {
			return
		}

		rows, err := DB.Query("SELECT id, nickname FROM users")
		if err != nil {
			log.Printf("❌ Error querying users: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		users := []User{}
		for rows.Next() {
			var u User
			if err := rows.Scan(&u.ID, &u.Nickname); err != nil {
				log.Printf("❌ Error scanning user row: %v", err)
				continue
			}
			users = append(users, u)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"users": users,
			"you":   user, // optional: send current user info
		})
	}
}

// handleWebSocket handles WebSocket connection upgrades
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	log.Printf("🔌 WebSocket connection attempt from %s", r.RemoteAddr)

	// Get user from session
	user, ok := Requireuser(w, r)
	if !ok {
		log.Printf("❌ WebSocket connection rejected - no valid session")
		return
	}

	log.Printf("✅ WebSocket connection authorized for user: %s (%s)", user.Nickname, user.ID)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("❌ WebSocket upgrade error: %v", err)
		return
	}

	log.Printf("🔗 WebSocket upgraded successfully for user: %s", user.Nickname)

	client := &Client{
		conn:     conn,
		send:     make(chan []byte, 256),
		hub:      HubInstance,
		userID:   user.ID,
		username: user.Nickname,
	}

	client.hub.Register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// handleGetOnlineUsers returns the list of online users via HTTP API
func HandleGetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Check if user is authenticated
	_, ok := Requireuser(w, r)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "application/json")
	onlineUsers := HubInstance.GetOnlineUsers()
	json.NewEncoder(w).Encode(map[string]interface{}{
		"onlineUsers": onlineUsers,
	})
}

// Client methods for WebSocket communication

// readPump handles reading messages from the WebSocket connection
func (c *Client) readPump() {
	defer func() {
		log.Printf("🔌 ReadPump ending for user %s (%s)", c.username, c.userID)
		c.hub.Unregister <- c
		c.conn.Close()
	}()

	log.Printf("🔌 ReadPump started for user %s (%s)", c.username, c.userID)

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		log.Printf("🏓 Pong received from %s", c.username)
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("❌ WebSocket unexpected close error for %s: %v", c.username, err)
			} else {
				log.Printf("🔌 WebSocket connection closed for %s: %v", c.username, err)
			}
			break
		}

		log.Printf("📨 Message received from %s: %s", c.username, string(message))

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("❌ Error unmarshaling message from %s: %v", c.username, err)
			continue
		}

		// Handle different message types
		c.HandleMessage(msg)
	}
}

// writePump handles writing messages to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current WebSocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes different types of WebSocket messages
func (c *Client) HandleMessage(msg Message) {
	switch msg.Type {
	case "private_message":
		// Handle private message
		if msg.ToUserID == "" {
			log.Printf("Private message missing toUserId")
			return
		}

		// Extract message content
		var messageData struct {
			Content string `json:"content"`
		}

		if dataBytes, err := json.Marshal(msg.Data); err == nil {
			json.Unmarshal(dataBytes, &messageData)
		}

		// Validate message content
		if err := ValidateMessage(messageData.Content); err != nil {
			log.Printf("Invalid private message content: %v", err)
			return
		}

		// Sanitize content
		messageData.Content = strings.TrimSpace(messageData.Content)

		// Get or create conversation
		conversationID, err := getOrCreateConversation(context.Background(), c.userID, msg.ToUserID)
		if err != nil {
			log.Printf("Error creating conversation: %v", err)
			return
		}

		// Save message to database
		chatMessage, err := sendMessage(context.Background(), conversationID, c.userID, messageData.Content)
		if err != nil {
			log.Printf("Error saving message: %v", err)
			return
		}

		// Send to recipient via WebSocket
		c.hub.SendPrivateMessage(c.userID, msg.ToUserID, chatMessage)

	case "typing":
		// Handle typing indicator for private chat
		if msg.ToUserID != "" {
			PrivateMsg := &PrivateMessage{
				FromUserID: c.userID,
				ToUserID:   msg.ToUserID,
			}

			typingMsg := Message{
				Type:     "typing",
				Data:     msg.Data,
				UserID:   c.userID,
				Username: c.username,
				ToUserID: msg.ToUserID,
				Time:     time.Now().Unix(),
			}

			messageBytes, err := json.Marshal(typingMsg)
			if err != nil {
				log.Printf("Error marshaling typing message: %v", err)
				return
			}

			PrivateMsg.Message = messageBytes
			c.hub.PrivateMsg <- PrivateMsg
		}

	case "ping":
		// Respond with pong
		c.sendMessage("pong", map[string]interface{}{
			"timestamp": time.Now().Unix(),
		})

	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

// sendMessage sends a message to the client
func (c *Client) sendMessage(msgType string, data interface{}) {
	message := Message{
		Type:     msgType,
		Data:     data,
		UserID:   c.userID,
		Username: c.username,
		Time:     time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}

	select {
	case c.send <- messageBytes:
	default:
		close(c.send)
	}
}

// BroadcastPostUpdate sends a new post update to all connected Clients
func (h *Hub) BroadcastPostUpdate(post interface{}) {
	message := Message{
		Type: "post_update",
		Data: post,
		Time: time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling post update: %v", err)
		return
	}

	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	log.Printf("📢 Broadcasting post update to %d Clients", len(h.Clients))
	for client := range h.Clients {
		select {
		case client.send <- messageBytes:
		default:
			close(client.send)
			delete(h.Clients, client)
			delete(h.UserClients, client.userID)
		}
	}
}

// BroadcastCommentUpdate sends a new comment update to all connected Clients
func (h *Hub) BroadcastCommentUpdate(comment interface{}) {
	message := Message{
		Type: "comment_update",
		Data: comment,
		Time: time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling comment update: %v", err)
		return
	}

	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	log.Printf("📢 Broadcasting comment update to %d Clients", len(h.Clients))
	for client := range h.Clients {
		select {
		case client.send <- messageBytes:
		default:
			close(client.send)
			delete(h.Clients, client)
			delete(h.UserClients, client.userID)
		}
	}
}

// BroadcastUserActivity sends user activity updates to all connected Clients
func (h *Hub) BroadcastUserActivity(activityType string, data interface{}) {
	message := Message{
		Type: "user_activity",
		Data: map[string]interface{}{
			"activity": activityType,
			"data":     data,
		},
		Time: time.Now().Unix(),
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling user activity: %v", err)
		return
	}

	h.Mutex.Lock()
	defer h.Mutex.Unlock()

	log.Printf("📢 Broadcasting user activity (%s) to %d Clients", activityType, len(h.Clients))
	for client := range h.Clients {
		select {
		case client.send <- messageBytes:
		default:
			close(client.send)
			delete(h.Clients, client)
			delete(h.UserClients, client.userID)
		}
	}
}
