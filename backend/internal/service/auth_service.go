package service

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo         user.UserRepository
	passwordHistRepo user.PasswordHistoryRepository
	jwtAuth          *auth.JWTAuth
	tokenBlacklist   TokenBlacklist // ✅ SEC-1-05: Add token blacklist for revocation
}

// TokenBlacklist interface for revoking tokens
type TokenBlacklist interface {
	Revoke(tokenID string, expiry time.Duration) error
	IsRevoked(tokenID string) bool
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo user.UserRepository, jwtAuth *auth.JWTAuth) user.Service {
	return &AuthService{
		userRepo:         userRepo,
		passwordHistRepo: nil, // Optional: can be set via setter
		jwtAuth:          jwtAuth,
		tokenBlacklist:   nil, // Optional: can be set via setter
	}
}

// SetPasswordHistoryRepo sets the password history repository (optional)
func (s *AuthService) SetPasswordHistoryRepo(repo user.PasswordHistoryRepository) {
	s.passwordHistRepo = repo
}

// SetTokenBlacklist sets the token blacklist (optional)
func (s *AuthService) SetTokenBlacklist(blacklist TokenBlacklist) {
	s.tokenBlacklist = blacklist
}

// Register creates a new user account
func (s *AuthService) Register(dto *user.RegisterDTO) (*user.AuthResponse, error) {
	// Check if username already exists
	existingUser, err := s.userRepo.FindByUsername(dto.Username)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		// ✅ SEC-1-03: Return generic error to prevent user enumeration
		return nil, user.ErrInvalidCredentials
	}

	// Check if email already exists
	existingUser, err = s.userRepo.FindByEmail(dto.Email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		// ✅ SEC-1-03: Return generic error to prevent user enumeration
		return nil, user.ErrInvalidCredentials
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
	token, err := s.jwtAuth.GenerateToken(newUser.ID, newUser.Role)
	if err != nil {
		return nil, err
	}

	return &user.AuthResponse{
		User:  newUser,
		Token: token,
	}, nil
}

// Login authenticates a user and returns a token
func (s *AuthService) Login(dto *user.LoginDTO) (*user.AuthResponse, error) {
	// Find user by email
	usr, err := s.userRepo.FindByEmail(dto.Email)
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
	// ✅ SEC-1-03: Return generic error for banned/inactive to prevent user enumeration
	if !usr.IsActive() {
		return nil, user.ErrInvalidCredentials
	}

	// Update last login time
	go func() {
		_ = s.userRepo.UpdateLastLogin(usr.ID)
	}()

	// Generate JWT token
	token, err := s.jwtAuth.GenerateToken(usr.ID, usr.Role)
	if err != nil {
		return nil, err
	}

	return &user.AuthResponse{
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

// UpdateProfile updates the user's profile information
func (s *AuthService) UpdateProfile(userID int64, dto *user.UpdateProfileDTO) (*user.User, error) {
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

// ChangePassword changes the user's password
// ✅ SEC-1-05: Accepts jti to revoke the current token after password change
func (s *AuthService) ChangePassword(userID int64, jti string, dto *user.ChangePasswordDTO) error {
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

	// Check password history to prevent reuse
	if s.passwordHistRepo != nil {
		history, err := s.passwordHistRepo.GetRecentPasswords(userID, 5)
		if err == nil && len(history) > 0 {
			for _, ph := range history {
				if bcrypt.CompareHashAndPassword([]byte(ph.Password), []byte(dto.NewPassword)) == nil {
					return user.ErrPasswordReused
				}
			}
		}

		oldHash := usr.PasswordHash
		_ = s.passwordHistRepo.Create(&user.PasswordHistory{
			UserID:   userID,
			Password: oldHash,
		})
	}

	// Set new password
	if err := usr.SetPassword(dto.NewPassword); err != nil {
		return err
	}

	// Save changes
	if err := s.userRepo.Update(usr); err != nil {
		return err
	}

	// ✅ SEC-1-05: Revoke current token after successful password change
	if s.tokenBlacklist != nil && jti != "" {
		_ = s.tokenBlacklist.Revoke(jti, 24*time.Hour)
	}

	return nil
}
