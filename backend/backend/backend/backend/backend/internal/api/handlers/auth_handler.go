package handlers

import (
	"net/http"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/MICBIK/TZBlog/backend/pkg/logger"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	userRepo  user.UserRepository
	jwtSecret string
	jwtExpiry string
}

// NewAuthHandler 创建认证处理器
//
// 参数:
//   - userRepo: 用户仓储接口
//   - jwtSecret: JWT 密钥
//   - jwtExpiry: Token 过期时间字符串
//
// 返回:
//   - *AuthHandler: 认证处理器实例
func NewAuthHandler(userRepo user.UserRepository, jwtSecret, jwtExpiry string) *AuthHandler {
	return &AuthHandler{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		jwtExpiry: jwtExpiry,
	}
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	Token string      `json:"token"`
	User  *user.User `json:"user"`
}

// Register 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request parameters")
		return
	}

	// 检查邮箱是否已存在
	existingUser, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		logger.Error("Failed to check email",
			zap.String("email", req.Email),
			zap.Error(err))
		response.InternalError(c, "Failed to check email")
		return
	}
	if existingUser != nil {
		response.BadRequest(c, "Email already exists")
		return
	}

	// 检查用户名是否已存在
	existingUser, err = h.userRepo.FindByUsername(req.Username)
	if err != nil {
		logger.Error("Failed to check username",
			zap.String("username", req.Username),
			zap.Error(err))
		response.InternalError(c, "Failed to check username")
		return
	}
	if existingUser != nil {
		response.BadRequest(c, "Username already exists")
		return
	}

	// 密码加密
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", zap.Error(err))
		response.InternalError(c, "Failed to hash password")
		return
	}

	// 创建用户
	newUser := &user.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		DisplayName:  req.Username,
		Role:         "user",
		IsVerified:   false,
	}

	if err := h.userRepo.Create(newUser); err != nil {
		logger.Error("Failed to create user",
			zap.String("username", req.Username),
			zap.Error(err))
		response.InternalError(c, "Failed to create user")
		return
	}

	// 生成JWT token
	token, err := auth.GenerateToken(newUser.ID, newUser.Role, h.jwtSecret, 168*3600*1000000000) // 7 days
	if err != nil {
		logger.Error("Failed to generate token",
			zap.Int64("user_id", newUser.ID),
			zap.Error(err))
		response.InternalError(c, "Failed to generate token")
		return
	}

	logger.Info("User registered successfully",
		zap.Int64("user_id", newUser.ID),
		zap.String("username", newUser.Username))

	c.JSON(http.StatusCreated, response.Response{
		Success: true,
		Data: AuthResponse{
			Token: token,
			User:  newUser,
		},
	})
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request parameters")
		return
	}

	// 查找用户
	u, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		logger.Error("Failed to find user",
			zap.String("email", req.Email),
			zap.Error(err))
		response.InternalError(c, "Failed to find user")
		return
	}
	if u == nil {
		response.Unauthorized(c, "Invalid email or password")
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		response.Unauthorized(c, "Invalid email or password")
		return
	}

	// 生成JWT token
	token, err := auth.GenerateToken(u.ID, u.Role, h.jwtSecret, 168*3600*1000000000) // 7 days
	if err != nil {
		logger.Error("Failed to generate token",
			zap.Int64("user_id", u.ID),
			zap.Error(err))
		response.InternalError(c, "Failed to generate token")
		return
	}

	logger.Info("User logged in successfully",
		zap.Int64("user_id", u.ID),
		zap.String("username", u.Username))

	response.Success(c, AuthResponse{
		Token: token,
		User:  u,
	})
}

// GetCurrentUser 获取当前用户信息
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	// 安全的类型断言
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "Unauthorized")
		return
	}

	userID, ok := userIDRaw.(int64)
	if !ok {
		logger.Error("Invalid user ID type in context",
			zap.Any("user_id", userIDRaw))
		response.InternalError(c, "Internal server error")
		return
	}

	u, err := h.userRepo.FindByID(userID)
	if err != nil {
		logger.Error("Failed to get user",
			zap.Int64("user_id", userID),
			zap.Error(err))
		response.InternalError(c, "Failed to get user")
		return
	}
	if u == nil {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, u)
}
