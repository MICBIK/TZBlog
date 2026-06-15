package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockArticleService is a mock implementation of article.Service
type MockArticleService struct {
	mock.Mock
}

func (m *MockArticleService) CreateArticle(userID int64, dto *article.CreateArticleDTO) (*article.Article, error) {
	args := m.Called(userID, dto)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*article.Article), args.Error(1)
}

func (m *MockArticleService) GetArticleByID(id int64) (*article.Article, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*article.Article), args.Error(1)
}

func (m *MockArticleService) GetArticleBySlug(slug string) (*article.Article, error) {
	args := m.Called(slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*article.Article), args.Error(1)
}

func (m *MockArticleService) ListArticles(filter *article.ListFilter) ([]*article.Article, int64, error) {
	args := m.Called(filter)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*article.Article), args.Get(1).(int64), args.Error(2)
}

func (m *MockArticleService) UpdateArticle(id, userID int64, dto *article.UpdateArticleDTO) (*article.Article, error) {
	args := m.Called(id, userID, dto)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*article.Article), args.Error(1)
}

func (m *MockArticleService) DeleteArticle(id, userID int64) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockArticleService) PatchArticle(slug string, userID int64, updates map[string]interface{}) (*article.Article, error) {
	args := m.Called(slug, userID, updates)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*article.Article), args.Error(1)
}

func (m *MockArticleService) BatchDelete(ids []int64, userID int64) (int, error) {
	args := m.Called(ids, userID)
	return args.Int(0), args.Error(1)
}

func (m *MockArticleService) BatchUpdateStatus(ids []int64, userID int64, status string) (int, error) {
	args := m.Called(ids, userID, status)
	return args.Int(0), args.Error(1)
}

func TestArticleHandler_CreateArticle(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		userID         int64
		requestBody    interface{}
		mockArticle    *article.Article
		mockError      error
		expectedStatus int
	}{
		{
			name:   "successful create",
			userID: 123,
			requestBody: article.CreateArticleDTO{
				Title:      "Test Article",
				Content:    "This is test content",
				Summary:    "Test summary",
				CategoryID: 1,
				Status:     "draft",
			},
			mockArticle: &article.Article{
				ID:         1,
				Title:      "Test Article",
				Slug:       "test-article",
				Content:    "This is test content",
				Summary:    "Test summary",
				AuthorID:   123,
				CategoryID: 1,
				Status:     "draft",
				CreatedAt:  now,
				UpdatedAt:  now,
			},
			mockError:      nil,
			expectedStatus: http.StatusCreated,
		},
		{
			name:   "missing user_id",
			userID: 0,
			requestBody: article.CreateArticleDTO{
				Title:      "Test Article",
				Content:    "This is test content",
				CategoryID: 1,
				Status:     "draft",
			},
			mockArticle:    nil,
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "invalid request body",
			userID:         123,
			requestBody:    `{"invalid": json}`,
			mockArticle:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "missing required fields",
			userID: 123,
			requestBody: article.CreateArticleDTO{
				Title: "Test Article",
				// Missing Content and CategoryID
			},
			mockArticle:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "service error - slug exists",
			userID: 123,
			requestBody: article.CreateArticleDTO{
				Title:      "Test Article",
				Content:    "This is test content",
				CategoryID: 1,
				Status:     "draft",
			},
			mockArticle:    nil,
			mockError:      article.ErrArticleSlugExists,
			expectedStatus: http.StatusConflict,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockArticleService)
			handler := NewArticleHandler(mockService)

			if tt.expectedStatus == http.StatusCreated {
				mockService.On("CreateArticle", tt.userID, mock.AnythingOfType("*article.CreateArticleDTO")).
					Return(tt.mockArticle, tt.mockError)
			} else if tt.mockError != nil {
				mockService.On("CreateArticle", tt.userID, mock.AnythingOfType("*article.CreateArticleDTO")).
					Return(tt.mockArticle, tt.mockError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.userID)
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/articles", bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.CreateArticle(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusCreated {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestArticleHandler_GetArticleByID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		articleID      string
		mockArticle    *article.Article
		mockError      error
		expectedStatus int
	}{
		{
			name:      "successful get",
			articleID: "1",
			mockArticle: &article.Article{
				ID:        1,
				Title:     "Test Article",
				Slug:      "test-article",
				Content:   "This is test content",
				AuthorID:  123,
				Status:    "published",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid article ID",
			articleID:      "invalid",
			mockArticle:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "article not found",
			articleID:      "999",
			mockArticle:    nil,
			mockError:      article.ErrArticleNotFound,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockArticleService)
			handler := NewArticleHandler(mockService)

			if tt.articleID != "invalid" {
				mockService.On("GetArticleByID", int64(1)).Return(tt.mockArticle, tt.mockError).Maybe()
				mockService.On("GetArticleByID", int64(999)).Return(tt.mockArticle, tt.mockError).Maybe()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "id", Value: tt.articleID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/articles/"+tt.articleID, nil)

			// Act
			handler.GetArticleByID(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestArticleHandler_GetArticleBySlug(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		slug           string
		mockArticle    *article.Article
		mockError      error
		expectedStatus int
	}{
		{
			name: "successful get by slug",
			slug: "test-article",
			mockArticle: &article.Article{
				ID:        1,
				Title:     "Test Article",
				Slug:      "test-article",
				Content:   "This is test content",
				AuthorID:  123,
				Status:    "published",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "empty slug",
			slug:           "",
			mockArticle:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "article not found",
			slug:           "nonexistent-article",
			mockArticle:    nil,
			mockError:      article.ErrArticleNotFound,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockArticleService)
			handler := NewArticleHandler(mockService)

			if tt.slug != "" {
				mockService.On("GetArticleBySlug", tt.slug).Return(tt.mockArticle, tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "slug", Value: tt.slug}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/articles/slug/"+tt.slug, nil)

			// Act
			handler.GetArticleBySlug(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestArticleHandler_ListArticles(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		queryParams    string
		mockArticles   []*article.Article
		mockTotal      int64
		mockError      error
		expectedStatus int
		expectedPage   int
		expectedLimit  int
	}{
		{
			name:        "successful list with defaults",
			queryParams: "",
			mockArticles: []*article.Article{
				{
					ID:        1,
					Title:     "Article 1",
					Slug:      "article-1",
					AuthorID:  123,
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
				{
					ID:        2,
					Title:     "Article 2",
					Slug:      "article-2",
					AuthorID:  123,
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      2,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   1,
			expectedLimit:  10,
		},
		{
			name:        "list with pagination",
			queryParams: "?page=2&limit=5",
			mockArticles: []*article.Article{
				{
					ID:        6,
					Title:     "Article 6",
					Slug:      "article-6",
					AuthorID:  123,
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      10,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   2,
			expectedLimit:  5,
		},
		{
			name:        "list with filters",
			queryParams: "?status=published&author_id=123&search=test",
			mockArticles: []*article.Article{
				{
					ID:        1,
					Title:     "Test Article",
					Slug:      "test-article",
					AuthorID:  123,
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   1,
			expectedLimit:  10,
		},
		{
			name:           "service error",
			queryParams:    "",
			mockArticles:   nil,
			mockTotal:      0,
			mockError:      errors.New("internal error"),
			expectedStatus: http.StatusInternalServerError,
			expectedPage:   1,
			expectedLimit:  10,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockArticleService)
			handler := NewArticleHandler(mockService)

			mockService.On("ListArticles", mock.AnythingOfType("*article.ListFilter")).
				Return(tt.mockArticles, tt.mockTotal, tt.mockError)

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/articles"+tt.queryParams, nil)

			// Act
			handler.ListArticles(c)

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

			mockService.AssertExpectations(t)
		})
	}
}

func TestArticleHandler_UpdateArticle(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	newTitle := "Updated Title"
	newContent := "Updated content"

	tests := []struct {
		name              string
		slug              string
		userID            int64
		requestBody       interface{}
		mockGetArticle    *article.Article
		mockGetError      error
		mockUpdateArticle *article.Article
		mockUpdateError   error
		expectedStatus    int
	}{
		{
			name:   "successful update",
			slug:   "test-article",
			userID: 123,
			requestBody: article.UpdateArticleDTO{
				Title:   &newTitle,
				Content: &newContent,
			},
			mockGetArticle: &article.Article{
				ID:        1,
				Title:     "Test Article",
				Slug:      "test-article",
				Content:   "Original content",
				AuthorID:  123,
				Status:    "draft",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockGetError: nil,
			mockUpdateArticle: &article.Article{
				ID:        1,
				Title:     "Updated Title",
				Slug:      "test-article",
				Content:   "Updated content",
				AuthorID:  123,
				Status:    "draft",
				CreatedAt: now,
				UpdatedAt: time.Now(),
			},
			mockUpdateError: nil,
			expectedStatus:  http.StatusOK,
		},
		{
			name:              "empty slug",
			slug:              "",
			userID:            123,
			requestBody:       article.UpdateArticleDTO{},
			mockGetArticle:    nil,
			mockGetError:      nil,
			mockUpdateArticle: nil,
			mockUpdateError:   nil,
			expectedStatus:    http.StatusBadRequest,
		},
		{
			name:              "article not found",
			slug:              "nonexistent",
			userID:            123,
			requestBody:       article.UpdateArticleDTO{Title: &newTitle},
			mockGetArticle:    nil,
			mockGetError:      article.ErrArticleNotFound,
			mockUpdateArticle: nil,
			mockUpdateError:   nil,
			expectedStatus:    http.StatusNotFound,
		},
		{
			name:   "missing user_id",
			slug:   "test-article",
			userID: 0,
			requestBody: article.UpdateArticleDTO{
				Title: &newTitle,
			},
			mockGetArticle: &article.Article{
				ID:       1,
				Title:    "Test Article",
				Slug:     "test-article",
				AuthorID: 123,
			},
			mockGetError:      nil,
			mockUpdateArticle: nil,
			mockUpdateError:   nil,
			expectedStatus:    http.StatusUnauthorized,
		},
		{
			name:           "invalid request body",
			slug:           "test-article",
			userID:         123,
			requestBody:    `{"invalid": json}`,
			mockGetArticle: &article.Article{ID: 1, Slug: "test-article", AuthorID: 123},
			mockGetError:   nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "forbidden - not author",
			slug:   "test-article",
			userID: 456,
			requestBody: article.UpdateArticleDTO{
				Title: &newTitle,
			},
			mockGetArticle: &article.Article{
				ID:       1,
				Title:    "Test Article",
				Slug:     "test-article",
				AuthorID: 123,
			},
			mockGetError:      nil,
			mockUpdateArticle: nil,
			mockUpdateError:   article.ErrUnauthorized,
			expectedStatus:    http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockArticleService)
			handler := NewArticleHandler(mockService)

			if tt.slug != "" && tt.name != "invalid request body" {
				mockService.On("GetArticleBySlug", tt.slug).Return(tt.mockGetArticle, tt.mockGetError)
			} else if tt.name == "invalid request body" {
				mockService.On("GetArticleBySlug", tt.slug).Return(tt.mockGetArticle, tt.mockGetError)
			}

			if tt.mockUpdateArticle != nil || tt.mockUpdateError != nil {
				mockService.On("UpdateArticle", int64(1), tt.userID, mock.AnythingOfType("*article.UpdateArticleDTO")).
					Return(tt.mockUpdateArticle, tt.mockUpdateError)
			}

			var body []byte
			if str, ok := tt.requestBody.(string); ok {
				body = []byte(str)
			} else {
				body, _ = json.Marshal(tt.requestBody)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.userID)
			c.Params = gin.Params{{Key: "slug", Value: tt.slug}}
			c.Request = httptest.NewRequest(http.MethodPut, "/api/v1/articles/"+tt.slug, bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.UpdateArticle(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
				assert.NotNil(t, response["data"])
			}

			mockService.AssertExpectations(t)
		})
	}
}

func TestArticleHandler_DeleteArticle(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		slug           string
		userID         int64
		mockGetArticle *article.Article
		mockGetError   error
		mockDelError   error
		expectedStatus int
	}{
		{
			name:   "successful delete",
			slug:   "test-article",
			userID: 123,
			mockGetArticle: &article.Article{
				ID:        1,
				Title:     "Test Article",
				Slug:      "test-article",
				AuthorID:  123,
				Status:    "draft",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockGetError:   nil,
			mockDelError:   nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "empty slug",
			slug:           "",
			userID:         123,
			mockGetArticle: nil,
			mockGetError:   nil,
			mockDelError:   nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "article not found",
			slug:           "nonexistent",
			userID:         123,
			mockGetArticle: nil,
			mockGetError:   article.ErrArticleNotFound,
			mockDelError:   nil,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:   "missing user_id",
			slug:   "test-article",
			userID: 0,
			mockGetArticle: &article.Article{
				ID:       1,
				Slug:     "test-article",
				AuthorID: 123,
			},
			mockGetError:   nil,
			mockDelError:   nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:   "forbidden - not author",
			slug:   "test-article",
			userID: 456,
			mockGetArticle: &article.Article{
				ID:       1,
				Slug:     "test-article",
				AuthorID: 123,
			},
			mockGetError:   nil,
			mockDelError:   article.ErrUnauthorized,
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockArticleService)
			handler := NewArticleHandler(mockService)

			if tt.slug != "" {
				mockService.On("GetArticleBySlug", tt.slug).Return(tt.mockGetArticle, tt.mockGetError)
			}

			if tt.mockGetArticle != nil && tt.userID != 0 {
				mockService.On("DeleteArticle", tt.mockGetArticle.ID, tt.userID).Return(tt.mockDelError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.userID)
			c.Params = gin.Params{{Key: "slug", Value: tt.slug}}
			c.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/articles/"+tt.slug, nil)

			// Act
			handler.DeleteArticle(c)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedStatus == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.True(t, response["success"].(bool))
			}

			mockService.AssertExpectations(t)
		})
	}
}
