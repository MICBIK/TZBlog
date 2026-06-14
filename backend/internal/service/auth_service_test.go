package service

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/pkg/auth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository is a mock implementation of user.UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(u *user.User) error {
	args := m.Called(u)
	return args.Error(0)
}

func (m *MockUserRepository) Update(u *user.User) error {
	args := m.Called(u)
	return args.Error(0)
}

func (m *MockUserRepository) FindByID(id int64) (*user.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(email string) (*user.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserRepository) FindByUsername(username string) (*user.User, error) {
	args := m.Called(username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserRepository) List(limit, offset int) ([]*user.User, int64, error) {
	args := m.Called(limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*user.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateLastLogin(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserRepository) Count() (int64, error) {
	args := m.Called()
	return args.Get(0).(int64), args.Error(1)
}

func TestRegister_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	mockRepo.On("FindByUsername", "testuser").Return(nil, nil)
	mockRepo.On("FindByEmail", "test@example.com").Return(nil, nil)
	mockRepo.On("Create", mock.AnythingOfType("*user.User")).Return(nil)

	dto := &user.RegisterDTO{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}

	// Act
	resp, err := service.Register(dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, "testuser", resp.User.Username)
	mockRepo.AssertExpectations(t)
}

func TestRegister_UsernameExists(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	existingUser := &user.User{ID: 1, Username: "testuser"}
	mockRepo.On("FindByUsername", "testuser").Return(existingUser, nil)

	dto := &user.RegisterDTO{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}

	// Act
	resp, err := service.Register(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, user.ErrUsernameExists, err)
	mockRepo.AssertExpectations(t)
}

func TestRegister_EmailExists(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	existingUser := &user.User{ID: 1, Email: "test@example.com"}
	mockRepo.On("FindByUsername", "testuser").Return(nil, nil)
	mockRepo.On("FindByEmail", "test@example.com").Return(existingUser, nil)

	dto := &user.RegisterDTO{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}

	// Act
	resp, err := service.Register(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, user.ErrEmailExists, err)
	mockRepo.AssertExpectations(t)
}

func TestLogin_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	testUser := &user.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
		Role:     "user",
		Status:   user.StatusActive,
	}
	testUser.SetPassword("password123")

	mockRepo.On("FindByEmail", "test@example.com").Return(testUser, nil)
	mockRepo.On("UpdateLastLogin", int64(1)).Return(nil).Maybe()

	dto := &user.LoginDTO{
		Login:    "test@example.com",
		Password: "password123",
	}

	// Act
	resp, err := service.Login(dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.NotEmpty(t, resp.Token)
	assert.Equal(t, int64(1), resp.User.ID)

	// Give goroutine time to complete
	time.Sleep(10 * time.Millisecond)

	mockRepo.AssertExpectations(t)
}

func TestLogin_InvalidCredentials(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	testUser := &user.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
		Role:     "user",
		Status:   user.StatusActive,
	}
	testUser.SetPassword("correctpassword")

	mockRepo.On("FindByEmail", "test@example.com").Return(testUser, nil)

	dto := &user.LoginDTO{
		Login:    "test@example.com",
		Password: "wrongpassword",
	}

	// Act
	resp, err := service.Login(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, user.ErrInvalidCredentials, err)
	mockRepo.AssertExpectations(t)
}

func TestLogin_UserNotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	mockRepo.On("FindByEmail", "nonexistent@example.com").Return(nil, nil)

	dto := &user.LoginDTO{
		Login:    "nonexistent@example.com",
		Password: "password123",
	}

	// Act
	resp, err := service.Login(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, user.ErrInvalidCredentials, err)
	mockRepo.AssertExpectations(t)
}

func TestLogin_AccountBanned(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	bannedUser := &user.User{
		ID:       1,
		Username: "banneduser",
		Email:    "banned@example.com",
		Role:     "user",
		Status:   user.StatusBanned,
	}
	bannedUser.SetPassword("password123")

	mockRepo.On("FindByEmail", "banned@example.com").Return(bannedUser, nil)

	dto := &user.LoginDTO{
		Login:    "banned@example.com",
		Password: "password123",
	}

	// Act
	resp, err := service.Login(dto)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, resp)
	assert.Equal(t, user.ErrAccountBanned, err)
	mockRepo.AssertExpectations(t)
}

func TestGetUserByID_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	testUser := &user.User{
		ID:       1,
		Username: "testuser",
		Email:    "test@example.com",
	}

	mockRepo.On("FindByID", int64(1)).Return(testUser, nil)

	// Act
	usr, err := service.GetUserByID(1)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, usr)
	assert.Equal(t, int64(1), usr.ID)
	mockRepo.AssertExpectations(t)
}

func TestGetUserByID_NotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	mockRepo.On("FindByID", int64(999)).Return(nil, nil)

	// Act
	usr, err := service.GetUserByID(999)

	// Assert
	assert.Error(t, err)
	assert.Nil(t, usr)
	assert.Equal(t, user.ErrUserNotFound, err)
	mockRepo.AssertExpectations(t)
}

func TestUpdateProfile_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	testUser := &user.User{
		ID:          1,
		Username:    "testuser",
		DisplayName: "Old Name",
		Bio:         "Old bio",
	}

	mockRepo.On("FindByID", int64(1)).Return(testUser, nil)
	mockRepo.On("Update", mock.AnythingOfType("*user.User")).Return(nil)

	newDisplayName := "New Name"
	newBio := "New bio"
	dto := &user.UpdateProfileDTO{
		DisplayName: &newDisplayName,
		Bio:         &newBio,
	}

	// Act
	usr, err := service.UpdateProfile(1, dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, usr)
	assert.Equal(t, "New Name", usr.DisplayName)
	assert.Equal(t, "New bio", usr.Bio)
	mockRepo.AssertExpectations(t)
}

func TestUpdateProfile_NoChanges(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	testUser := &user.User{
		ID:          1,
		Username:    "testuser",
		DisplayName: "Same Name",
	}

	mockRepo.On("FindByID", int64(1)).Return(testUser, nil)

	sameDisplayName := "Same Name"
	dto := &user.UpdateProfileDTO{
		DisplayName: &sameDisplayName,
	}

	// Act
	usr, err := service.UpdateProfile(1, dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, usr)
	mockRepo.AssertExpectations(t)
}

func TestChangePassword_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	testUser := &user.User{
		ID:       1,
		Username: "testuser",
	}
	testUser.SetPassword("oldpassword123")

	mockRepo.On("FindByID", int64(1)).Return(testUser, nil)
	mockRepo.On("Update", mock.AnythingOfType("*user.User")).Return(nil)

	dto := &user.ChangePasswordDTO{
		CurrentPassword: "oldpassword123",
		NewPassword:     "newpassword456",
	}

	// Act
	err := service.ChangePassword(1, dto)

	// Assert
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestChangePassword_WrongCurrentPassword(t *testing.T) {
	// Arrange
	mockRepo := new(MockUserRepository)
	jwtAuth := auth.NewJWTAuth("test-secret", 3600*time.Second)
	service := NewAuthService(mockRepo, jwtAuth)

	testUser := &user.User{
		ID:       1,
		Username: "testuser",
	}
	testUser.SetPassword("correctpassword")

	mockRepo.On("FindByID", int64(1)).Return(testUser, nil)

	dto := &user.ChangePasswordDTO{
		CurrentPassword: "wrongpassword",
		NewPassword:     "newpassword456",
	}

	// Act
	err := service.ChangePassword(1, dto)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, user.ErrInvalidCredentials, err)
	mockRepo.AssertExpectations(t)
}
