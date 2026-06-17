package article

import (
	"strings"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"github.com/MICBIK/TZBlog/backend/pkg/sanitizer"
	"github.com/gosimple/slug"
)

// Article status constants
const (
	StatusDraft     = "draft"
	StatusPublished = "published"
	StatusArchived  = "archived"
)

// Article represents an article entity
type Article struct {
	ID           int64      `json:"id" gorm:"primaryKey"`
	Title        string     `json:"title" gorm:"not null"`
	Slug         string     `json:"slug" gorm:"uniqueIndex;not null"`
	Content      string     `json:"content" gorm:"type:text"`
	Summary      string     `json:"summary"`
	CoverImage   string     `json:"coverImage"`
	AuthorID     int64      `json:"authorId" gorm:"not null;index"`
	CategoryID   int64      `json:"categoryId" gorm:"index"`
	Status       string     `json:"status" gorm:"default:'draft';index:idx_articles_status,where:deleted_at IS NULL;index:idx_articles_status_created,composite:status_created_at,where:deleted_at IS NULL"` // draft, published, archived
	IsPremium    bool       `json:"isPremium" gorm:"default:false"`
	ReadingTime  int        `json:"readingTime"` // in minutes
	ViewCount    int64      `json:"viewCount" gorm:"default:0"`
	LikeCount    int64      `json:"likeCount" gorm:"default:0"`
	CommentCount int64      `json:"commentCount" gorm:"default:0"`
	PublishedAt  *time.Time `json:"publishedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt" gorm:"index:idx_articles_created_at,sort:desc,where:deleted_at IS NULL;index:idx_articles_status_created,composite:status_created_at,priority:2,sort:desc,where:deleted_at IS NULL"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	DeletedAt    *time.Time `json:"deletedAt,omitempty" gorm:"index"`

	// Relations (GORM native preload)
	Author *user.User `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	Tags   []*tag.Tag `json:"tags,omitempty" gorm:"many2many:article_tags;"`
}

// TableName returns the table name
func (Article) TableName() string {
	return "articles"
}

// GenerateSlug generates a URL-friendly slug from the title
func (a *Article) GenerateSlug() {
	a.Slug = slug.Make(a.Title)
}

// CalculateReadingTime estimates reading time based on word count
func (a *Article) CalculateReadingTime() {
	words := len(strings.Fields(a.Content))
	// Average reading speed: 200 words per minute
	a.ReadingTime = (words + 199) / 200
	if a.ReadingTime < 1 {
		a.ReadingTime = 1
	}
}

// Validate validates the article fields
func (a *Article) Validate() error {
	// Validate title
	if strings.TrimSpace(a.Title) == "" {
		return ErrInvalidTitle
	}
	if len(a.Title) > 200 {
		return ErrTitleTooLong
	}

	// Validate content
	if strings.TrimSpace(a.Content) == "" {
		return ErrInvalidContent
	}
	if len(a.Content) > 100000 {
		return ErrContentTooLong
	}

	// Validate summary
	if len(a.Summary) > 500 {
		return ErrInvalidSummary
	}

	// Validate status
	if a.Status != StatusDraft && a.Status != StatusPublished && a.Status != StatusArchived {
		return ErrInvalidStatus
	}

	// Validate author ID
	if a.AuthorID <= 0 {
		return ErrInvalidAuthorID
	}

	return nil
}

// SanitizeContent sanitizes user-generated content to prevent XSS attacks
func (a *Article) SanitizeContent() {
	// Sanitize title (strict - no HTML allowed)
	a.Title = sanitizer.SanitizeStrict(a.Title)

	// Sanitize content (UGC - allow safe HTML formatting)
	a.Content = sanitizer.SanitizeUGC(a.Content)

	// Sanitize summary (strict - no HTML allowed)
	a.Summary = sanitizer.SanitizeStrict(a.Summary)
}

// IsPublished checks if the article is published
func (a *Article) IsPublished() bool {
	return a.Status == StatusPublished && a.PublishedAt != nil
}

// CanBeEditedBy checks if a user can edit this article
func (a *Article) CanBeEditedBy(userID int64) bool {
	return a.AuthorID == userID
}

// ListFilter defines article list filter options
type ListFilter struct {
	Page       int
	Limit      int
	Status     string
	AuthorID   int64
	CategoryID int64
	TagID      int64
	Category   string
	Tag        string
	Search     string
	OrderBy    string
}

// Offset calculates the offset for pagination
func (f *ListFilter) Offset() int {
	if f.Page <= 0 {
		f.Page = 1
	}
	return (f.Page - 1) * f.Limit
}

// Repository is an alias for ArticleRepository (backward compatibility)
type Repository = ArticleRepository

// ArticleRepository defines the interface for article operations
type ArticleRepository interface {
	Create(article *Article) error
	FindByID(id int64) (*Article, error)
	FindBySlug(slug string) (*Article, error)
	List(filter *ListFilter) ([]*Article, int64, error)
	Update(article *Article) error
	Delete(id int64) error
	IncrementViewCount(id int64) error
	AttachTags(articleID int64, tagIDs []int64) error
	DetachTags(articleID int64) error
}
