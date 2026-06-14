package tag

type Tag struct {
	ID         int64  `json:"id" gorm:"primaryKey"`
	Name       string `json:"name" gorm:"uniqueIndex;size:50;not null"`
	Slug       string `json:"slug" gorm:"uniqueIndex;size:50;not null"`
	Color      string `json:"color" gorm:"size:7"`
	UsageCount int    `json:"usage_count" gorm:"default:0"`
	CreatedAt  int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (Tag) TableName() string {
	return "tags"
}

type TagRepository interface {
	Create(tag *Tag) error
	FindAll() ([]*Tag, error)
	FindByID(id int64) (*Tag, error)
	FindBySlug(slug string) (*Tag, error)
	Update(tag *Tag) error
	Delete(id int64) error
}
