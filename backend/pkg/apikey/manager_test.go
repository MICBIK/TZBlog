package apikey

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/apikey"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockRepository is a mock implementation of apikey.APIKeyRepository
type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) Create(ak *apikey.APIKey) error {
	args := m.Called(ak)
	return args.Error(0)
}

func (m *MockRepository) GetByID(id int64) (*apikey.APIKey, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*apikey.APIKey), args.Error(1)
}

func (m *MockRepository) GetByKeyHash(keyHash string) (*apikey.APIKey, error) {
	args := m.Called(keyHash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*apikey.APIKey), args.Error(1)
}

func (m *MockRepository) GetByUserID(userID int64) ([]*apikey.APIKey, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*apikey.APIKey), args.Error(1)
}

func (m *MockRepository) Revoke(id int64, revokedAt time.Time) error {
	args := m.Called(id, revokedAt)
	return args.Error(0)
}

func (m *MockRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockRepository) UpdateLastUsed(id int64, lastUsedAt time.Time) error {
	args := m.Called(id, lastUsedAt)
	return args.Error(0)
}

func (m *MockRepository) DeleteExpired() error {
	args := m.Called()
	return args.Error(0)
}

func TestNewManager(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)
	assert.NotNil(t, manager)
}

func TestManager_CreateAPIKey(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	future := time.Now().Add(24 * time.Hour)
	repo.On("Create", mock.AnythingOfType("*apikey.APIKey")).Return(nil)

	ak, err := manager.CreateAPIKey(1, "Test Key", []string{"read", "write"}, &future)
	require.NoError(t, err)
	assert.NotNil(t, ak)
	assert.Equal(t, int64(1), ak.UserID)
	assert.Equal(t, "Test Key", ak.Name)
	assert.NotEmpty(t, ak.Key)
	assert.Contains(t, ak.Key, "tzb_")
	assert.NotEmpty(t, ak.KeyHash)
	assert.NotEmpty(t, ak.KeyPrefix)

	repo.AssertExpectations(t)
}

func TestManager_ValidateAPIKey_Success(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	key := "tzb_test_key_123"
	keyHash := HashAPIKey(key)
	future := time.Now().Add(24 * time.Hour)

	expectedKey := &apikey.APIKey{
		ID:        1,
		UserID:    1,
		IsRevoked: false,
		ExpiresAt: &future,
	}

	repo.On("GetByKeyHash", keyHash).Return(expectedKey, nil)
	repo.On("UpdateLastUsed", int64(1), mock.AnythingOfType("time.Time")).Return(nil)

	ak, err := manager.ValidateAPIKey(key)
	require.NoError(t, err)
	assert.NotNil(t, ak)
	assert.Equal(t, int64(1), ak.ID)

	repo.AssertExpectations(t)
}

func TestManager_ValidateAPIKey_Revoked(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	key := "tzb_test_key_123"
	keyHash := HashAPIKey(key)
	now := time.Now()

	revokedKey := &apikey.APIKey{
		ID:        1,
		IsRevoked: true,
		RevokedAt: &now,
	}

	repo.On("GetByKeyHash", keyHash).Return(revokedKey, nil)

	ak, err := manager.ValidateAPIKey(key)
	assert.Error(t, err)
	assert.Nil(t, ak)
	assert.Contains(t, err.Error(), "revoked")

	repo.AssertExpectations(t)
}

func TestManager_ValidateAPIKey_Expired(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	key := "tzb_test_key_123"
	keyHash := HashAPIKey(key)
	past := time.Now().Add(-24 * time.Hour)

	expiredKey := &apikey.APIKey{
		ID:        1,
		IsRevoked: false,
		ExpiresAt: &past,
	}

	repo.On("GetByKeyHash", keyHash).Return(expiredKey, nil)

	ak, err := manager.ValidateAPIKey(key)
	assert.Error(t, err)
	assert.Nil(t, ak)
	assert.Contains(t, err.Error(), "expired")

	repo.AssertExpectations(t)
}

func TestManager_RevokeAPIKey(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	repo.On("Revoke", int64(1), mock.AnythingOfType("time.Time")).Return(nil)

	err := manager.RevokeAPIKey(1)
	require.NoError(t, err)

	repo.AssertExpectations(t)
}

func TestManager_GetUserAPIKeys(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	expectedKeys := []*apikey.APIKey{
		{ID: 1, UserID: 1, Name: "Key 1"},
		{ID: 2, UserID: 1, Name: "Key 2"},
	}

	repo.On("GetByUserID", int64(1)).Return(expectedKeys, nil)

	keys, err := manager.GetUserAPIKeys(1)
	require.NoError(t, err)
	assert.Len(t, keys, 2)

	repo.AssertExpectations(t)
}

func TestManager_DeleteAPIKey(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	repo.On("Delete", int64(1)).Return(nil)

	err := manager.DeleteAPIKey(1)
	require.NoError(t, err)

	repo.AssertExpectations(t)
}

func TestManager_CleanupExpiredKeys(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	repo.On("DeleteExpired").Return(nil)

	err := manager.CleanupExpiredKeys()
	require.NoError(t, err)

	repo.AssertExpectations(t)
}

func TestManager_RotateAPIKey(t *testing.T) {
	repo := new(MockRepository)
	manager := NewManager(repo)

	future := time.Now().Add(24 * time.Hour)
	oldKey := &apikey.APIKey{
		ID:          1,
		UserID:      1,
		Name:        "Old Key",
		Permissions: []string{"read", "write"},
		ExpiresAt:   &future,
	}

	repo.On("GetByID", int64(1)).Return(oldKey, nil)
	repo.On("Create", mock.AnythingOfType("*apikey.APIKey")).Return(nil)
	repo.On("Revoke", int64(1), mock.AnythingOfType("time.Time")).Return(nil)

	newKey, err := manager.RotateAPIKey(1)
	require.NoError(t, err)
	assert.NotNil(t, newKey)
	assert.Equal(t, oldKey.UserID, newKey.UserID)
	assert.Equal(t, oldKey.Name, newKey.Name)

	repo.AssertExpectations(t)
}

func TestHashAPIKey(t *testing.T) {
	key := "test_key_123"
	hash1 := HashAPIKey(key)
	hash2 := HashAPIKey(key)

	assert.Equal(t, hash1, hash2, "same key should produce same hash")
	assert.Len(t, hash1, 64, "SHA-256 hash should be 64 hex characters")

	hash3 := HashAPIKey("different_key")
	assert.NotEqual(t, hash1, hash3, "different keys should produce different hashes")
}
