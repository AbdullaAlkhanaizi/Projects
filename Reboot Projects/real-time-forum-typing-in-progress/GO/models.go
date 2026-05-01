package app

import (
	"database/sql"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Server represents the main server structure
type Server struct {
	DB  *sql.DB
	Hub *Hub
}

// User represents a user in the system
type User struct {
	ID           string
	Nickname     string
	Email        string
	First        string
	Last         string
	Age          int
	Gender       string
	PasswordHash string
}
type UserWithStatus struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
	IsOnline bool   `json:"isOnline"`
}

// Category represents a post category
type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Comment represents a comment on a post
type Comment struct {
	ID        string `json:"id"`
	PostID    string `json:"post_id"`
	AuthorID  string `json:"author_id"`
	Author    string `json:"author"`
	Content   string `json:"content"`
	CreatedAt int64  `json:"created_at"`
}

// PostItem represents a post with its categories
type PostItem struct {
	ID        string     `json:"id"`
	Title     string     `json:"title"`
	Content   string     `json:"content"`
	Author    string     `json:"author"`
	CreatedAt int64      `json:"createdAt"`
	Cats      []Category `json:"categories"`
}

// WebSocket-related structures for real-time messaging

// Client represents a WebSocket client connection
type Client struct {
	conn     *websocket.Conn
	send     chan []byte
	hub      *Hub
	userID   string
	username string
}

// Hub manages all WebSocket connections and message routing
type Hub struct {
	Clients        map[*Client]bool
	UserClients    map[string]*Client // userID -> Client mapping for private messages
	Broadcast      chan []byte
	PrivateMsg     chan *PrivateMessage
	Register       chan *Client
	Unregister     chan *Client
	Mutex          sync.RWMutex
	PendingOffline map[string]*time.Timer // userID -> timer for delayed offline status
}

// Message represents a WebSocket message
type Message struct {
	Type       string      `json:"type"`
	Data       interface{} `json:"data"`
	UserID     string      `json:"userId,omitempty"`
	Username   string      `json:"username,omitempty"`
	ToUserID   string      `json:"toUserId,omitempty"`
	ToUsername string      `json:"toUsername,omitempty"`
	Time       int64       `json:"time"`
}

// PrivateMessage represents a private message between users
type PrivateMessage struct {
	FromUserID string
	ToUserID   string
	Message    []byte
}

// OnlineUser represents an online user for the frontend
type OnlineUser struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

// ChatMessage represents a private message in the database
type ChatMessage struct {
	ID             string      `json:"id"`
	ConversationID string      `json:"conversationId"`
	SenderID       string      `json:"senderId"`
	Content        string      `json:"content"`
	CreatedAt      int64       `json:"createdAt"`
	EditedAt       *int64      `json:"editedAt,omitempty"`
	DeletedAt      *int64      `json:"deletedAt,omitempty"`
	Sender         interface{} `json:"sender"`
}

// Conversation represents a chat conversation between users
type Conversation struct {
	ID          string       `json:"id"`
	User1ID     string       `json:"user1Id"`
	User2ID     string       `json:"user2Id"`
	CreatedAt   int64        `json:"createdAt"`
	LastMessage *ChatMessage `json:"lastMessage,omitempty"`
	OtherUser   interface{}  `json:"otherUser"`
}
