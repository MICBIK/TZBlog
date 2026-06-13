package category

type Category struct {
	ID          int64  `json:"id" gorm:"primaryKey"`
	Name        string `json:"name" gorm:"size:100;not null"`
	Slug        string `json:"slug" gorm:"uniqueIndex;size:100;not null"`
	Description string `json:"description"`
	ParentID    *int64 `json:"parent_id" gorm:"index"`
	SortOrder   int    `json:"sort_order" gorm:"default:0"`
	Icon        string `json:"icon" gorm:"size:50"`
	CreatedAt   int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

func (Category) TableName() string {
	return "categories"
}

type CategoryRepository interface {
	Create(category *Category) error
	FindAll() ([]*Category, error)
	FindByID(id int64) (*Category, error)
	FindBySlug(slug string) (*Category, error)
	Update(category *Category) error
	Delete(id int64) error
}
