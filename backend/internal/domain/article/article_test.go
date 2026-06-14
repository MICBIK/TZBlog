package article

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestArticle_GenerateSlug tests slug generation
func TestArticle_GenerateSlug(t *testing.T) {
	tests := []struct {
		name      string
		title     string
		wantSlug  string
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
		name             string
		content          string
		wantReadingTime  int
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
				Title:   "Valid Title",
				Content: "Valid content",
				Status:  StatusDraft,
			},
			wantErr: nil,
		},
		{
			name: "empty title",
			article: &Article{
				Title:   "",
				Content: "Valid content",
				Status:  StatusDraft,
			},
			wantErr: ErrInvalidTitle,
		},
		{
			name: "title too long",
			article: &Article{
				Title:   makeString(201),
				Content: "Valid content",
				Status:  StatusDraft,
			},
			wantErr: ErrTitleTooLong,
		},
		{
			name: "empty content",
			article: &Article{
				Title:   "Valid Title",
				Content: "",
				Status:  StatusDraft,
			},
			wantErr: ErrInvalidContent,
		},
		{
			name: "invalid status",
			article: &Article{
				Title:   "Valid Title",
				Content: "Valid content",
				Status:  "invalid",
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
