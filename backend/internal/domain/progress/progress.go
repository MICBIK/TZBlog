package progress

import "time"

// Progress represents a reading progress entity
type Progress struct {
	ID         int64     `json:"id" gorm:"primaryKey"`
	UserID     int64     `json:"userId" gorm:"not null;index:idx_user_article,unique"`
	ArticleID  int64     `json:"articleId" gorm:"not null;index:idx_user_article,unique"`
	Percentage int       `json:"percentage" gorm:"default:0"`
	LastReadAt time.Time `json:"lastReadAt"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// TableName returns the table name
func (Progress) TableName() string {
	return "reading_progress"
}

// ProgressRepository defines the interface for progress operations
type ProgressRepository interface {
	Upsert(progress *Progress) error
	FindByUserAndArticle(userID, articleID int64) (*Progress, error)
	FindByUser(userID int64, limit, offset int) ([]*Progress, int64, error)
}
