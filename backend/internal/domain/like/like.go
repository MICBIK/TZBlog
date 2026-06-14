package like

import "time"

// TargetType defines the type of entity that can be liked
type TargetType string

const (
	TargetTypeArticle TargetType = "article"
	TargetTypeComment TargetType = "comment"
)

// Like represents a like entity (polymorphic)
type Like struct {
	ID         int64      `json:"id" gorm:"primaryKey"`
	UserID     int64      `json:"userId" gorm:"not null;index:idx_user_target,unique"`
	TargetType TargetType `json:"targetType" gorm:"type:varchar(20);not null;index:idx_user_target,unique;index:idx_target"`
	TargetID   int64      `json:"targetId" gorm:"not null;index:idx_user_target,unique;index:idx_target"`
	CreatedAt  time.Time  `json:"createdAt"`
}

// TableName returns the table name
func (Like) TableName() string {
	return "likes"
}

// LikeRepository defines the interface for like operations
type LikeRepository interface {
	Create(like *Like) error
	Delete(userID int64, targetType TargetType, targetID int64) error
	IsLiked(userID int64, targetType TargetType, targetID int64) (bool, error)
	CountByTarget(targetType TargetType, targetID int64) (int64, error)
}
