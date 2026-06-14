package postgres

import (
	"gorm.io/gorm"
)

type ArticleRepository struct {
	db *gorm.DB
}

func NewArticleRepository(db *gorm.DB) *ArticleRepository {
	return &ArticleRepository{db: db}
}

// Article represents the article model
type Article struct {
	ID          int64  `gorm:"primaryKey"`
	Title       string
	Slug        string `gorm:"uniqueIndex"`
	Content     string
	AuthorID    int64
	Status      string
	ViewCount   int64
	LikeCount   int64
	ReadingTime int
	DeletedAt   *gorm.DeletedAt `gorm:"index"`
	CreatedAt   int64
	UpdatedAt   int64
	PublishedAt *int64

	// Relations
	Author *Author       `gorm:"foreignKey:AuthorID"`
	Tags   []*Tag        `gorm:"many2many:article_tags"`
}

type Author struct {
	ID       int64  `gorm:"primaryKey"`
	Username string
	Avatar   string
}

type Tag struct {
	ID   int64  `gorm:"primaryKey"`
	Name string
	Slug string
}

func (Article) TableName() string {
	return "articles"
}

func (Author) TableName() string {
	return "users"
}

func (Tag) TableName() string {
	return "tags"
}

// FindByID retrieves a single article by ID with optimized preloading
func (r *ArticleRepository) FindByID(id int64) (*Article, error) {
	var article Article

	err := r.db.
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, avatar")
		}).
		Preload("Tags", func(db *gorm.DB) *gorm.DB {
			return db.Select("tags.id, tags.name, tags.slug")
		}).
		First(&article, id).Error

	return &article, err
}

// FindBySlug retrieves a single article by slug with optimized preloading
func (r *ArticleRepository) FindBySlug(slug string) (*Article, error) {
	var article Article

	err := r.db.
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, avatar")
		}).
		Preload("Tags", func(db *gorm.DB) *gorm.DB {
			return db.Select("tags.id, tags.name, tags.slug")
		}).
		Where("slug = ?", slug).
		First(&article).Error

	return &article, err
}

// FindAll retrieves multiple articles with optimized preloading
// This fixes PERF-001: N+1 query problem
// Before: 20 articles = 1 + 20 (authors) + 20 (tags) = 41 queries
// After: 20 articles = 1 + 1 (authors) + 1 (tags) = 3 queries
func (r *ArticleRepository) FindAll(limit, offset int, status string) ([]*Article, int64, error) {
	var articles []*Article
	var total int64

	// Base query
	query := r.db.Model(&Article{})

	// Apply status filter if provided
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Fetch articles with optimized preloading
	// Use separate queries for Author and Tags to avoid JOIN explosion
	err := query.
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			// Only select necessary fields to reduce data transfer
			return db.Select("id, username, avatar")
		}).
		Preload("Tags", func(db *gorm.DB) *gorm.DB {
			// Only select necessary fields
			return db.Select("tags.id, tags.name, tags.slug")
		}).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&articles).Error

	return articles, total, err
}

// FindByAuthor retrieves articles by author with optimized preloading
func (r *ArticleRepository) FindByAuthor(authorID int64, limit, offset int) ([]*Article, int64, error) {
	var articles []*Article
	var total int64

	query := r.db.Model(&Article{}).Where("author_id = ?", authorID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, avatar")
		}).
		Preload("Tags", func(db *gorm.DB) *gorm.DB {
			return db.Select("tags.id, tags.name, tags.slug")
		}).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&articles).Error

	return articles, total, err
}

// FindByTag retrieves articles by tag with optimized preloading
func (r *ArticleRepository) FindByTag(tagID int64, limit, offset int) ([]*Article, int64, error) {
	var articles []*Article
	var total int64

	// Join with article_tags to filter by tag
	query := r.db.Model(&Article{}).
		Joins("INNER JOIN article_tags ON article_tags.article_id = articles.id").
		Where("article_tags.tag_id = ?", tagID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, avatar")
		}).
		Preload("Tags", func(db *gorm.DB) *gorm.DB {
			return db.Select("tags.id, tags.name, tags.slug")
		}).
		Order("articles.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&articles).Error

	return articles, total, err
}

// Create inserts a new article
func (r *ArticleRepository) Create(article *Article) error {
	return r.db.Create(article).Error
}

// Update modifies an existing article
func (r *ArticleRepository) Update(article *Article) error {
	return r.db.Save(article).Error
}

// Delete soft-deletes an article
func (r *ArticleRepository) Delete(id int64) error {
	return r.db.Delete(&Article{}, id).Error
}

// IncrementViewCount atomically increments the view count
func (r *ArticleRepository) IncrementViewCount(id int64) error {
	return r.db.Model(&Article{}).
		Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error
}

// IncrementLikeCount atomically increments the like count
func (r *ArticleRepository) IncrementLikeCount(id int64) error {
	return r.db.Model(&Article{}).
		Where("id = ?", id).
		UpdateColumn("like_count", gorm.Expr("like_count + ?", 1)).Error
}

// DecrementLikeCount atomically decrements the like count
func (r *ArticleRepository) DecrementLikeCount(id int64) error {
	return r.db.Model(&Article{}).
		Where("id = ?", id).
		Where("like_count > 0").
		UpdateColumn("like_count", gorm.Expr("like_count - ?", 1)).Error
}
