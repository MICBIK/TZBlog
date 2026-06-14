package tag

import "time"

// Tag represents a tag entity
type Tag struct {
	ID        int64      `json:"id" gorm:"primaryKey"`
	Name      string     `json:"name" gorm:"not null;uniqueIndex"`
	Slug      string     `json:"slug" gorm:"not null;uniqueIndex"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt *time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

// TableName returns the table name
func (Tag) TableName() string {
	return "tags"
}

// TagRepository defines the interface for tag operations
type TagRepository interface {
	Create(tag *Tag) error
	FindByID(id int64) (*Tag, error)
	FindBySlug(slug string) (*Tag, error)
	List(limit, offset int) ([]*Tag, int64, error)
	Update(tag *Tag) error
	Delete(id int64) error
	FindByNames(names []string) ([]*Tag, error)
	FindByArticleID(articleID int64) ([]*Tag, error)
}
