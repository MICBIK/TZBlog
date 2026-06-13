package postgres

import (
	"errors"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"gorm.io/gorm"
)

type articleRepository struct {
	db *gorm.DB
}

func NewArticleRepository(db *gorm.DB) article.ArticleRepository {
	return &articleRepository{db: db}
}

func (r *articleRepository) Create(a *article.Article) error {
	return r.db.Create(a).Error
}

func (r *articleRepository) FindByID(id int64) (*article.Article, error) {
	var a article.Article
	err := r.db.Preload("Author").Preload("Tags").
		Where("id = ? AND deleted_at IS NULL", id).First(&a).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

func (r *articleRepository) FindBySlug(slug string) (*article.Article, error) {
	var a article.Article
	err := r.db.Preload("Author").Preload("Tags").
		Where("slug = ? AND deleted_at IS NULL", slug).First(&a).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

func (r *articleRepository) List(filter *article.ListFilter) ([]*article.Article, int64, error) {
	var articles []*article.Article
	var total int64

	query := r.db.Model(&article.Article{}).Where("deleted_at IS NULL")

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.CategoryID != nil {
		query = query.Where("category_id = ?", *filter.CategoryID)
	}
	if filter.AuthorID != nil {
		query = query.Where("author_id = ?", *filter.AuthorID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	switch filter.Sort {
	case "popular":
		query = query.Order("view_count DESC, created_at DESC")
	default:
		query = query.Order("created_at DESC")
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Preload("Author").Preload("Tags").
		Offset(offset).Limit(filter.Limit).Find(&articles).Error

	return articles, total, err
}

func (r *articleRepository) Update(a *article.Article) error {
	return r.db.Save(a).Error
}

func (r *articleRepository) Delete(id int64) error {
	return r.db.Model(&article.Article{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("EXTRACT(EPOCH FROM NOW())")).Error
}

func (r *articleRepository) IncrementViewCount(id int64) error {
	return r.db.Model(&article.Article{}).
		Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}
