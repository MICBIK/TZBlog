package postgres

import (
	"errors"

	"github.com/MICBIK/TZBlog/backend/internal/domain/category"
	"gorm.io/gorm"
)

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) category.CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(c *category.Category) error {
	return r.db.Create(c).Error
}

func (r *categoryRepository) FindAll() ([]*category.Category, error) {
	var categories []*category.Category
	err := r.db.Order("sort_order ASC, id ASC").Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) FindByID(id int64) (*category.Category, error) {
	var c category.Category
	err := r.db.Where("id = ?", id).First(&c).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *categoryRepository) FindBySlug(slug string) (*category.Category, error) {
	var c category.Category
	err := r.db.Where("slug = ?", slug).First(&c).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *categoryRepository) Update(c *category.Category) error {
	return r.db.Save(c).Error
}

func (r *categoryRepository) Delete(id int64) error {
	return r.db.Delete(&category.Category{}, id).Error
}
