package article

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestArticle_GenerateSlug tests slug generation
func TestArticle_GenerateSlug(t *testing.T) {
	tests := []struct {
		name     string
		title    string
		wantSlug string
	}{
		{
			name:     "simple title",
			title:    "Hello World",
			wantSlug: "hello-world",
		},
		{
			name:     "title with special characters",
			title:    "Go & Rust: A Comparison!",
			wantSlug: "go-and-rust-a-comparison",
		},
		{
			name:     "title with numbers",
			title:    "Top 10 Tips for 2024",
			wantSlug: "top-10-tips-for-2024",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			article := &Article{Title: tt.title}
			article.GenerateSlug()
			assert.Equal(t, tt.wantSlug, article.Slug)
		})
	}
}

// TestArticle_CalculateReadingTime tests reading time calculation
func TestArticle_CalculateReadingTime(t *testing.T) {
	tests := []struct {
		name            string
		content         string
		wantReadingTime int
	}{
		{
			name:            "short content",
			content:         "This is a short article.",
			wantReadingTime: 1,
		},
		{
			name:            "medium content (200 words)",
			content:         makeContent(200),
			wantReadingTime: 1,
		},
		{
			name:            "long content (500 words)",
			content:         makeContent(500),
			wantReadingTime: 3,
		},
		{
			name:            "very long content (1000 words)",
			content:         makeContent(1000),
			wantReadingTime: 5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			article := &Article{Content: tt.content}
			article.CalculateReadingTime()
			assert.Equal(t, tt.wantReadingTime, article.ReadingTime)
		})
	}
}

// TestArticle_Validate tests article validation
func TestArticle_Validate(t *testing.T) {
	tests := []struct {
		name    string
		article *Article
		wantErr error
	}{
		{
			name: "valid article",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: nil,
		},
		{
			name: "empty title",
			article: &Article{
				Title:    "",
				Content:  "Valid content",
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: ErrInvalidTitle,
		},
		{
			name: "title too long",
			article: &Article{
				Title:    makeString(201),
				Content:  "Valid content",
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: ErrTitleTooLong,
		},
		{
			name: "empty content",
			article: &Article{
				Title:    "Valid Title",
				Content:  "",
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: ErrInvalidContent,
		},
		{
			name: "invalid status",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Status:   "invalid",
				AuthorID: 1,
			},
			wantErr: ErrInvalidStatus,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.article.Validate()
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestArticle_IsPublished tests published status check
func TestArticle_IsPublished(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name    string
		article *Article
		want    bool
	}{
		{
			name: "published with timestamp",
			article: &Article{
				Status:      StatusPublished,
				PublishedAt: &now,
			},
			want: true,
		},
		{
			name: "published without timestamp",
			article: &Article{
				Status:      StatusPublished,
				PublishedAt: nil,
			},
			want: false,
		},
		{
			name: "draft status",
			article: &Article{
				Status:      StatusDraft,
				PublishedAt: nil,
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.article.IsPublished())
		})
	}
}

// TestArticle_CanBeEditedBy tests edit permission check
func TestArticle_CanBeEditedBy(t *testing.T) {
	article := &Article{AuthorID: 1}

	assert.True(t, article.CanBeEditedBy(1))
	assert.False(t, article.CanBeEditedBy(2))
}

// TestArticle_TableName tests table name
func TestArticle_TableName(t *testing.T) {
	article := Article{}
	assert.Equal(t, "articles", article.TableName())
}

// TestListFilter_Offset tests offset calculation
func TestListFilter_Offset(t *testing.T) {
	tests := []struct {
		name       string
		filter     *ListFilter
		wantOffset int
	}{
		{
			name:       "page 1",
			filter:     &ListFilter{Page: 1, Limit: 10},
			wantOffset: 0,
		},
		{
			name:       "page 2",
			filter:     &ListFilter{Page: 2, Limit: 10},
			wantOffset: 10,
		},
		{
			name:       "page 3 with limit 20",
			filter:     &ListFilter{Page: 3, Limit: 20},
			wantOffset: 40,
		},
		{
			name:       "page 0 defaults to 1",
			filter:     &ListFilter{Page: 0, Limit: 10},
			wantOffset: 0,
		},
		{
			name:       "negative page defaults to 1",
			filter:     &ListFilter{Page: -1, Limit: 10},
			wantOffset: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			offset := tt.filter.Offset()
			assert.Equal(t, tt.wantOffset, offset)
		})
	}
}

// TestArticle_Validate_EdgeCases tests additional validation scenarios
func TestArticle_Validate_EdgeCases(t *testing.T) {
	tests := []struct {
		name    string
		article *Article
		wantErr error
	}{
		{
			name: "whitespace only title",
			article: &Article{
				Title:    "   ",
				Content:  "Valid content",
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: ErrInvalidTitle,
		},
		{
			name: "whitespace only content",
			article: &Article{
				Title:    "Valid Title",
				Content:  "   ",
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: ErrInvalidContent,
		},
		{
			name: "content too long",
			article: &Article{
				Title:    "Valid Title",
				Content:  makeString(100001),
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: ErrContentTooLong,
		},
		{
			name: "summary too long",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Summary:  makeString(501),
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: ErrInvalidSummary,
		},
		{
			name: "zero author ID",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Status:   StatusDraft,
				AuthorID: 0,
			},
			wantErr: ErrInvalidAuthorID,
		},
		{
			name: "negative author ID",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Status:   StatusDraft,
				AuthorID: -1,
			},
			wantErr: ErrInvalidAuthorID,
		},
		{
			name: "archived status",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Status:   StatusArchived,
				AuthorID: 1,
			},
			wantErr: nil,
		},
		{
			name: "published status",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Status:   StatusPublished,
				AuthorID: 1,
			},
			wantErr: nil,
		},
		{
			name: "title exactly 200 chars",
			article: &Article{
				Title:    makeString(200),
				Content:  "Valid content",
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: nil,
		},
		{
			name: "summary exactly 500 chars",
			article: &Article{
				Title:    "Valid Title",
				Content:  "Valid content",
				Summary:  makeString(500),
				Status:   StatusDraft,
				AuthorID: 1,
			},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.article.Validate()
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestArticle_SanitizeContent tests HTML sanitization
func TestArticle_SanitizeContent(t *testing.T) {
	tests := []struct {
		name    string
		content string
	}{
		{
			name:    "safe HTML",
			content: "<p>Hello <strong>World</strong></p>",
		},
		{
			name:    "with script tags",
			content: "<p>Hello</p><script>alert('xss')</script>",
		},
		{
			name:    "with inline styles",
			content: "<p style='color:red'>Hello</p>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			article := &Article{Content: tt.content}
			article.SanitizeContent()
			// After sanitization, content should be safe
			assert.NotEmpty(t, article.Content)
			// Script tags should be removed
			assert.NotContains(t, article.Content, "<script>")
		})
	}
}

// TestArticle_GenerateSlug_EdgeCases tests edge cases for slug generation
func TestArticle_GenerateSlug_EdgeCases(t *testing.T) {
	tests := []struct {
		name     string
		title    string
		wantSlug string
	}{
		{
			name:     "unicode characters",
			title:    "你好世界",
			wantSlug: "ni-hao-shi-jie",
		},
		{
			name:     "emoji",
			title:    "Hello 👋 World",
			wantSlug: "hello-world",
		},
		{
			name:     "multiple spaces",
			title:    "Hello    World",
			wantSlug: "hello-world",
		},
		{
			name:     "leading and trailing spaces",
			title:    "  Hello World  ",
			wantSlug: "hello-world",
		},
		{
			name:     "all special characters",
			title:    "!@#$%^&*()",
			wantSlug: "at-and", // @ becomes "at", & becomes "and"
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			article := &Article{Title: tt.title}
			article.GenerateSlug()
			assert.Equal(t, tt.wantSlug, article.Slug)
		})
	}
}

// TestArticle_CalculateReadingTime_EdgeCases tests edge cases for reading time
func TestArticle_CalculateReadingTime_EdgeCases(t *testing.T) {
	tests := []struct {
		name            string
		content         string
		wantReadingTime int
	}{
		{
			name:            "empty content",
			content:         "",
			wantReadingTime: 1, // Minimum 1 minute
		},
		{
			name:            "single word",
			content:         "word",
			wantReadingTime: 1,
		},
		{
			name:            "exactly 200 words",
			content:         makeContent(200),
			wantReadingTime: 1,
		},
		{
			name:            "201 words",
			content:         makeContent(201),
			wantReadingTime: 2,
		},
		{
			name:            "399 words",
			content:         makeContent(399),
			wantReadingTime: 2,
		},
		{
			name:            "400 words",
			content:         makeContent(400),
			wantReadingTime: 2,
		},
		{
			name:            "multiple newlines",
			content:         "word\n\n\nword\n\nword",
			wantReadingTime: 1,
		},
		{
			name:            "multiple spaces between words",
			content:         "word     word     word",
			wantReadingTime: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			article := &Article{Content: tt.content}
			article.CalculateReadingTime()
			assert.Equal(t, tt.wantReadingTime, article.ReadingTime)
		})
	}
}

// TestArticleTag_TableName tests ArticleTag table name
func TestArticleTag_TableName(t *testing.T) {
	articleTag := ArticleTag{}
	assert.Equal(t, "article_tags", articleTag.TableName())
}

// TestListFilter_DefaultValues tests default filter values
func TestListFilter_DefaultValues(t *testing.T) {
	filter := &ListFilter{}

	t.Run("default page is 1", func(t *testing.T) {
		offset := filter.Offset()
		assert.Equal(t, 0, offset)
	})

	t.Run("limit can be zero", func(t *testing.T) {
		assert.Equal(t, 0, filter.Limit)
	})

	t.Run("empty filters", func(t *testing.T) {
		assert.Empty(t, filter.Status)
		assert.Zero(t, filter.AuthorID)
		assert.Zero(t, filter.CategoryID)
		assert.Empty(t, filter.Search)
		assert.Empty(t, filter.OrderBy)
	})
}

// TestListFilter_LargeOffset tests large page numbers
func TestListFilter_LargeOffset(t *testing.T) {
	filter := &ListFilter{Page: 1000, Limit: 100}
	offset := filter.Offset()
	assert.Equal(t, 99900, offset)
}

// Helper functions
func makeContent(words int) string {
	content := ""
	for i := 0; i < words; i++ {
		content += "word "
	}
	return content
}

func makeString(length int) string {
	result := ""
	for i := 0; i < length; i++ {
		result += "a"
	}
	return result
}
