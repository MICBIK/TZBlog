package sitemap

import (
	"encoding/xml"
	"strings"
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
)

func TestNewGenerator(t *testing.T) {
	baseURL := "https://example.com"
	generator := NewGenerator(baseURL)

	if generator == nil {
		t.Fatal("Expected generator to be created, got nil")
	}

	if generator.baseURL != baseURL {
		t.Errorf("Expected baseURL to be %s, got %s", baseURL, generator.baseURL)
	}
}

func TestGenerate_EmptyArticles(t *testing.T) {
	generator := NewGenerator("https://example.com")
	articles := []*article.Article{}

	data, err := generator.Generate(articles)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(data) == 0 {
		t.Error("Expected XML data, got empty")
	}

	// Parse XML to verify structure
	var urlset URLSet
	err = xml.Unmarshal(data, &urlset)
	if err != nil {
		t.Fatalf("Failed to parse XML: %v", err)
	}

	// Should have static pages (home, articles, archive, about)
	if len(urlset.URLs) < 4 {
		t.Errorf("Expected at least 4 URLs (static pages), got %d", len(urlset.URLs))
	}

	// Verify xmlns attribute
	if urlset.Xmlns != "http://www.sitemaps.org/schemas/sitemap/0.9" {
		t.Errorf("Expected xmlns to be sitemap schema, got %s", urlset.Xmlns)
	}
}

func TestGenerate_WithPublishedArticles(t *testing.T) {
	generator := NewGenerator("https://example.com")

	now := time.Now()
	articles := []*article.Article{
		{
			ID:        1,
			Slug:      "test-article-1",
			Title:     "Test Article 1",
			Status:    "published",
			UpdatedAt: now,
		},
		{
			ID:        2,
			Slug:      "test-article-2",
			Title:     "Test Article 2",
			Status:    "published",
			UpdatedAt: now,
		},
	}

	data, err := generator.Generate(articles)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	var urlset URLSet
	err = xml.Unmarshal(data, &urlset)
	if err != nil {
		t.Fatalf("Failed to parse XML: %v", err)
	}

	// Should have 4 static pages + 2 articles = 6 URLs
	expectedURLs := 6
	if len(urlset.URLs) != expectedURLs {
		t.Errorf("Expected %d URLs, got %d", expectedURLs, len(urlset.URLs))
	}

	// Verify article URLs are included
	foundArticle1 := false
	foundArticle2 := false
	for _, url := range urlset.URLs {
		if strings.Contains(url.Loc, "test-article-1") {
			foundArticle1 = true
		}
		if strings.Contains(url.Loc, "test-article-2") {
			foundArticle2 = true
		}
	}

	if !foundArticle1 {
		t.Error("Expected to find test-article-1 in sitemap")
	}
	if !foundArticle2 {
		t.Error("Expected to find test-article-2 in sitemap")
	}
}

func TestGenerate_FiltersDraftArticles(t *testing.T) {
	generator := NewGenerator("https://example.com")

	now := time.Now()
	articles := []*article.Article{
		{
			ID:        1,
			Slug:      "published-article",
			Title:     "Published Article",
			Status:    "published",
			UpdatedAt: now,
		},
		{
			ID:        2,
			Slug:      "draft-article",
			Title:     "Draft Article",
			Status:    "draft",
			UpdatedAt: now,
		},
	}

	data, err := generator.Generate(articles)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	var urlset URLSet
	err = xml.Unmarshal(data, &urlset)
	if err != nil {
		t.Fatalf("Failed to parse XML: %v", err)
	}

	// Should have 4 static pages + 1 published article = 5 URLs
	expectedURLs := 5
	if len(urlset.URLs) != expectedURLs {
		t.Errorf("Expected %d URLs, got %d", expectedURLs, len(urlset.URLs))
	}

	// Verify draft article is not included
	for _, url := range urlset.URLs {
		if strings.Contains(url.Loc, "draft-article") {
			t.Error("Draft article should not be included in sitemap")
		}
	}

	// Verify published article is included
	foundPublished := false
	for _, url := range urlset.URLs {
		if strings.Contains(url.Loc, "published-article") {
			foundPublished = true
		}
	}
	if !foundPublished {
		t.Error("Published article should be included in sitemap")
	}
}

func TestGenerate_StaticPages(t *testing.T) {
	generator := NewGenerator("https://example.com")
	articles := []*article.Article{}

	data, err := generator.Generate(articles)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	var urlset URLSet
	err = xml.Unmarshal(data, &urlset)
	if err != nil {
		t.Fatalf("Failed to parse XML: %v", err)
	}

	// Check for required static pages
	expectedPages := map[string]bool{
		"https://example.com":          false,
		"https://example.com/articles": false,
		"https://example.com/archive":  false,
		"https://example.com/about":    false,
	}

	for _, url := range urlset.URLs {
		if _, exists := expectedPages[url.Loc]; exists {
			expectedPages[url.Loc] = true
		}
	}

	for page, found := range expectedPages {
		if !found {
			t.Errorf("Expected page %s to be in sitemap", page)
		}
	}
}

func TestGenerate_PriorityAndChangeFreq(t *testing.T) {
	generator := NewGenerator("https://example.com")
	articles := []*article.Article{}

	data, err := generator.Generate(articles)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	var urlset URLSet
	err = xml.Unmarshal(data, &urlset)
	if err != nil {
		t.Fatalf("Failed to parse XML: %v", err)
	}

	// Verify home page has highest priority
	homePage := urlset.URLs[0]
	if homePage.Priority != 1.0 {
		t.Errorf("Expected home page priority 1.0, got %f", homePage.Priority)
	}
	if homePage.ChangeFreq != "daily" {
		t.Errorf("Expected home page changefreq 'daily', got '%s'", homePage.ChangeFreq)
	}

	// Verify articles page has high priority
	articlesPage := urlset.URLs[1]
	if articlesPage.Priority != 0.9 {
		t.Errorf("Expected articles page priority 0.9, got %f", articlesPage.Priority)
	}
}

func TestGenerate_XMLFormat(t *testing.T) {
	generator := NewGenerator("https://example.com")

	now := time.Now()
	articles := []*article.Article{
		{
			ID:        1,
			Slug:      "test-article",
			Title:     "Test Article",
			Status:    "published",
			UpdatedAt: now,
		},
	}

	data, err := generator.Generate(articles)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify XML contains required elements
	xmlStr := string(data)

	requiredElements := []string{
		"<urlset",
		"xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"",
		"<url>",
		"<loc>",
		"<lastmod>",
		"<changefreq>",
		"<priority>",
		"</url>",
		"</urlset>",
	}

	for _, elem := range requiredElements {
		if !strings.Contains(xmlStr, elem) {
			t.Errorf("Expected XML to contain '%s'", elem)
		}
	}
}

func TestGenerate_LastModFormat(t *testing.T) {
	generator := NewGenerator("https://example.com")

	testTime := time.Date(2026, 6, 15, 0, 0, 0, 0, time.UTC)
	articles := []*article.Article{
		{
			ID:        1,
			Slug:      "test-article",
			Title:     "Test Article",
			Status:    "published",
			UpdatedAt: testTime,
		},
	}

	data, err := generator.Generate(articles)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	var urlset URLSet
	err = xml.Unmarshal(data, &urlset)
	if err != nil {
		t.Fatalf("Failed to parse XML: %v", err)
	}

	// Find the article URL
	var articleURL *URL
	for i := range urlset.URLs {
		if strings.Contains(urlset.URLs[i].Loc, "test-article") {
			articleURL = &urlset.URLs[i]
			break
		}
	}

	if articleURL == nil {
		t.Fatal("Could not find article URL in sitemap")
	}

	// Verify date format is YYYY-MM-DD
	expectedDate := "2026-06-15"
	if articleURL.LastMod != expectedDate {
		t.Errorf("Expected lastmod to be %s, got %s", expectedDate, articleURL.LastMod)
	}
}

func TestURL_Structure(t *testing.T) {
	url := URL{
		Loc:        "https://example.com/test",
		LastMod:    "2026-06-15",
		ChangeFreq: "daily",
		Priority:   0.8,
	}

	if url.Loc != "https://example.com/test" {
		t.Error("Loc not set correctly")
	}

	if url.LastMod != "2026-06-15" {
		t.Error("LastMod not set correctly")
	}

	if url.ChangeFreq != "daily" {
		t.Error("ChangeFreq not set correctly")
	}

	if url.Priority != 0.8 {
		t.Error("Priority not set correctly")
	}
}
