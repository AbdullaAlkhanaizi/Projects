package Static

import "database/sql"

type Post struct {
	
	ID           int
	Title        string
	Content      string
	Author       string
	CategoryID   []string
	CreatedAt    string
	LikeCount    int
	DislikeCount int
	CategoryNames []string
	UserReaction  string 
	Comments     []Comment // Add comments here
}

type Comment struct {
	ID           int
	Content      string
	Author       string
	LikeCount    int
	DislikeCount int
	CreatedAt    string
}

type User struct {
	ID    string
	Name  string
	Email string
}

var db *sql.DB
