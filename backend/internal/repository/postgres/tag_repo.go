package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"gorm.io/gorm"
)

// TagRepository implements tag.TagRepository
type TagRepository struct {
	db *gorm.DB
}

// NewTagRepository creates a new tag repository
func NewTagRepository(db *gorm.DB) tag.TagRepository {
	return &TagRepository{db: db}
}

// Create creates a new tag
func (r *TagRepository) Create(t *tag.Tag) error {
	return r.db.Create(t).Error
}

// FindByID finds a tag by ID
func (r *TagRepository) FindByID(id int64) (*tag.Tag, error) {
	var t tag.Tag
	err := r.db.First(&t, id).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// FindBySlug finds a tag by slug
func (r *TagRepository) FindBySlug(slug string) (*tag.Tag, error) {
	var t tag.Tag
	err := r.db.Where("slug = ?", slug).First(&t).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// List returns paginated tags
func (r *TagRepository) List(limit, offset int) ([]*tag.Tag, int64, error) {
	var tags []*tag.Tag
	var total int64

	if err := r.db.Model(&tag.Tag{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Limit(limit).Offset(offset).Find(&tags).Error
	return tags, total, err
}

// Update updates a tag
func (r *TagRepository) Update(t *tag.Tag) error {
	return r.db.Save(t).Error
}

// Delete deletes a tag
func (r *TagRepository) Delete(id int64) error {
	return r.db.Delete(&tag.Tag{}, id).Error
}

// FindByNames finds tags by names
func (r *TagRepository) FindByNames(names []string) ([]*tag.Tag, error) {
	var tags []*tag.Tag
	err := r.db.Where("name IN ?", names).Find(&tags).Error
	return tags, err
}

// FindByArticleID finds tags by article ID (requires article_tags join table)
func (r *TagRepository) FindByArticleID(articleID int64) ([]*tag.Tag, error) {
	var tags []*tag.Tag
	err := r.db.Table("tags").
		Joins("JOIN article_tags ON article_tags.tag_id = tags.id").
		Where("article_tags.article_id = ?", articleID).
		Find(&tags).Error
	return tags, err
}
