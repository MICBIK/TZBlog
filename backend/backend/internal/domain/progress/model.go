package progress

type UserReadProgress struct {
	UserID       int64 `json:"user_id" gorm:"primaryKey"`
	ArticleID    int64 `json:"article_id" gorm:"primaryKey"`
	Progress     int   `json:"progress" gorm:"default:0"`
	LastPosition int   `json:"last_position" gorm:"default:0"`
	UpdatedAt    int64 `json:"updated_at" gorm:"autoUpdateTime"`
}

func (UserReadProgress) TableName() string {
	return "user_read_progress"
}

type ProgressRepository interface {
	SaveProgress(progress *UserReadProgress) error
	GetProgress(userID, articleID int64) (*UserReadProgress, error)
}
