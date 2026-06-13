package article

import "time"

// Article 文章模型
type Article struct {
	ID           int64     `json:"id" gorm:"primaryKey"`
	AuthorID     int64     `json:"author_id" gorm:"not null;index"`
	CategoryID   *int64    `json:"category_id" gorm:"index"`
	Title        string    `json:"title" gorm:"size:255;not null"`
	Slug         string    `json:"slug" gorm:"uniqueIndex;size:255;not null"`
	Summary      string    `json:"summary"`
	Content      string    `json:"content" gorm:"type:text;not null"`
	CoverImage   string    `json:"cover_image"`
	Status       string    `json:"status" gorm:"size:20;default:'draft';index"`
	IsFeatured   bool      `json:"is_featured" gorm:"default:false"`
	IsPremium    bool      `json:"is_premium" gorm:"default:false"`
	ViewCount    int       `json:"view_count" gorm:"default:0"`
	LikeCount    int       `json:"like_count" gorm:"default:0"`
	CommentCount int       `json:"comment_count" gorm:"default:0"`
	ReadingTime  int       `json:"reading_time"`
	PublishedAt  *int64    `json:"published_at" gorm:"index"`
	CreatedAt    int64     `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    int64     `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    *int64    `json:"deleted_at,omitempty" gorm:"index"`
	Author       *Author   `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	Tags         []Tag     `json:"tags,omitempty" gorm:"many2many:article_tags"`
}

type Author struct {
	ID          int64  `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
}

type Tag struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

func (Article) TableName() string {
	return "articles"
}

// ArticleRepository 文章仓储接口
type ArticleRepository interface {
	Create(article *Article) error
	FindByID(id int64) (*Article, error)
	FindBySlug(slug string) (*Article, error)
	List(filter *ListFilter) ([]*Article, int64, error)
	Update(article *Article) error
	Delete(id int64) error
	IncrementViewCount(id int64) error
}

// ListFilter 列表过滤器
type ListFilter struct {
	Page       int
	Limit      int
	CategoryID *int64
	Tag        string
	Status     string
	Sort       string
	AuthorID   *int64
}
