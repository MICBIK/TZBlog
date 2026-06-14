package user

// User 用户模型
type User struct {
	ID           int64  `json:"id" gorm:"primaryKey"`
	Username     string `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Email        string `json:"email" gorm:"uniqueIndex;size:255;not null"`
	PasswordHash string `json:"-" gorm:"size:255;not null"`
	DisplayName  string `json:"display_name" gorm:"size:100"`
	AvatarURL    string `json:"avatar_url"`
	Bio          string `json:"bio"`
	Role         string `json:"role" gorm:"size:20;default:'user'"`
	IsVerified   bool   `json:"is_verified" gorm:"default:false"`
	CreatedAt    int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    int64  `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    *int64 `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// UserRepository 用户仓储接口
type UserRepository interface {
	Create(user *User) error
	FindByID(id int64) (*User, error)
	FindByEmail(email string) (*User, error)
	FindByUsername(username string) (*User, error)
	Update(user *User) error
	Delete(id int64) error
}
