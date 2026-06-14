package service

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo user.UserRepository
	jwtAuth  *auth.JWTAuth
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo user.UserRepository, jwtAuth *auth.JWTAuth) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		jwtAuth:  jwtAuth,
	}
}

// RegisterDTO represents the request data for user registration
type RegisterDTO struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

// LoginDTO represents the request data for user login
type LoginDTO struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User  *user.User `json:"user"`
	Token string     `json:"token"`
}

// Register creates a new user account
func (s *AuthService) Register(dto *RegisterDTO) (*AuthResponse, error) {
	// Check if username already exists
	existingUser, err := s.userRepo.FindByUsername(dto.Username)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, user.ErrUsernameExists
	}

	// Check if email already exists
	existingUser, err = s.userRepo.FindByEmail(dto.Email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, user.ErrEmailExists
	}

	// Create new user
	newUser := &user.User{
		Username:    dto.Username,
		Email:       dto.Email,
		DisplayName: dto.Username,
		Role:        "user",
		Status:      user.StatusActive,
		IsVerified:  false,
	}

	// Set password hash
	if err := newUser.SetPassword(dto.Password); err != nil {
		return nil, err
	}

	// Validate user
	if err := newUser.Validate(); err != nil {
		return nil, err
	}

	// Save to repository
	if err := s.userRepo.Create(newUser); err != nil {
		return nil, err
	}

	// Generate JWT token
	token, err := s.jwtAuth.GenerateToken(newUser.ID, newUser.Username)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:  newUser,
		Token: token,
	}, nil
}

// Login authenticates a user and returns a token
func (s *AuthService) Login(dto *LoginDTO) (*AuthResponse, error) {
	// Find user by username or email
	var usr *user.User
	var err error

	// Try to find by email first
	if contains(dto.Login, "@") {
		usr, err = s.userRepo.FindByEmail(dto.Login)
	} else {
		usr, err = s.userRepo.FindByUsername(dto.Login)
	}

	if err != nil {
		return nil, err
	}
	if usr == nil {
		return nil, user.ErrInvalidCredentials
	}

	// Check password
	if !usr.CheckPassword(dto.Password) {
		return nil, user.ErrInvalidCredentials
	}

	// Check account status
	if !usr.IsActive() {
		if usr.Status == user.StatusBanned {
			return nil, user.ErrAccountBanned
		}
		return nil, user.ErrAccountInactive
	}

	// Update last login time
	go func() {
		_ = s.userRepo.UpdateLastLogin(usr.ID)
	}()

	// Generate JWT token
	token, err := s.jwtAuth.GenerateToken(usr.ID, usr.Username)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:  usr,
		Token: token,
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(id int64) (*user.User, error) {
	usr, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if usr == nil {
		return nil, user.ErrUserNotFound
	}
	return usr, nil
}

// GetCurrentUser retrieves the authenticated user's profile
func (s *AuthService) GetCurrentUser(userID int64) (*user.User, error) {
	return s.GetUserByID(userID)
}

// UpdateProfileDTO represents the request data for updating user profile
type UpdateProfileDTO struct {
	DisplayName *string `json:"display_name"`
	Bio         *string `json:"bio"`
	AvatarURL   *string `json:"avatar_url"`
}

// UpdateProfile updates the user's profile information
func (s *AuthService) UpdateProfile(userID int64, dto *UpdateProfileDTO) (*user.User, error) {
	usr, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if usr == nil {
		return nil, user.ErrUserNotFound
	}

	// Update fields
	updated := false
	if dto.DisplayName != nil && *dto.DisplayName != usr.DisplayName {
		usr.DisplayName = *dto.DisplayName
		updated = true
	}
	if dto.Bio != nil && *dto.Bio != usr.Bio {
		usr.Bio = *dto.Bio
		updated = true
	}
	if dto.AvatarURL != nil && *dto.AvatarURL != usr.AvatarURL {
		usr.AvatarURL = *dto.AvatarURL
		updated = true
	}

	if !updated {
		return usr, nil
	}

	usr.UpdatedAt = time.Now()

	// Save changes
	if err := s.userRepo.Update(usr); err != nil {
		return nil, err
	}

	return usr, nil
}

// ChangePasswordDTO represents the request data for changing password
type ChangePasswordDTO struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8,max=72"`
}

// ChangePassword changes the user's password
func (s *AuthService) ChangePassword(userID int64, dto *ChangePasswordDTO) error {
	usr, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if usr == nil {
		return user.ErrUserNotFound
	}

	// Verify current password
	if !usr.CheckPassword(dto.CurrentPassword) {
		return user.ErrInvalidCredentials
	}

	// Set new password
	if err := usr.SetPassword(dto.NewPassword); err != nil {
		return err
	}

	// Save changes
	return s.userRepo.Update(usr)
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && len(s) >= len(substr) && s != substr &&
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr ||
		 len(s) > len(substr) && s[1:len(s)-1] != s && findSubstring(s, substr))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
