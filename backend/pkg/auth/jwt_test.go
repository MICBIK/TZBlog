package auth

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGenerateToken(t *testing.T) {
	secret := "test-secret"
	userID := int64(123)
	role := "user"
	expiry := 24 * time.Hour

	token, err := GenerateToken(userID, role, secret, expiry)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestValidateToken_Success(t *testing.T) {
	secret := "test-secret"
	userID := int64(123)
	role := "admin"
	expiry := 24 * time.Hour

	// Generate a token
	token, err := GenerateToken(userID, role, secret, expiry)
	assert.NoError(t, err)

	// Validate the token
	claims, err := ValidateToken(token, secret)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, role, claims.Role)
}

func TestValidateToken_InvalidSecret(t *testing.T) {
	secret := "test-secret"
	wrongSecret := "wrong-secret"
	userID := int64(123)
	role := "user"
	expiry := 24 * time.Hour

	// Generate with correct secret
	token, err := GenerateToken(userID, role, secret, expiry)
	assert.NoError(t, err)

	// Validate with wrong secret
	claims, err := ValidateToken(token, wrongSecret)
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	secret := "test-secret"
	userID := int64(123)
	role := "user"
	expiry := -1 * time.Hour // Already expired

	token, err := GenerateToken(userID, role, secret, expiry)
	assert.NoError(t, err)

	// Validate expired token
	claims, err := ValidateToken(token, secret)
	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestValidateToken_MalformedToken(t *testing.T) {
	secret := "test-secret"

	claims, err := ValidateToken("not-a-valid-token", secret)
	assert.Error(t, err)
	assert.Nil(t, claims)
}
