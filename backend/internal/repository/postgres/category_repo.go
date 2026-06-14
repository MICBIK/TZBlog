package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/category"
	"gorm.io/gorm"
)

// CategoryRepository implements category.CategoryRepository
type CategoryRepository struct {
	db *gorm.DB
}

// NewCategoryRepository creates a new category repository
func NewCategoryRepository(db *gorm.DB) category.CategoryRepository {
	return &CategoryRepository{db: db}
}

// Create creates a new category
func (r *CategoryRepository) Create(cat *category.Category) error {
	return r.db.Create(cat).Error
}

// FindByID finds a category by ID
func (r *CategoryRepository) FindByID(id int64) (*category.Category, error) {
	var cat category.Category
	err := r.db.First(&cat, id).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

// FindBySlug finds a category by slug
func (r *CategoryRepository) FindBySlug(slug string) (*category.Category, error) {
	var cat category.Category
	err := r.db.Where("slug = ?", slug).First(&cat).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

// FindAll returns all categories
func (r *CategoryRepository) FindAll() ([]*category.Category, error) {
	var categories []*category.Category
	err := r.db.Find(&categories).Error
	return categories, err
}

// List returns paginated categories
func (r *CategoryRepository) List(limit, offset int) ([]*category.Category, int64, error) {
	var categories []*category.Category
	var total int64

	if err := r.db.Model(&category.Category{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Limit(limit).Offset(offset).Find(&categories).Error
	return categories, total, err
}

// Update updates a category
func (r *CategoryRepository) Update(cat *category.Category) error {
	return r.db.Save(cat).Error
}

// Delete deletes a category
func (r *CategoryRepository) Delete(id int64) error {
	return r.db.Delete(&category.Category{}, id).Error
}
