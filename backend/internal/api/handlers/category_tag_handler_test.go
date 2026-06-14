package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockCategoryRepository is a mock implementation
type MockCategoryRepository struct {
	mock.Mock
}

func (m *MockCategoryRepository) Create(c interface{}) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *MockCategoryRepository) FindAll() ([]interface{}, error) {
	args := m.Called()
	return args.Get(0).([]interface{}), args.Error(1)
}

func (m *MockCategoryRepository) FindBySlug(slug string) (interface{}, error) {
	args := m.Called(slug)
	return args.Get(0), args.Error(1)
}

func (m *MockCategoryRepository) Update(c interface{}) error {
	args := m.Called(c)
	return args.Error(0)
}

func (m *MockCategoryRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestCategoryHandler_GetAllCategories_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockCategoryRepository)
	handler := NewCategoryHandler(mockRepo)

	categories := []interface{}{
		map[string]interface{}{"id": 1, "name": "Tech"},
		map[string]interface{}{"id": 2, "name": "Science"},
	}

	mockRepo.On("FindAll").Return(categories, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/categories", nil)

	handler.GetAllCategories(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

// MockTagRepository is a mock implementation
type MockTagRepository struct {
	mock.Mock
}

func (m *MockTagRepository) Create(t interface{}) error {
	args := m.Called(t)
	return args.Error(0)
}

func (m *MockTagRepository) FindAll() ([]interface{}, error) {
	args := m.Called()
	return args.Get(0).([]interface{}), args.Error(1)
}

func (m *MockTagRepository) FindBySlug(slug string) (interface{}, error) {
	args := m.Called(slug)
	return args.Get(0), args.Error(1)
}

func (m *MockTagRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestTagHandler_GetAllTags_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockTagRepository)
	handler := NewTagHandler(mockRepo)

	tags := []interface{}{
		map[string]interface{}{"id": 1, "name": "Go"},
		map[string]interface{}{"id": 2, "name": "Python"},
	}

	mockRepo.On("FindAll").Return(tags, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/tags", nil)

	handler.GetAllTags(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}
