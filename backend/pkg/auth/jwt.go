package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTAuth handles JWT operations
type JWTAuth struct {
	secret string
	expiry time.Duration
}

// NewJWTAuth creates a new JWT authenticator
func NewJWTAuth(secret string, expiry time.Duration) *JWTAuth {
	return &JWTAuth{
		secret: secret,
		expiry: expiry,
	}
}

// GenerateToken generates a new JWT token for a user
func (j *JWTAuth) GenerateToken(userID int64, username string) (string, error) {
	return GenerateToken(userID, username, j.secret, j.expiry)
}

// ValidateToken validates a JWT token
func (j *JWTAuth) ValidateToken(tokenString string) (*Claims, error) {
	return ValidateToken(tokenString, j.secret)
}

// Claims represents JWT claims
type Claims struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	JTI    string `json:"jti"` // JWT ID for revocation
	jwt.RegisteredClaims
}

// GenerateToken generates a new JWT token with algorithm security
func GenerateToken(userID int64, role, secret string, expiry time.Duration) (string, error) {
	now := time.Now()
	jti := uuid.New().String() // Generate unique JWT ID

	claims := Claims{
		UserID: userID,
		Role:   role,
		JTI:    jti,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	// Use HMAC SHA-256 algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateToken validates JWT token with algorithm verification
func ValidateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// ✅ SEC-001 FIX: Verify signing algorithm to prevent algorithm confusion attacks
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("token validation failed: %w", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token claims")
}
