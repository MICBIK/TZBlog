package like

type Like struct {
	ID         int64  `json:"id" gorm:"primaryKey"`
	UserID     int64  `json:"user_id" gorm:"not null;index"`
	TargetID   int64  `json:"target_id" gorm:"not null"`
	TargetType string `json:"target_type" gorm:"size:20;not null"`
	CreatedAt  int64  `json:"created_at" gorm:"autoCreateTime"`
}

func (Like) TableName() string {
	return "likes"
}

type LikeRepository interface {
	Create(like *Like) error
	Delete(userID, targetID int64, targetType string) error
	HasLiked(userID, targetID int64, targetType string) (bool, error)
	GetLikeCount(targetID int64, targetType string) (int, error)
}
