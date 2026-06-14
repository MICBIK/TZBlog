package like

import "time"

// Like represents a like entity
type Like struct {
	ID        int64     `json:"id" gorm:"primaryKey"`
	ArticleID int64     `json:"articleId" gorm:"not null;index:idx_article_user,unique"`
	UserID    int64     `json:"userId" gorm:"not null;index:idx_article_user,unique"`
	CreatedAt time.Time `json:"createdAt"`
}

// TableName returns the table name
func (Like) TableName() string {
	return "likes"
}

// LikeRepository defines the interface for like operations
type LikeRepository interface {
	Create(like *Like) error
	Delete(articleID, userID int64) error
	IsLiked(articleID, userID int64) (bool, error)
	CountByArticle(articleID int64) (int64, error)
}
