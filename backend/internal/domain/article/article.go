package article

import (
	"errors"
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

// Errors
var (
	ErrArticleNotFound      = errors.New("article not found")
	ErrInvalidTitle         = errors.New("article title is required")
	ErrTitleTooLong         = errors.New("article title is too long (max 200 characters)")
	ErrInvalidContent       = errors.New("article content is required")
	ErrContentTooLong       = errors.New("article content is too long (max 100,000 characters)")
	ErrInvalidSummary       = errors.New("article summary is too long (max 500 characters)")
	ErrInvalidStatus        = errors.New("invalid article status")
	ErrInvalidSlug          = errors.New("invalid article slug")
	ErrInvalidAuthorID      = errors.New("article author ID is required")
	ErrUnauthorized         = errors.New("unauthorized to perform this action")
)

// Article represents an article entity
type Article struct {
	ID            int64      `json:"id" gorm:"primaryKey"`
	Title         string     `json:"title" gorm:"not null"`
	Slug          string     `json:"slug" gorm:"uniqueIndex;not null"`
	Content       string     `json:"content" gorm:"type:text"`
	Summary       string     `json:"summary"`
	CoverImage    string     `json:"coverImage"`
	AuthorID      int64      `json:"authorId" gorm:"not null;index"`
	CategoryID    int64      `json:"categoryId" gorm:"index"`
	Status        string     `json:"status" gorm:"default:'draft'"` // draft, published, archived
	ReadingTime   int        `json:"readingTime"`                   // in minutes
	ViewCount     int64      `json:"viewCount" gorm:"default:0"`
	LikeCount     int64      `json:"likeCount" gorm:"default:0"`
	CommentCount  int64      `json:"commentCount" gorm:"default:0"`
	PublishedAt   *time.Time `json:"publishedAt,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	DeletedAt     *time.Time `json:"deletedAt,omitempty" gorm:"index"`

	// Relations (not stored in DB, loaded separately)
	Author *user.User `json:"author,omitempty" gorm:"-"`
	Tags   []*tag.Tag `json:"tags,omitempty" gorm:"-"`
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
}
