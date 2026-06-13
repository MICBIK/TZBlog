package postgres

import (
	"errors"

	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"gorm.io/gorm"
)

type tagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) tag.TagRepository {
	return &tagRepository{db: db}
}

func (r *tagRepository) Create(t *tag.Tag) error {
	return r.db.Create(t).Error
}

func (r *tagRepository) FindAll() ([]*tag.Tag, error) {
	var tags []*tag.Tag
	err := r.db.Order("usage_count DESC, name ASC").Find(&tags).Error
	return tags, err
}

func (r *tagRepository) FindByID(id int64) (*tag.Tag, error) {
	var t tag.Tag
	err := r.db.Where("id = ?", id).First(&t).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (r *tagRepository) FindBySlug(slug string) (*tag.Tag, error) {
	var t tag.Tag
	err := r.db.Where("slug = ?", slug).First(&t).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (r *tagRepository) Update(t *tag.Tag) error {
	return r.db.Save(t).Error
}

func (r *tagRepository) Delete(id int64) error {
	return r.db.Delete(&tag.Tag{}, id).Error
}
