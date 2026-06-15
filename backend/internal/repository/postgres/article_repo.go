package postgres

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"gorm.io/gorm"
)

// ArticleRepository implements article.Repository interface
type ArticleRepository struct {
	db *gorm.DB
}

// NewArticleRepository creates a new article repository
func NewArticleRepository(db *gorm.DB) article.Repository {
	return &ArticleRepository{db: db}
}

// Create creates a new article
func (r *ArticleRepository) Create(art *article.Article) error {
	// Set timestamps
	now := time.Now()
	art.CreatedAt = now
	art.UpdatedAt = now

	return r.db.Create(art).Error
}

// FindByID finds an article by ID
func (r *ArticleRepository) FindByID(id int64) (*article.Article, error) {
	var art article.Article
	err := r.db.Preload("Author").Preload("Tags").First(&art, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return &art, nil
}

// FindBySlug finds an article by slug
func (r *ArticleRepository) FindBySlug(slug string) (*article.Article, error) {
	var art article.Article
	err := r.db.Where("slug = ?", slug).
		Preload("Author").
		Preload("Tags").
		First(&art).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return &art, nil
}

// List retrieves articles with filters
func (r *ArticleRepository) List(filter *article.ListFilter) ([]*article.Article, int64, error) {
	var articles []*article.Article
	var total int64

	// Base query - omit content for performance (B4 fix)
	query := r.db.Model(&article.Article{}).Omit("content")

	// Apply filters
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.AuthorID > 0 {
		query = query.Where("author_id = ?", filter.AuthorID)
	}
	if filter.CategoryID > 0 {
		query = query.Where("category_id = ?", filter.CategoryID)
	}
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		query = query.Where("title LIKE ? OR content LIKE ?", searchPattern, searchPattern)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if filter.OrderBy != "" {
		query = query.Order(filter.OrderBy)
	} else {
		query = query.Order("created_at DESC")
	}

	// Apply pagination
	offset := filter.Offset()
	if err := query.Limit(filter.Limit).Offset(offset).Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

// Update updates an article
func (r *ArticleRepository) Update(art *article.Article) error {
	// Update timestamp
	art.UpdatedAt = time.Now()

	return r.db.Save(art).Error
}

// Delete soft deletes an article
func (r *ArticleRepository) Delete(id int64) error {
	return r.db.Delete(&article.Article{}, id).Error
}

// IncrementViewCount atomically increments view count
func (r *ArticleRepository) IncrementViewCount(id int64) error {
	return r.db.Model(&article.Article{}).
		Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error
}

// AttachTags attaches tags to an article
func (r *ArticleRepository) AttachTags(articleID int64, tagIDs []int64) error {
	if len(tagIDs) == 0 {
		return nil
	}

	// Create article_tags records
	var articleTags []article.ArticleTag
	for _, tagID := range tagIDs {
		articleTags = append(articleTags, article.ArticleTag{
			ArticleID: articleID,
			TagID:     tagID,
		})
	}

	return r.db.Create(&articleTags).Error
}

// DetachTags removes all tags from an article
func (r *ArticleRepository) DetachTags(articleID int64) error {
	return r.db.Where("article_id = ?", articleID).Delete(&article.ArticleTag{}).Error
}
