package app

import (
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"
	"unicode"
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return e.Field + ": " + e.Message
}

// Input length limits
const (
	MaxNicknameLength    = 50
	MaxEmailLength       = 254
	MaxNameLength        = 100
	MaxPostTitleLength   = 200
	MaxPostContentLength = 10000
	MaxCommentLength     = 2000
	MaxMessageLength     = 1000
	MinAge               = 13
	MaxAge               = 120
)

// Email validation regex
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// Nickname validation regex (alphanumeric, underscore, hyphen)
var nicknameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)

// XSS detection patterns
var xssPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)<script[^>]*>`),
	regexp.MustCompile(`(?i)</script>`),
	regexp.MustCompile(`(?i)javascript:`),
	regexp.MustCompile(`(?i)on\w+\s*=`),
	regexp.MustCompile(`(?i)<iframe[^>]*>`),
	regexp.MustCompile(`(?i)<object[^>]*>`),
	regexp.MustCompile(`(?i)<embed[^>]*>`),
}

// ContainsNonPrintable checks if string Contains non-printable characters
func ContainsNonPrintable(s string) bool {
	for _, r := range s {
		if !unicode.IsPrint(r) && !unicode.IsSpace(r) {
			return true
		}
	}
	return false
}

// sanitizeString removes non-printable characters and normalizes whitespace
func SanitizeString(s string) string {
	// Remove non-printable characters except normal whitespace
	var result strings.Builder
	for _, r := range s {
		if unicode.IsPrint(r) || r == ' ' || r == '\t' || r == '\n' || r == '\r' {
			result.WriteRune(r)
		}
	}
	return result.String()
}

// containsXSS checks for basic XSS patterns
func ContainsXSS(s string) bool {
	for _, pattern := range xssPatterns {
		if pattern.MatchString(s) {
			return true
		}
	}
	return false
}

// validateEmail validates email format and length
func ValidateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return ValidationError{"email", "email is required"}
	}
	if len(email) > MaxEmailLength {
		return ValidationError{"email", "email is too long"}
	}
	if ContainsNonPrintable(email) {
		return ValidationError{"email", "email Contains invalid characters"}
	}
	if !emailRegex.MatchString(email) {
		return ValidationError{"email", "invalid email format"}
	}
	return nil
}

// validateNickname validates nickname format and length
func ValidateNickname(nickname string) error {
	nickname = strings.TrimSpace(nickname)
	if nickname == "" {
		return ValidationError{"nickname", "nickname is required"}
	}
	if len(nickname) > MaxNicknameLength {
		return ValidationError{"nickname", "nickname is too long"}
	}
	if ContainsNonPrintable(nickname) {
		return ValidationError{"nickname", "nickname Contains invalid characters"}
	}
	if !nicknameRegex.MatchString(nickname) {
		return ValidationError{"nickname", "nickname can only contain letters, numbers, underscores, and hyphens"}
	}
	return nil
}

// validateName validates first/last name
func ValidateName(name, fieldName string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return ValidationError{fieldName, fieldName + " is required"}
	}
	if len(name) > MaxNameLength {
		return ValidationError{fieldName, fieldName + " is too long"}
	}
	if ContainsNonPrintable(name) {
		return ValidationError{fieldName, fieldName + " Contains invalid characters"}
	}
	return nil
}

// validateAge validates age range
func ValidateAge(age int) error {
	if age < MinAge || age > MaxAge {
		return ValidationError{"age", "age must be between 13 and 120"}
	}
	return nil
}

// validateGender validates gender field
func ValidateGender(gender string) error {
	gender = strings.TrimSpace(gender)
	if gender == "" {
		return ValidationError{"gender", "gender is required"}
	}
	if len(gender) > 50 {
		return ValidationError{"gender", "gender is too long"}
	}
	if ContainsNonPrintable(gender) {
		return ValidationError{"gender", "gender Contains invalid characters"}
	}
	return nil
}

// validatePassword validates password (basic checks only)
func ValidatePassword(password string) error {
	if password == "" {
		return ValidationError{"password", "password is required"}
	}
	if len(password) < 6 {
		return ValidationError{"password", "password must be at least 6 characters"}
	}
	if len(password) > 128 {
		return ValidationError{"password", "password is too long"}
	}
	if ContainsNonPrintable(password) {
		return ValidationError{"password", "password Contains invalid characters"}
	}
	return nil
}

// validatePostTitle validates post title
func ValidatePostTitle(title string) error {
	title = strings.TrimSpace(title)
	if title == "" {
		return ValidationError{"title", "title is required"}
	}
	if len(title) > MaxPostTitleLength {
		return ValidationError{"title", "title is too long"}
	}
	if ContainsNonPrintable(title) {
		return ValidationError{"title", "title Contains invalid characters"}
	}
	if ContainsXSS(title) {
		return ValidationError{"title", "title Contains potentially dangerous content"}
	}
	return nil
}

// validatePostContent validates post content
func ValidatePostContent(content string) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return ValidationError{"content", "content is required"}
	}
	if len(content) > MaxPostContentLength {
		return ValidationError{"content", "content is too long"}
	}
	if ContainsNonPrintable(content) {
		return ValidationError{"content", "content Contains invalid characters"}
	}
	if ContainsXSS(content) {
		return ValidationError{"content", "content Contains potentially dangerous content"}
	}
	return nil
}

// validateComment validates comment content
func ValidateComment(content string) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return ValidationError{"content", "comment cannot be empty"}
	}
	if len(content) > MaxCommentLength {
		return ValidationError{"content", "comment is too long"}
	}
	if ContainsNonPrintable(content) {
		return ValidationError{"content", "comment Contains invalid characters"}
	}
	if ContainsXSS(content) {
		return ValidationError{"content", "comment Contains potentially dangerous content"}
	}
	return nil
}

// validateMessage validates private message content
func ValidateMessage(content string) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return ValidationError{"content", "message cannot be empty"}
	}
	if len(content) > MaxMessageLength {
		return ValidationError{"content", "message is too long"}
	}
	if ContainsNonPrintable(content) {
		return ValidationError{"content", "message Contains invalid characters"}
	}
	if ContainsXSS(content) {
		return ValidationError{"content", "message Contains potentially dangerous content"}
	}
	return nil
}

// sanitizeAndValidateString is a helper that sanitizes and validates general text input
func SanitizeAndValidateString(input, fieldName string, maxLength int, required bool) (string, error) {
	// Sanitize first
	sanitized := SanitizeString(input)
	sanitized = strings.TrimSpace(sanitized)

	// Check if required
	if required && sanitized == "" {
		return "", ValidationError{fieldName, fieldName + " is required"}
	}

	// Check length
	if len(sanitized) > maxLength {
		return "", ValidationError{fieldName, fieldName + " is too long"}
	}

	// Check for XSS
	if ContainsXSS(sanitized) {
		return "", ValidationError{fieldName, fieldName + " Contains potentially dangerous content"}
	}

	return sanitized, nil
}

// Rate limiting functionality

// RateLimiter tracks request rates per IP
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
	}
}

// Global rate limiter instance
var globalRateLimiter = NewRateLimiter()

// isRateLimited checks if an IP is rate limited
func (rl *RateLimiter) IsRateLimited(ip string, maxRequests int, window time.Duration) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	cutoff := now.Add(-window)

	// Get existing requests for this IP
	requests := rl.requests[ip]

	// Filter out old requests
	var validRequests []time.Time
	for _, reqTime := range requests {
		if reqTime.After(cutoff) {
			validRequests = append(validRequests, reqTime)
		}
	}

	// Check if we're over the limit
	if len(validRequests) >= maxRequests {
		return true
	}

	// Add current request
	validRequests = append(validRequests, now)
	rl.requests[ip] = validRequests

	return false
}

// getClientIP extracts the client IP from request (moved from database.go)
func GetClientIP(r *http.Request) string {
	// Check for X-Forwarded-For header (proxy/load balancer)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the list
		if idx := strings.Index(xff, ","); idx != -1 {
			return strings.TrimSpace(xff[:idx])
		}
		return strings.TrimSpace(xff)
	}

	// Check for X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}

	// Fall back to RemoteAddr
	if idx := strings.LastIndex(r.RemoteAddr, ":"); idx != -1 {
		return r.RemoteAddr[:idx]
	}
	return r.RemoteAddr
}

// checkRateLimit checks if a request should be rate limited
func CheckRateLimit(r *http.Request, maxRequests int, window time.Duration) bool {
	ip := GetClientIP(r)
	return globalRateLimiter.IsRateLimited(ip, maxRequests, window)
}

// Rate limiting middleware
func Ratelimitmiddleware(maxRequests int, window time.Duration, handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if CheckRateLimit(r, maxRequests, window) {
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		handler(w, r)
	}
}
