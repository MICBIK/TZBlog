package handlers

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
)

// AuthHandler handles HTTP requests for authentication
type AuthHandler struct {
	service user.Service
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(service user.Service) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

// Register creates a new user account
// @Summary      用户注册
// @Description  创建新用户账号，返回 JWT token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        user body user.RegisterDTO true "用户注册信息" example({"email":"user@example.com","username":"testuser","password":"password123"})
// @Success      201 {object} response.Response{data=user.AuthResponse} "注册成功，返回用户信息和 token"
// @Failure      400 {object} response.ErrorResponse "请求参数错误" example({"success":false,"error":"Invalid email address","code":"INVALID_EMAIL"})
// @Failure      409 {object} response.ErrorResponse "用户已存在" example({"success":false,"error":"User already exists","code":"USER_EXISTS"})
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req user.RegisterDTO
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
// @Summary      用户登录
// @Description  使用邮箱和密码登录，返回 JWT token
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        credentials body user.LoginDTO true "登录凭证" example({"email":"user@example.com","password":"password123"})
// @Success      200 {object} response.Response{data=user.AuthResponse} "登录成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "用户名或密码错误" example({"success":false,"error":"Invalid email or password","code":"INVALID_CREDENTIALS"})
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req user.LoginDTO
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
// @Summary      获取当前用户信息
// @Description  获取已登录用户的个人资料
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} response.Response{data=user.User} "成功返回用户信息"
// @Failure      401 {object} response.ErrorResponse "未认证" example({"success":false,"error":"Authentication required","code":"UNAUTHORIZED"})
// @Failure      404 {object} response.ErrorResponse "用户不存在"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/auth/me [get]
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
// @Summary      更新用户资料
// @Description  更新已登录用户的个人资料信息
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        profile body user.UpdateProfileDTO true "用户资料" example({"username":"newname","bio":"My bio"})
// @Success      200 {object} response.Response{data=user.User} "更新成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/auth/profile [put]
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	var req user.UpdateProfileDTO
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
// @Summary      修改密码
// @Description  修改已登录用户的密码
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        passwords body user.ChangePasswordDTO true "密码信息" example({"old_password":"oldpass123","new_password":"newpass456"})
// @Success      200 {object} response.SuccessResponse "密码修改成功"
// @Failure      400 {object} response.ErrorResponse "请求参数错误"
// @Failure      401 {object} response.ErrorResponse "未认证或旧密码错误"
// @Failure      500 {object} response.ErrorResponse "服务器错误"
// @Router       /api/v1/auth/change-password [post]
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID := c.GetInt64("user_id")
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	var req user.ChangePasswordDTO
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
// @Summary      用户登出
// @Description  登出当前用户（客户端需删除 token）
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} response.SuccessResponse "登出成功"
// @Router       /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// JWT logout is handled client-side by removing the token
	// This endpoint exists for consistency and future token revocation
	response.Success(c, gin.H{"message": "Logged out successfully"})
}
