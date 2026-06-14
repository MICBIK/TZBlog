package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockTagRepository is a mock implementation of tag.TagRepository
type MockTagRepository struct {
	mock.Mock
}

func (m *MockTagRepository) Create(t *tag.Tag) error {
	args := m.Called(t)
	return args.Error(0)
}

func (m *MockTagRepository) FindByID(id int64) (*tag.Tag, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*tag.Tag), args.Error(1)
}

func (m *MockTagRepository) FindBySlug(slug string) (*tag.Tag, error) {
	args := m.Called(slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*tag.Tag), args.Error(1)
}

func (m *MockTagRepository) List(limit, offset int) ([]*tag.Tag, int64, error) {
	args := m.Called(limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*tag.Tag), args.Get(1).(int64), args.Error(2)
}

func (m *MockTagRepository) Update(t *tag.Tag) error {
	args := m.Called(t)
	return args.Error(0)
}

func (m *MockTagRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockTagRepository) FindByNames(names []string) ([]*tag.Tag, error) {
	args := m.Called(names)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*tag.Tag), args.Error(1)
}

func (m *MockTagRepository) FindByArticleID(articleID int64) ([]*tag.Tag, error) {
	args := m.Called(articleID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*tag.Tag), args.Error(1)
}

func TestTagHandler_List(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		queryParams    string
		mockTags       []*tag.Tag
		mockTotal      int64
		mockError      error
		expectedStatus int
		expectedPage   int
		expectedLimit  int
	}{
		{
			name:        "successful list with defaults",
			queryParams: "",
			mockTags: []*tag.Tag{
				{ID: 1, Name: "Go", Slug: "go", CreatedAt: now, UpdatedAt: now},
				{ID: 2, Name: "Rust", Slug: "rust", CreatedAt: now, UpdatedAt: now},
			},
			mockTotal:      2,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   1,
			expectedLimit:  50,
		},
		{
			name:        "list with pagination",
			queryParams: "?page=2&limit=10",
			mockTags: []*tag.Tag{
				{ID: 11, Name: "Tag11", Slug: "tag-11", CreatedAt: now, UpdatedAt: now},
			},
			mockTotal:      25,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   2,
			expectedLimit:  10,
		},
		{
			name:           "service error",
			queryParams:    "",
			mockTags:       nil,
			mockTotal:      0,
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
			expectedPage:   1,
			expectedLimit:  50,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockTagRepository)
			handler := NewTagHandler(mockRepo)

			offset := (tt.expectedPage - 1) * tt.expectedLimit
			mockRepo.On("List", tt.expectedLimit, offset).
				Return(tt.mockTags, tt.mockTotal, tt.mockError)

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/tags"+tt.queryParams, nil)

			// Act
			handler.List(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))

				metadata := response["metadata"].(map[string]interface{})
				assert.Equal(t, float64(tt.expectedPage), metadata["page"])
				assert.Equal(t, float64(tt.expectedLimit), metadata["limit"])
				assert.Equal(t, float64(tt.mockTotal), metadata["total"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestTagHandler_Create(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		requestBody    interface{}
		mockError      error
		expectedStatus int
	}{
		{
			name: "successful create",
			requestBody: tag.Tag{
				Name: "Go",
				Slug: "go",
			},
			mockError:      nil,
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "invalid request body",
			requestBody:    `{"invalid": json}`,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing name",
			requestBody: tag.Tag{
				Slug: "go",
			},
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing slug",
			requestBody: tag.Tag{
				Name: "Go",
			},
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "tag already exists",
			requestBody: tag.Tag{
				Name: "Go",
				Slug: "go",
			},
			mockError:      tag.ErrTagExists,
			expectedStatus: http.StatusConflict,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockTagRepository)
			handler := NewTagHandler(mockRepo)

			if tt.expectedStatus == http.StatusCreated || tt.mockError != nil {
				mockRepo.On("Create", mock.AnythingOfType("*tag.Tag")).Return(tt.mockError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/tags", bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.Create(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusCreated {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestTagHandler_GetByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		tagID          string
		mockTag        *tag.Tag
		mockError      error
		expectedStatus int
	}{
		{
			name:  "successful get",
			tagID: "1",
			mockTag: &tag.Tag{
				ID:        1,
				Name:      "Go",
				Slug:      "go",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid tag ID",
			tagID:          "invalid",
			mockTag:        nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "tag not found - nil return",
			tagID:          "999",
			mockTag:        nil,
			mockError:      nil,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "tag not found - error",
			tagID:          "999",
			mockTag:        nil,
			mockError:      tag.ErrTagNotFound,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockTagRepository)
			handler := NewTagHandler(mockRepo)

			if tt.tagID != "invalid" {
				mockRepo.On("FindByID", int64(1)).Return(tt.mockTag, tt.mockError).Maybe()
				mockRepo.On("FindByID", int64(999)).Return(tt.mockTag, tt.mockError).Maybe()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "id", Value: tt.tagID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/tags/"+tt.tagID, nil)

			// Act
			handler.GetByID(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}
