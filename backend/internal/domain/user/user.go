package user

import (
	"errors"
	"strings"
	"time"

	"github.com/MICBIK/TZBlog/backend/pkg/sanitizer"
	"golang.org/x/crypto/bcrypt"
)

// Status constants
const (
	StatusActive   = "active"
	StatusInactive = "inactive"
	StatusBanned   = "banned"
)

// Errors
var (
	// Validation errors
	ErrInvalidUsername       = errors.New("username is required")
	ErrInvalidUsernameLength = errors.New("username must be between 3 and 50 characters")
	ErrInvalidUsernameFormat = errors.New("username can only contain letters, numbers, underscores, and hyphens")
	ErrInvalidEmail          = errors.New("email is required")
	ErrInvalidEmailFormat    = errors.New("invalid email format")
	ErrPasswordTooShort      = errors.New("password must be at least 8 characters")
	ErrPasswordTooLong       = errors.New("password must be at most 72 characters")
	ErrDisplayNameTooLong    = errors.New("display name must be at most 100 characters")
	ErrBioTooLong            = errors.New("bio must be at most 500 characters")

	// Conflict errors
	ErrUsernameExists = errors.New("username already exists")
	ErrEmailExists    = errors.New("email already exists")

	// Not found errors
	ErrUserNotFound = errors.New("user not found")

	// Authentication errors
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrAccountInactive    = errors.New("account is inactive")
	ErrAccountBanned      = errors.New("account has been banned")
)

// User represents a user entity
type User struct {
	ID           int64      `json:"id" gorm:"primaryKey"`
	Username     string     `json:"username" gorm:"uniqueIndex;not null"`
	Email        string     `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string     `json:"-" gorm:"not null"`
	DisplayName  string     `json:"displayName"`
	Bio          string     `json:"bio"`
	AvatarURL    string     `json:"avatarUrl"`
	Role         string     `json:"role" gorm:"default:'user'"`
	Status       string     `json:"status" gorm:"default:'active'"`
	IsVerified   bool       `json:"isVerified" gorm:"default:false"`
	LastLoginAt  *time.Time `json:"lastLoginAt"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	DeletedAt    *time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

// TableName returns the table name
func (User) TableName() string {
	return "users"
}

// Validate validates the user fields
func (u *User) Validate() error {
	// Validate username
	if strings.TrimSpace(u.Username) == "" {
		return ErrInvalidUsername
	}
	if len(u.Username) < 3 || len(u.Username) > 50 {
		return ErrInvalidUsernameLength
	}
	if !isValidUsername(u.Username) {
		return ErrInvalidUsernameFormat
	}

	// Validate email
	if strings.TrimSpace(u.Email) == "" {
		return ErrInvalidEmail
	}
	if !isValidEmail(u.Email) {
		return ErrInvalidEmailFormat
	}

	// Validate display name length
	if len(u.DisplayName) > 100 {
		return ErrDisplayNameTooLong
	}

	// Validate bio length
	if len(u.Bio) > 500 {
		return ErrBioTooLong
	}

	return nil
}

// SanitizeContent sanitizes user-generated content to prevent XSS attacks
func (u *User) SanitizeContent() {
	// Sanitize username (remove any HTML)
	u.Username = sanitizer.SanitizeStrict(u.Username)

	// Sanitize email (remove any HTML)
	u.Email = sanitizer.SanitizeStrict(u.Email)

	// Sanitize display name (remove any HTML)
	u.DisplayName = sanitizer.SanitizeStrict(u.DisplayName)

	// Sanitize bio (allow minimal formatting)
	u.Bio = sanitizer.SanitizeComment(u.Bio)
}

// SetPassword hashes and sets the user password
func (u *User) SetPassword(password string) error {
	if len(password) < 8 {
		return ErrPasswordTooShort
	}
	if len(password) > 72 {
		return ErrPasswordTooLong
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	u.PasswordHash = string(hash)
	return nil
}

// CheckPassword verifies if the provided password matches the hash
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// IsActive checks if the user account is active
func (u *User) IsActive() bool {
	return u.Status == StatusActive
}

// UserRepository defines the interface for user operations
type UserRepository interface {
	Create(user *User) error
	FindByID(id int64) (*User, error)
	FindByEmail(email string) (*User, error)
	FindByUsername(username string) (*User, error)
	Update(user *User) error
	Delete(id int64) error
	UpdateLastLogin(id int64) error
	List(limit, offset int) ([]*User, int64, error)
}

// isValidEmail performs basic email validation
func isValidEmail(email string) bool {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}
	if len(parts[0]) == 0 || len(parts[1]) == 0 {
		return false
	}
	if !strings.Contains(parts[1], ".") {
		return false
	}
	return true
}

// isValidUsername checks if username contains only allowed characters
// Allowed: letters (a-z, A-Z), numbers (0-9), underscores (_), and hyphens (-)
func isValidUsername(username string) bool {
	for _, c := range username {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_' || c == '-') {
			return false
		}
	}
	return true
}
