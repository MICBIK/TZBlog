package handlers

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/internal/service"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// AuthHandler handles HTTP requests for authentication
type AuthHandler struct {
	service *service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(userRepo user.UserRepository, jwtAuth *auth.JWTAuth) *AuthHandler {
	return &AuthHandler{
		service: service.NewAuthService(userRepo, jwtAuth),
	}
}

// Register creates a new user account
// @Summary Register a new user
// @Tags Auth
// @Accept json
// @Produce json
// @Param user body service.RegisterDTO true "User registration data"
// @Success 201 {object} service.AuthResponse
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req service.RegisterDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	authResp, err := h.service.Register(&req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Created(c, authResp)
}

// Login authenticates a user
// @Summary Login user
// @Tags Auth
// @Accept json
// @Produce json
// @Param credentials body service.LoginDTO true "Login credentials"
// @Success 200 {object} service.AuthResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	authResp, err := h.service.Login(&req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, authResp)
}

// GetCurrentUser retrieves the authenticated user's profile
// @Summary Get current user
// @Tags Auth
// @Produce json
// @Success 200 {object} user.User
// @Router /auth/me [get]
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	usr, err := h.service.GetCurrentUser(userID)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, usr)
}

// UpdateProfile updates the user's profile
// @Summary Update user profile
// @Tags Auth
// @Accept json
// @Produce json
// @Param profile body service.UpdateProfileDTO true "Profile data"
// @Success 200 {object} user.User
// @Router /auth/profile [put]
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	var req service.UpdateProfileDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	usr, err := h.service.UpdateProfile(userID, &req)
	if err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, usr)
}

// ChangePassword changes the user's password
// @Summary Change password
// @Tags Auth
// @Accept json
// @Produce json
// @Param passwords body service.ChangePasswordDTO true "Password change data"
// @Success 200 {object} response.SuccessResponse
// @Router /auth/change-password [post]
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	var req service.ChangePasswordDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request data")
		return
	}

	if err := h.service.ChangePassword(userID, &req); err != nil {
		response.HandleError(c, err)
		return
	}

	response.Success(c, gin.H{"message": "Password changed successfully"})
}

// Logout logs out the user (client-side token removal)
// @Summary Logout user
// @Tags Auth
// @Success 200 {object} response.SuccessResponse
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// JWT logout is handled client-side by removing the token
	// This endpoint exists for consistency and future token revocation
	response.Success(c, gin.H{"message": "Logged out successfully"})
}
