package view

import "time"

// View represents an article view record
type View struct {
	ID        int64     `json:"id" gorm:"primaryKey"`
	ArticleID int64     `json:"articleId" gorm:"not null;index"`
	UserID    *int64    `json:"userId,omitempty" gorm:"index"`
	IPAddress string    `json:"ipAddress" gorm:"index"`
	UserAgent string    `json:"userAgent"`
	CreatedAt time.Time `json:"createdAt"`
}

// TableName returns the table name
func (View) TableName() string {
	return "views"
}

// ViewRepository defines the interface for view operations
type ViewRepository interface {
	Create(view *View) error
	CountByArticle(articleID int64) (int64, error)
	CountUnique(articleID int64, since time.Time) (int64, error)
}
