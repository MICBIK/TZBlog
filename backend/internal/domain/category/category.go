package category

import "time"

// Category represents a category entity
type Category struct {
	ID          int64      `json:"id" gorm:"primaryKey"`
	Name        string     `json:"name" gorm:"not null;uniqueIndex"`
	Slug        string     `json:"slug" gorm:"not null;uniqueIndex"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	DeletedAt   *time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

// TableName returns the table name
func (Category) TableName() string {
	return "categories"
}

// CategoryRepository defines the interface for category operations
type CategoryRepository interface {
	Create(category *Category) error
	FindByID(id int64) (*Category, error)
	FindBySlug(slug string) (*Category, error)
	List(limit, offset int) ([]*Category, int64, error)
	Update(category *Category) error
	Delete(id int64) error
}
