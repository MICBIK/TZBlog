package seo

import (
	"fmt"
	"html"
	"strings"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
)

// MetaTags represents SEO meta tags for a page
type MetaTags struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Keywords    string `json:"keywords"`
	Author      string `json:"author"`
	Image       string `json:"image"`
	URL         string `json:"url"`
	Type        string `json:"type"`
	PublishedAt string `json:"publishedAt,omitempty"`
	UpdatedAt   string `json:"updatedAt,omitempty"`
}

// OpenGraphTags represents Open Graph meta tags
type OpenGraphTags struct {
	Title       string `json:"ogTitle"`
	Description string `json:"ogDescription"`
	Image       string `json:"ogImage"`
	URL         string `json:"ogUrl"`
	Type        string `json:"ogType"`
	SiteName    string `json:"ogSiteName"`
}

// TwitterCardTags represents Twitter Card meta tags
type TwitterCardTags struct {
	Card        string `json:"twitterCard"`
	Title       string `json:"twitterTitle"`
	Description string `json:"twitterDescription"`
	Image       string `json:"twitterImage"`
	Site        string `json:"twitterSite"`
	Creator     string `json:"twitterCreator"`
}

// SEOData represents complete SEO metadata
type SEOData struct {
	Meta       MetaTags        `json:"meta"`
	OpenGraph  OpenGraphTags   `json:"openGraph"`
	Twitter    TwitterCardTags `json:"twitter"`
	Canonical  string          `json:"canonical"`
	Structured interface{}     `json:"structured,omitempty"`
}

// GenerateArticleSEO generates SEO metadata for an article
func GenerateArticleSEO(article *article.Article, baseURL string) *SEOData {
	url := fmt.Sprintf("%s/articles/%s", baseURL, article.Slug)

	// Extract first 160 characters from content for description
	description := article.Summary
	if description == "" {
		description = extractDescription(article.Content, 160)
	}

	// Extract keywords from tags
	keywords := extractKeywords(article.Tags)

	// Determine author name
	authorName := article.Author.DisplayName
	if authorName == "" {
		authorName = article.Author.Username
	}

	seo := &SEOData{
		Meta: MetaTags{
			Title:       article.Title + " - TZBlog",
			Description: description,
			Keywords:    keywords,
			Author:      authorName,
			Image:       article.CoverImage,
			URL:         url,
			Type:        "article",
			PublishedAt: article.PublishedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   article.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
		OpenGraph: OpenGraphTags{
			Title:       article.Title,
			Description: description,
			Image:       article.CoverImage,
			URL:         url,
			Type:        "article",
			SiteName:    "TZBlog",
		},
		Twitter: TwitterCardTags{
			Card:        "summary_large_image",
			Title:       article.Title,
			Description: description,
			Image:       article.CoverImage,
			Site:        "@tzblog",
			Creator:     "@" + article.Author.Username,
		},
		Canonical:  url,
		Structured: generateArticleStructuredData(article, baseURL),
	}

	return seo
}

// GenerateHomeSEO generates SEO metadata for home page
func GenerateHomeSEO(baseURL string) *SEOData {
	return &SEOData{
		Meta: MetaTags{
			Title:       "TZBlog - 技术博客与知识分享平台",
			Description: "TZBlog 是一个专注于技术分享的博客平台，涵盖前端开发、后端开发、DevOps、云计算等技术领域。",
			Keywords:    "技术博客,前端开发,后端开发,Go,React,Next.js,云计算,DevOps",
			Author:      "TZBlog Team",
			Image:       baseURL + "/images/og-home.jpg",
			URL:         baseURL,
			Type:        "website",
		},
		OpenGraph: OpenGraphTags{
			Title:       "TZBlog - 技术博客与知识分享平台",
			Description: "专注于技术分享的博客平台",
			Image:       baseURL + "/images/og-home.jpg",
			URL:         baseURL,
			Type:        "website",
			SiteName:    "TZBlog",
		},
		Twitter: TwitterCardTags{
			Card:        "summary_large_image",
			Title:       "TZBlog - 技术博客",
			Description: "专注于技术分享的博客平台",
			Image:       baseURL + "/images/og-home.jpg",
			Site:        "@tzblog",
		},
		Canonical:  baseURL,
		Structured: generateWebsiteStructuredData(baseURL),
	}
}

// extractDescription extracts a description from markdown content
func extractDescription(content string, maxLength int) string {
	// Remove markdown syntax
	text := strings.ReplaceAll(content, "#", "")
	text = strings.ReplaceAll(text, "*", "")
	text = strings.ReplaceAll(text, "_", "")
	text = strings.ReplaceAll(text, "`", "")
	text = strings.ReplaceAll(text, "\n", " ")

	// Trim whitespace
	text = strings.TrimSpace(text)

	// Truncate to max length
	if len(text) > maxLength {
		text = text[:maxLength] + "..."
	}

	return html.EscapeString(text)
}

// extractKeywords extracts keywords from tags
func extractKeywords(tags []*article.Tag) string {
	if len(tags) == 0 {
		return ""
	}

	keywords := make([]string, len(tags))
	for i, tag := range tags {
		keywords[i] = tag.Name
	}

	return strings.Join(keywords, ",")
}

// generateArticleStructuredData generates JSON-LD structured data for article
func generateArticleStructuredData(a *article.Article, baseURL string) map[string]interface{} {
	authorName := a.Author.DisplayName
	if authorName == "" {
		authorName = a.Author.Username
	}

	return map[string]interface{}{
		"@context": "https://schema.org",
		"@type":    "BlogPosting",
		"headline": a.Title,
		"image":    a.CoverImage,
		"author": map[string]interface{}{
			"@type": "Person",
			"name":  authorName,
			"url":   fmt.Sprintf("%s/authors/%s", baseURL, a.Author.Username),
		},
		"publisher": map[string]interface{}{
			"@type": "Organization",
			"name":  "TZBlog",
			"logo": map[string]interface{}{
				"@type": "ImageObject",
				"url":   baseURL + "/logo.png",
			},
		},
		"datePublished": a.PublishedAt.Format("2006-01-02T15:04:05Z07:00"),
		"dateModified":  a.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		"description":   a.Summary,
		"mainEntityOfPage": map[string]interface{}{
			"@type": "WebPage",
			"@id":   fmt.Sprintf("%s/articles/%s", baseURL, a.Slug),
		},
	}
}

// generateWebsiteStructuredData generates JSON-LD for website
func generateWebsiteStructuredData(baseURL string) map[string]interface{} {
	return map[string]interface{}{
		"@context": "https://schema.org",
		"@type":    "WebSite",
		"name":     "TZBlog",
		"url":      baseURL,
		"potentialAction": map[string]interface{}{
			"@type":       "SearchAction",
			"target":      baseURL + "/search?q={search_term_string}",
			"query-input": "required name=search_term_string",
		},
	}
}
