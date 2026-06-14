package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/gin-gonic/gin"
)

// Mock service for benchmarking
type mockArticleServiceBench struct{}

func (m *mockArticleServiceBench) Create(dto *article.CreateArticleDTO, authorID int64) (*article.Article, error) {
	return &article.Article{ID: 1, Title: dto.Title, Content: dto.Content}, nil
}

func (m *mockArticleServiceBench) List(params *article.ListParams) (*article.PaginatedArticles, error) {
	return &article.PaginatedArticles{
		Articles: []article.Article{{ID: 1, Title: "Test"}},
		Total:    1,
		Page:     1,
		PageSize: 10,
	}, nil
}

func (m *mockArticleServiceBench) GetBySlug(slug string) (*article.Article, error) {
	return &article.Article{ID: 1, Title: "Test", Slug: slug}, nil
}

func (m *mockArticleServiceBench) Update(id int64, dto *article.UpdateArticleDTO, userID int64) (*article.Article, error) {
	return &article.Article{ID: id, Title: *dto.Title}, nil
}

func (m *mockArticleServiceBench) Delete(id int64, userID int64) error {
	return nil
}

func (m *mockArticleServiceBench) GetByID(id int64) (*article.Article, error) {
	return &article.Article{ID: id, Title: "Test"}, nil
}

func (m *mockArticleServiceBench) BatchDelete(ids []int64, userID int64) error {
	return nil
}

func (m *mockArticleServiceBench) BatchUpdateStatus(ids []int64, status string, userID int64) error {
	return nil
}

func setupBenchHandler() *ArticleHandler {
	gin.SetMode(gin.TestMode)
	return NewArticleHandler(&mockArticleServiceBench{})
}

func createBenchRequest() *http.Request {
	createReq := article.CreateArticleDTO{
		Title:       "Benchmark Test Article",
		Content:     "This is benchmark test content for performance testing.",
		Description: "Benchmark description",
		Tags:        []string{"benchmark", "test"},
		Status:      "published",
	}

	body, _ := json.Marshal(createReq)
	req, _ := http.NewRequest("POST", "/api/articles", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	return req
}

func BenchmarkArticleHandler_Create_Concurrent(b *testing.B) {
	handler := setupBenchHandler()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", int64(123))

			req := createBenchRequest()
			c.Request = req

			handler.CreateArticle(c)
		}
	})
}

func BenchmarkArticleHandler_List_Concurrent(b *testing.B) {
	handler := setupBenchHandler()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("GET", "/api/articles?page=1&page_size=10", nil)
			c.Request = req
			// Set query params
			c.Request.URL.RawQuery = "page=1&page_size=10"

			handler.ListArticles(c)
		}
	})
}

func BenchmarkArticleHandler_GetBySlug_Concurrent(b *testing.B) {
	handler := setupBenchHandler()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "slug", Value: "benchmark-test-article"}}

			req, _ := http.NewRequest("GET", "/api/articles/benchmark-test-article", nil)
			c.Request = req

			handler.GetArticleBySlug(c)
		}
	})
}

func BenchmarkArticleHandler_Update_Concurrent(b *testing.B) {
	handler := setupBenchHandler()

	title := "Updated Benchmark Article"
	updateReq := article.UpdateArticleDTO{
		Title:       &title,
		Content:     stringPtr("Updated benchmark content"),
		Description: stringPtr("Updated description"),
	}

	body, _ := json.Marshal(updateReq)

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", int64(123))
			c.Params = gin.Params{{Key: "slug", Value: "test-article"}}

			req, _ := http.NewRequest("PUT", "/api/articles/test-article", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			c.Request = req

			handler.UpdateArticle(c)
		}
	})
}

func BenchmarkArticleHandler_Delete_Concurrent(b *testing.B) {
	handler := setupBenchHandler()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("user_id", int64(123))
			c.Params = gin.Params{{Key: "slug", Value: "test-article"}}

			req, _ := http.NewRequest("DELETE", "/api/articles/test-article", nil)
			c.Request = req

			handler.DeleteArticle(c)
		}
	})
}

func stringPtr(s string) *string {
	return &s
}
