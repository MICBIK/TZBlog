package service

import (
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockCommentRepository is a mock implementation of comment.Repository
type MockCommentRepository struct {
	mock.Mock
}

func (m *MockCommentRepository) Create(c *comment.Comment) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *MockCommentRepository) FindByID(id int64) (*comment.Comment, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*comment.Comment), args.Error(1)
}

func (m *MockCommentRepository) FindByArticleID(articleID int64, limit, offset int) ([]*comment.Comment, int64, error) {
	args := m.Called(articleID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*comment.Comment), args.Get(1).(int64), args.Error(2)
}

func (m *MockCommentRepository) Update(c *comment.Comment) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *MockCommentRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockCommentRepository) List(filter *comment.ListFilter) ([]*comment.Comment, int64, error) {
	args := m.Called(filter)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*comment.Comment), args.Get(1).(int64), args.Error(2)
}

func (m *MockCommentRepository) CountByArticleID(articleID int64) (int64, error) {
	args := m.Called(articleID)
	return args.Get(0).(int64), args.Error(1)
}

// TestCreateComment_Success tests successful comment creation
func TestCreateComment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	dto := &CreateCommentDTO{
		ArticleID: 1,
		Content:   "This is a test comment",
	}

	mockRepo.On("Create", mock.AnythingOfType("*comment.Comment")).Return(nil)

	// Act
	result, err := service.CreateComment(1, dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(1), result.ArticleID)
	assert.Equal(t, int64(1), result.UserID)
	assert.Equal(t, "This is a test comment", result.Content)
	mockRepo.AssertExpectations(t)
}

// TestCreateComment_WithParent tests creating a reply comment
func TestCreateComment_WithParent(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	parentID := int64(10)
	dto := &CreateCommentDTO{
		ArticleID: 1,
		ParentID:  &parentID,
		Content:   "This is a reply",
	}

	parentComment := &comment.Comment{
		ID:        10,
		ArticleID: 1,
		Content:   "Parent comment",
	}

	mockRepo.On("FindByID", int64(10)).Return(parentComment, nil)
	mockRepo.On("Create", mock.AnythingOfType("*comment.Comment")).Return(nil)

	// Act
	result, err := service.CreateComment(2, dto)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, &parentID, result.ParentID)
	mockRepo.AssertExpectations(t)
}

// TestCreateComment_InvalidParent tests creating comment with invalid parent
func TestCreateComment_InvalidParent(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	parentID := int64(999)
	dto := &CreateCommentDTO{
		ArticleID: 1,
		ParentID:  &parentID,
		Content:   "This is a reply",
	}

	mockRepo.On("FindByID", int64(999)).Return(nil, nil)

	// Act
	result, err := service.CreateComment(2, dto)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, comment.ErrInvalidParent, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// TestGetCommentByID_Success tests successful comment retrieval by ID
func TestGetCommentByID_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	expected := &comment.Comment{
		ID:      1,
		Content: "Test comment",
	}

	mockRepo.On("FindByID", int64(1)).Return(expected, nil)

	// Act
	result, err := service.GetCommentByID(1)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expected, result)
	mockRepo.AssertExpectations(t)
}

// TestGetCommentByID_NotFound tests comment not found scenario
func TestGetCommentByID_NotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	mockRepo.On("FindByID", int64(999)).Return(nil, nil)

	// Act
	result, err := service.GetCommentByID(999)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, comment.ErrCommentNotFound, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// TestListComments_Success tests successful comment listing
func TestListComments_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	filter := &comment.ListFilter{
		ArticleID: 1,
		Limit:     20,
	}

	expectedComments := []*comment.Comment{
		{ID: 1, Content: "Comment 1"},
		{ID: 2, Content: "Comment 2"},
	}

	mockRepo.On("List", mock.AnythingOfType("*comment.ListFilter")).Return(expectedComments, int64(2), nil)

	// Act
	comments, total, err := service.ListComments(filter)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedComments, comments)
	assert.Equal(t, int64(2), total)
	mockRepo.AssertExpectations(t)
}

// TestUpdateComment_Success tests successful comment update
func TestUpdateComment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	existingComment := &comment.Comment{
		ID:        1,
		UserID:    1,
		ArticleID: 1,
		Content:   "Old content",
	}

	dto := &UpdateCommentDTO{
		Content: "Updated content",
	}

	mockRepo.On("FindByID", int64(1)).Return(existingComment, nil)
	mockRepo.On("Update", mock.AnythingOfType("*comment.Comment")).Return(nil)

	// Act
	result, err := service.UpdateComment(1, 1, dto)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, "Updated content", result.Content)
	mockRepo.AssertExpectations(t)
}

// TestUpdateComment_Unauthorized tests unauthorized update attempt
func TestUpdateComment_Unauthorized(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	existingComment := &comment.Comment{
		ID:        1,
		UserID:    1,
		ArticleID: 1,
		Content:   "Content",
	}

	dto := &UpdateCommentDTO{
		Content: "Updated content",
	}

	mockRepo.On("FindByID", int64(1)).Return(existingComment, nil)

	// Act
	result, err := service.UpdateComment(1, 2, dto) // Different user ID

	// Assert
	assert.Error(t, err)
	assert.Equal(t, comment.ErrUnauthorized, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// TestDeleteComment_Success tests successful comment deletion
func TestDeleteComment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	existingComment := &comment.Comment{
		ID:     1,
		UserID: 1,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingComment, nil)
	mockRepo.On("Delete", int64(1)).Return(nil)

	// Act
	err := service.DeleteComment(1, 1)

	// Assert
	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// TestDeleteComment_Unauthorized tests unauthorized delete attempt
func TestDeleteComment_Unauthorized(t *testing.T) {
	// Arrange
	mockRepo := new(MockCommentRepository)
	service := NewCommentService(mockRepo)

	existingComment := &comment.Comment{
		ID:     1,
		UserID: 1,
	}

	mockRepo.On("FindByID", int64(1)).Return(existingComment, nil)

	// Act
	err := service.DeleteComment(1, 2) // Different user ID

	// Assert
	assert.Error(t, err)
	assert.Equal(t, comment.ErrUnauthorized, err)
	mockRepo.AssertExpectations(t)
}
