package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/comment"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockCommentService is a mock implementation of comment.Service
type MockCommentService struct {
	mock.Mock
}

func (m *MockCommentService) CreateComment(userID int64, dto *comment.CreateCommentDTO) (*comment.Comment, error) {
	args := m.Called(userID, dto)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*comment.Comment), args.Error(1)
}

func (m *MockCommentService) GetCommentByID(id int64) (*comment.Comment, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*comment.Comment), args.Error(1)
}

func (m *MockCommentService) ListComments(filter *comment.ListFilter) ([]*comment.Comment, int64, error) {
	args := m.Called(filter)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*comment.Comment), args.Get(1).(int64), args.Error(2)
}

func (m *MockCommentService) UpdateComment(id, userID int64, dto *comment.UpdateCommentDTO) (*comment.Comment, error) {
	args := m.Called(id, userID, dto)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*comment.Comment), args.Error(1)
}

func (m *MockCommentService) DeleteComment(id, userID int64) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockCommentService) GetCommentCountByArticle(articleID int64) (int64, error) {
	args := m.Called(articleID)
	return args.Get(0).(int64), args.Error(1)
}

func TestCommentHandler_CreateComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		userID         int64
		requestBody    interface{}
		mockComment    *comment.Comment
		mockError      error
		expectedStatus int
	}{
		{
			name:   "successful create",
			userID: 123,
			requestBody: comment.CreateCommentDTO{
				ArticleID: 1,
				Content:   "Great article!",
			},
			mockComment: &comment.Comment{
				ID:        1,
				ArticleID: 1,
				UserID:    123,
				Content:   "Great article!",
				Status:    "published",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockError:      nil,
			expectedStatus: http.StatusCreated,
		},
		{
			name:   "create with parent comment",
			userID: 123,
			requestBody: func() comment.CreateCommentDTO {
				parentID := int64(5)
				return comment.CreateCommentDTO{
					ArticleID: 1,
					ParentID:  &parentID,
					Content:   "Reply to comment",
				}
			}(),
			mockComment: &comment.Comment{
				ID:        2,
				ArticleID: 1,
				UserID:    123,
				ParentID:  func() *int64 { id := int64(5); return &id }(),
				Content:   "Reply to comment",
				Status:    "published",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockError:      nil,
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "missing user_id",
			userID:         0,
			requestBody:    comment.CreateCommentDTO{ArticleID: 1, Content: "Test"},
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "invalid request body",
			userID:         123,
			requestBody:    `{"invalid": json}`,
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "missing required fields",
			userID: 123,
			requestBody: comment.CreateCommentDTO{
				ArticleID: 1,
				// Missing Content
			},
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "content too long",
			userID: 123,
			requestBody: comment.CreateCommentDTO{
				ArticleID: 1,
				Content:   string(make([]byte, 1001)),
			},
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockCommentService)
			handler := NewCommentHandler(mockService)

			if tt.expectedStatus == http.StatusCreated {
				mockService.On("CreateComment", tt.userID, mock.AnythingOfType("*comment.CreateCommentDTO")).
					Return(tt.mockComment, tt.mockError)
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
			c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/comments", bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.CreateComment(c)

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

func TestCommentHandler_GetComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		commentID      string
		mockComment    *comment.Comment
		mockError      error
		expectedStatus int
	}{
		{
			name:      "successful get",
			commentID: "1",
			mockComment: &comment.Comment{
				ID:        1,
				ArticleID: 1,
				UserID:    123,
				Content:   "Great article!",
				Status:    "published",
				CreatedAt: now,
				UpdatedAt: now,
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid comment ID",
			commentID:      "invalid",
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "comment not found",
			commentID:      "999",
			mockComment:    nil,
			mockError:      comment.ErrCommentNotFound,
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockCommentService)
			handler := NewCommentHandler(mockService)

			if tt.commentID != "invalid" {
				mockService.On("GetCommentByID", int64(1)).Return(tt.mockComment, tt.mockError).Maybe()
				mockService.On("GetCommentByID", int64(999)).Return(tt.mockComment, tt.mockError).Maybe()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "id", Value: tt.commentID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/comments/"+tt.commentID, nil)

			// Act
			handler.GetComment(c)

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

func TestCommentHandler_ListComments(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		queryParams    string
		mockComments   []*comment.Comment
		mockTotal      int64
		mockError      error
		expectedStatus int
		expectedPage   int
		expectedLimit  int
	}{
		{
			name:        "successful list with defaults",
			queryParams: "",
			mockComments: []*comment.Comment{
				{
					ID:        1,
					ArticleID: 1,
					UserID:    123,
					Content:   "Comment 1",
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
				{
					ID:        2,
					ArticleID: 1,
					UserID:    124,
					Content:   "Comment 2",
					Status:    "published",
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
			mockComments: []*comment.Comment{
				{
					ID:        11,
					ArticleID: 1,
					UserID:    123,
					Content:   "Comment 11",
					Status:    "published",
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
			name:        "list with article filter",
			queryParams: "?article_id=1",
			mockComments: []*comment.Comment{
				{
					ID:        1,
					ArticleID: 1,
					UserID:    123,
					Content:   "Comment 1",
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
			expectedPage:   1,
			expectedLimit:  20,
		},
		{
			name:           "service error",
			queryParams:    "",
			mockComments:   nil,
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
			mockService := new(MockCommentService)
			handler := NewCommentHandler(mockService)

			mockService.On("ListComments", mock.AnythingOfType("*comment.ListFilter")).
				Return(tt.mockComments, tt.mockTotal, tt.mockError)

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/comments"+tt.queryParams, nil)

			// Act
			handler.ListComments(c)

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

func TestCommentHandler_UpdateComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		commentID      string
		userID         int64
		requestBody    interface{}
		mockComment    *comment.Comment
		mockError      error
		expectedStatus int
	}{
		{
			name:      "successful update",
			commentID: "1",
			userID:    123,
			requestBody: comment.UpdateCommentDTO{
				Content: "Updated comment",
			},
			mockComment: &comment.Comment{
				ID:        1,
				ArticleID: 1,
				UserID:    123,
				Content:   "Updated comment",
				Status:    "published",
				CreatedAt: now,
				UpdatedAt: time.Now(),
			},
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid comment ID",
			commentID:      "invalid",
			userID:         123,
			requestBody:    comment.UpdateCommentDTO{Content: "Test"},
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing user_id",
			commentID:      "1",
			userID:         0,
			requestBody:    comment.UpdateCommentDTO{Content: "Test"},
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "invalid request body",
			commentID:      "1",
			userID:         123,
			requestBody:    `{"invalid": json}`,
			mockComment:    nil,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:      "comment not found",
			commentID: "999",
			userID:    123,
			requestBody: comment.UpdateCommentDTO{
				Content: "Updated comment",
			},
			mockComment:    nil,
			mockError:      comment.ErrCommentNotFound,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:      "unauthorized - not author",
			commentID: "1",
			userID:    456,
			requestBody: comment.UpdateCommentDTO{
				Content: "Updated comment",
			},
			mockComment:    nil,
			mockError:      comment.ErrUnauthorized,
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockCommentService)
			handler := NewCommentHandler(mockService)

			if tt.commentID != "invalid" && tt.userID != 0 && tt.expectedStatus != http.StatusBadRequest {
				mockService.On("UpdateComment", int64(1), tt.userID, mock.AnythingOfType("*comment.UpdateCommentDTO")).
					Return(tt.mockComment, tt.mockError).Maybe()
				mockService.On("UpdateComment", int64(999), tt.userID, mock.AnythingOfType("*comment.UpdateCommentDTO")).
					Return(tt.mockComment, tt.mockError).Maybe()
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
			c.Params = gin.Params{{Key: "id", Value: tt.commentID}}
			c.Request = httptest.NewRequest(http.MethodPut, "/api/v1/comments/"+tt.commentID, bytes.NewReader(body))
			c.Request.Header.Set("Content-Type", "application/json")

			// Act
			handler.UpdateComment(c)

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

func TestCommentHandler_DeleteComment(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		commentID      string
		userID         int64
		mockError      error
		expectedStatus int
	}{
		{
			name:           "successful delete",
			commentID:      "1",
			userID:         123,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid comment ID",
			commentID:      "invalid",
			userID:         123,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "missing user_id",
			commentID:      "1",
			userID:         0,
			mockError:      nil,
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "comment not found",
			commentID:      "999",
			userID:         123,
			mockError:      comment.ErrCommentNotFound,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "unauthorized - not author",
			commentID:      "1",
			userID:         456,
			mockError:      comment.ErrUnauthorized,
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockCommentService)
			handler := NewCommentHandler(mockService)

			if tt.commentID != "invalid" && tt.userID != 0 {
				mockService.On("DeleteComment", int64(1), tt.userID).Return(tt.mockError).Maybe()
				mockService.On("DeleteComment", int64(999), tt.userID).Return(tt.mockError).Maybe()
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", tt.userID)
			c.Params = gin.Params{{Key: "id", Value: tt.commentID}}
			c.Request = httptest.NewRequest(http.MethodDelete, "/api/v1/comments/"+tt.commentID, nil)

			// Act
			handler.DeleteComment(c)

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

func TestCommentHandler_ListArticleComments(t *testing.T) {
	gin.SetMode(gin.TestMode)

	now := time.Now()
	tests := []struct {
		name           string
		articleID      string
		queryParams    string
		mockComments   []*comment.Comment
		mockTotal      int64
		mockError      error
		expectedStatus int
	}{
		{
			name:        "successful list article comments",
			articleID:   "1",
			queryParams: "",
			mockComments: []*comment.Comment{
				{
					ID:        1,
					ArticleID: 1,
					UserID:    123,
					Content:   "Comment 1",
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      1,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid article ID",
			articleID:      "invalid",
			queryParams:    "",
			mockComments:   nil,
			mockTotal:      0,
			mockError:      nil,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:        "list with pagination",
			articleID:   "1",
			queryParams: "?page=1&limit=10",
			mockComments: []*comment.Comment{
				{
					ID:        1,
					ArticleID: 1,
					UserID:    123,
					Content:   "Comment 1",
					Status:    "published",
					CreatedAt: now,
					UpdatedAt: now,
				},
			},
			mockTotal:      5,
			mockError:      nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "service error",
			articleID:      "1",
			queryParams:    "",
			mockComments:   nil,
			mockTotal:      0,
			mockError:      errors.New("database error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange
			mockService := new(MockCommentService)
			handler := NewCommentHandler(mockService)

			if tt.articleID != "invalid" {
				mockService.On("ListComments", mock.AnythingOfType("*comment.ListFilter")).
					Return(tt.mockComments, tt.mockTotal, tt.mockError)
			}

			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "id", Value: tt.articleID}}
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/articles/"+tt.articleID+"/comments"+tt.queryParams, nil)

			// Act
			handler.ListArticleComments(c)

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
