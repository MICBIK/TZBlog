package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStatsRepository is a mock implementation
type MockStatsRepository struct {
	mock.Mock
}

func (m *MockStatsRepository) GetTotalArticles() (int64, error) {
	args := m.Called()
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockStatsRepository) GetTotalViews() (int64, error) {
	args := m.Called()
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockStatsRepository) GetTotalComments() (int64, error) {
	args := m.Called()
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockStatsRepository) GetTotalLikes() (int64, error) {
	args := m.Called()
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockStatsRepository) GetPopularArticles(limit int) ([]interface{}, error) {
	args := m.Called(limit)
	return args.Get(0).([]interface{}), args.Error(1)
}

func TestStatsHandler_GetStats_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockStatsRepository)
	handler := NewStatsHandler(mockRepo)

	mockRepo.On("GetTotalArticles").Return(int64(100), nil)
	mockRepo.On("GetTotalViews").Return(int64(5000), nil)
	mockRepo.On("GetTotalComments").Return(int64(300), nil)
	mockRepo.On("GetTotalLikes").Return(int64(800), nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/stats", nil)

	handler.GetStats(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestStatsHandler_GetPopularArticles_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockRepo := new(MockStatsRepository)
	handler := NewStatsHandler(mockRepo)

	articles := []interface{}{
		map[string]interface{}{"id": 1, "title": "Popular 1"},
		map[string]interface{}{"id": 2, "title": "Popular 2"},
	}

	mockRepo.On("GetPopularArticles", 10).Return(articles, nil)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/stats/popular", nil)

	handler.GetPopularArticles(c)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}
