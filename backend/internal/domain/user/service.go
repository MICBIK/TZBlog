package user

import "github.com/MICBIK/TZBlog/backend/pkg/auth"

// Service defines the interface for user/auth business logic operations
type Service interface {
	// Register creates a new user account
	Register(dto *RegisterDTO) (*AuthResponse, error)

	// Login authenticates a user and returns a token
	Login(dto *LoginDTO) (*AuthResponse, error)

	// GetUserByID retrieves a user by ID
	GetUserByID(id int64) (*User, error)

	// GetCurrentUser retrieves the authenticated user's profile
	GetCurrentUser(userID int64) (*User, error)

	// UpdateProfile updates the user's profile information
	UpdateProfile(userID int64, dto *UpdateProfileDTO) (*User, error)

	// ChangePassword changes the user's password
	// ✅ SEC-1-05: jti parameter allows revoking the current token
	ChangePassword(userID int64, jti string, dto *ChangePasswordDTO) error
}

// RegisterDTO represents the request data for user registration
type RegisterDTO struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

// LoginDTO represents the request data for user login
type LoginDTO struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User  *User  `json:"user"`
	Token string `json:"token"`
}

// UpdateProfileDTO represents the request data for updating user profile
type UpdateProfileDTO struct {
	DisplayName *string `json:"displayName"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatarUrl"`
}

// ChangePasswordDTO represents the request data for changing password
type ChangePasswordDTO struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8,max=72"`
}

// NewService is a constructor function type for creating a Service implementation
type NewService func(userRepo UserRepository, jwtAuth *auth.JWTAuth) Service
