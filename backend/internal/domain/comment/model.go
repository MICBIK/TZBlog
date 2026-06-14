package comment

type Comment struct {
	ID        int64  `json:"id" gorm:"primaryKey"`
	ArticleID int64  `json:"article_id" gorm:"not null;index"`
	UserID    int64  `json:"user_id" gorm:"not null;index"`
	ParentID  *int64 `json:"parent_id" gorm:"index"`
	Content   string `json:"content" gorm:"type:text;not null"`
	LikeCount int    `json:"like_count" gorm:"default:0"`
	CreatedAt int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt int64  `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt *int64 `json:"deleted_at,omitempty" gorm:"index"`
	User      *User  `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Replies   []*Comment `json:"replies,omitempty" gorm:"-"`
}

type User struct {
	ID          int64  `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
}

func (Comment) TableName() string {
	return "comments"
}

type CommentRepository interface {
	Create(comment *Comment) error
	FindByArticleID(articleID int64, limit, offset int) ([]*Comment, int64, error)
	FindByID(id int64) (*Comment, error)
	Delete(id int64) error
}
