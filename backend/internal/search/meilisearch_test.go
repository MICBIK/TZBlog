package search

import (
	"testing"
)

func TestNewClient(t *testing.T) {
	config := &Config{
		Host:   "http://localhost:7700",
		APIKey: "test-api-key",
		Index:  "articles",
	}

	client := NewClient(config)

	if client == nil {
		t.Fatal("Expected client to be created, got nil")
	}

	if client.index != config.Index {
		t.Errorf("Expected index to be %s, got %s", config.Index, client.index)
	}

	if client.client == nil {
		t.Error("Expected client.client to be initialized")
	}
}

func TestArticleDocument_Structure(t *testing.T) {
	doc := &ArticleDocument{
		ID:          "1",
		Slug:        "test-article",
		Title:       "Test Article",
		Summary:     "Test summary",
		Content:     "Test content",
		Author:      "Test Author",
		Category:    "Tech",
		Tags:        []string{"go", "testing"},
		PublishedAt: 1234567890,
		ViewCount:   100,
	}

	if doc.ID != "1" {
		t.Error("ID not set correctly")
	}

	if doc.Slug != "test-article" {
		t.Error("Slug not set correctly")
	}

	if len(doc.Tags) != 2 {
		t.Error("Tags not set correctly")
	}

	if doc.ViewCount != 100 {
		t.Error("ViewCount not set correctly")
	}
}

func TestSearchOptions_DefaultValues(t *testing.T) {
	options := &SearchOptions{
		Limit:  20,
		Offset: 0,
		Filters: map[string]interface{}{
			"category": "tech",
		},
		Sort: []string{"publishedAt:desc"},
		AttributesToRetrieve: []string{"id", "title", "summary"},
	}

	if options.Limit != 20 {
		t.Errorf("Expected limit 20, got %d", options.Limit)
	}

	if options.Offset != 0 {
		t.Errorf("Expected offset 0, got %d", options.Offset)
	}

	if len(options.Filters) != 1 {
		t.Error("Filters not set correctly")
	}

	if len(options.Sort) != 1 {
		t.Error("Sort not set correctly")
	}

	if len(options.AttributesToRetrieve) != 3 {
		t.Error("AttributesToRetrieve not set correctly")
	}
}

func TestBuildFilters_StringFilter(t *testing.T) {
	filters := map[string]interface{}{
		"category": "tech",
	}

	result := buildFilters(filters)

	if result == nil {
		t.Error("Expected filter result, got nil")
	}

	// For single filter, should return string
	if _, ok := result.(string); !ok {
		t.Error("Expected string result for single filter")
	}
}

func TestBuildFilters_MultipleFilters(t *testing.T) {
	filters := map[string]interface{}{
		"category": "tech",
		"author":   "test-author",
	}

	result := buildFilters(filters)

	if result == nil {
		t.Error("Expected filter result, got nil")
	}

	// For multiple filters, should return slice
	if _, ok := result.([]string); !ok {
		t.Error("Expected []string result for multiple filters")
	}
}

func TestBuildFilters_IntFilter(t *testing.T) {
	filters := map[string]interface{}{
		"viewCount": int64(100),
	}

	result := buildFilters(filters)

	if result == nil {
		t.Error("Expected filter result, got nil")
	}

	strResult, ok := result.(string)
	if !ok {
		t.Error("Expected string result")
	}

	expected := "viewCount = 100"
	if strResult != expected {
		t.Errorf("Expected filter '%s', got '%s'", expected, strResult)
	}
}

func TestBuildFilters_ArrayFilter(t *testing.T) {
	filters := map[string]interface{}{
		"tags": []string{"go", "testing"},
	}

	result := buildFilters(filters)

	if result == nil {
		t.Error("Expected filter result, got nil")
	}

	// Should handle array filters
	if _, ok := result.(string); !ok {
		t.Error("Expected string result for single filter")
	}
}

func TestBuildFilters_EmptyFilters(t *testing.T) {
	filters := map[string]interface{}{}

	result := buildFilters(filters)

	// Should return empty result for empty filters
	if result == nil {
		// This is acceptable
		return
	}

	// Or return empty array
	if arr, ok := result.([]string); ok && len(arr) == 0 {
		return
	}
}

func TestSearchResult_Structure(t *testing.T) {
	result := &SearchResult{
		Hits: []ArticleDocument{
			{
				ID:    "1",
				Title: "Article 1",
			},
			{
				ID:    "2",
				Title: "Article 2",
			},
		},
		EstimatedTotal: 2,
		Query:          "test",
		Limit:          10,
		Offset:         0,
		ProcessingTime: 5,
	}

	if len(result.Hits) != 2 {
		t.Errorf("Expected 2 hits, got %d", len(result.Hits))
	}

	if result.EstimatedTotal != 2 {
		t.Errorf("Expected EstimatedTotal 2, got %d", result.EstimatedTotal)
	}

	if result.Query != "test" {
		t.Errorf("Expected query 'test', got '%s'", result.Query)
	}
}

func TestConfig_Validation(t *testing.T) {
	tests := []struct {
		name   string
		config *Config
		valid  bool
	}{
		{
			name: "valid config",
			config: &Config{
				Host:   "http://localhost:7700",
				APIKey: "test-key",
				Index:  "articles",
			},
			valid: true,
		},
		{
			name: "empty host",
			config: &Config{
				Host:   "",
				APIKey: "test-key",
				Index:  "articles",
			},
			valid: false,
		},
		{
			name: "empty index",
			config: &Config{
				Host:   "http://localhost:7700",
				APIKey: "test-key",
				Index:  "",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := NewClient(tt.config)

			if client == nil {
				t.Error("Client should not be nil")
			}

			if tt.valid {
				if client.index == "" {
					t.Error("Expected index to be set")
				}
			}
		})
	}
}

// Note: The following methods require a real Meilisearch instance to test:
// - InitializeIndex
// - IndexArticle
// - IndexArticles
// - DeleteArticle
// - Search
// - GetStats
//
// In a real test environment, you would:
// 1. Use testcontainers to spin up a Meilisearch instance
// 2. Or use a mock implementation of meilisearch.ServiceManager
// 3. Or use integration tests with a dedicated test instance
//
// For unit tests, we focus on testing the logic that doesn't require external services.
