package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/category"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockCategoryRepository is a mock implementation of category.CategoryRepository
type MockCategoryRepository struct {
	mock.Mock
}

func (m *MockCategoryRepository) Create(cat *category.Category) error {
	args := m.Called(cat)
	return args.Error(0)
}

func (m *MockCategoryRepository) FindByID(id int64) (*category.Category, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*category.Category), args.Error(1)
}

func (m *MockCategoryRepository) FindBySlug(slug string) (*category.Category, error) {
	args := m.Called(slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*category.Category), args.Error(1)
}

func (m *MockCategoryRepository) List(limit, offset int) ([]*category.Category, int64, error) {
	args := m.Called(limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*category.Category), args.Get(1).(int64), args.Error(2)
}

func (m *MockCategoryRepository) Update(cat *category.Category) error {
	args := m.Called(cat)
	return args.Error(0)
}

func (m *MockCategoryRepository) Delete(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestCategoryHandler_List(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		queryParams    string
		mockCategories []*category.Category
		mockTotal      int64
		mockError      error
		expectedStatus int
		expectedPage   int
		expectedLimit  int
	}{
		{
			name:        "successful list with defaults",
			queryParams: "",
			mockCategories: []*category.Category{
				{
					ID:        1,
					Name:      "Technology",
					Slug:      "tech",
					CreatedAt: now,
					UpdatedAt: now,
				},
				{
					ID:        2,
					Name:      "Lifestyle",
					Slug:      "lifestyle",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      2,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   1,
			expectedLimit:  20,
		},
		{
			name:        "list with pagination",
			queryParams: "?page=2&limit=10",
			mockCategories: []*category.Category{
				{
					ID:        11,
					Name:      "Category 11",
					Slug:      "category-11",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      25,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   2,
			expectedLimit:  10,
		},
		{
			name:        "list clamps oversized limit",
			queryParams: "?page=1&limit=1000000",
			mockCategories: []*category.Category{
				{
					ID:        1,
					Name:      "Technology",
					Slug:      "tech",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   1,
			expectedLimit:  100,
		},
		{
			name:           "service error",
			queryParams:    "",
			mockCategories: nil,
			mockTotal:      0,
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
			expectedPage:   1,
			expectedLimit:  20,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockCategoryRepository)
			handler := NewCategoryHandler(mockRepo)

			offset := (tt.expectedPage - 1) * tt.expectedLimit
			mockRepo.On("List", tt.expectedLimit, offset).
				Return(tt.mockCategories, tt.mockTotal, tt.mockError)

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/categories"+tt.queryParams, nil)

			// Act
			handler.List(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])

				metadata := response["metadata"].(map[string]interface{})
				assert.Equal(t, float64(tt.expectedPage), metadata["page"])
				assert.Equal(t, float64(tt.expectedLimit), metadata["limit"])
				assert.Equal(t, float64(tt.mockTotal), metadata["total"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestCategoryHandler_Create(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		requestBody    interface{}
		mockError      error
		expectedStatus int
	}{
		{
			name: "successful create",
			requestBody: category.Category{
				Name:        "Technology",
				Slug:        "tech",
				Description: "Technology articles",
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
			requestBody: category.Category{
				Slug: "tech",
			},
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "missing slug",
			requestBody: category.Category{
				Name: "Technology",
			},
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "category already exists",
			requestBody: category.Category{
				Name: "Technology",
				Slug: "tech",
			},
			mockError:      category.ErrCategoryExists,
			expectedStatus: http.StatusConflict,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockCategoryRepository)
			handler := NewCategoryHandler(mockRepo)

			if tt.expectedStatus == http.StatusCreated || tt.mockError != nil {
				mockRepo.On("Create", mock.AnythingOfType("*category.Category")).
					Return(tt.mockError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/categories", bytes.NewReader(body))
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
				assert.NotNil(t, response["data"])
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestCategoryHandler_GetByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		categoryID     string
		mockCategory   *category.Category
		mockError      error
		expectedStatus int
	}{
		{
			name:       "successful get",
			categoryID: "1",
			mockCategory: &category.Category{
				ID:          1,
				Name:        "Technology",
				Slug:        "tech",
				Description: "Tech articles",
				CreatedAt:   now,
				UpdatedAt:   now,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid category ID",
			categoryID:     "invalid",
			mockCategory:   nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "category not found - nil return",
			categoryID:     "999",
			mockCategory:   nil,
			mockError:      nil,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "category not found - error",
			categoryID:     "999",
			mockCategory:   nil,
			mockError:      category.ErrCategoryNotFound,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockRepo := new(MockCategoryRepository)
			handler := NewCategoryHandler(mockRepo)

			if tt.categoryID != "invalid" {
				mockRepo.On("FindByID", int64(1)).Return(tt.mockCategory, tt.mockError).Maybe()
				mockRepo.On("FindByID", int64(999)).Return(tt.mockCategory, tt.mockError).Maybe()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "id", Value: tt.categoryID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/categories/"+tt.categoryID, nil)

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
