package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"gorm.io/gorm"
)

// ArticleRepositoryAdapter adapts postgres.ArticleRepository to domain.ArticleRepository
type ArticleRepositoryAdapter struct {
	repo *ArticleRepository
}

// NewArticleRepositoryAdapter creates a new adapter
func NewArticleRepositoryAdapter(db *gorm.DB) article.Repository {
	return &ArticleRepositoryAdapter{
		repo: NewArticleRepository(db),
	}
}

// Create creates a new article
func (a *ArticleRepositoryAdapter) Create(art *article.Article) error {
	pgArticle := domainToPostgres(art)
	return a.repo.Create(pgArticle)
}

// FindByID finds an article by ID
func (a *ArticleRepositoryAdapter) FindByID(id int64) (*article.Article, error) {
	pgArticle, err := a.repo.FindByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, article.ErrArticleNotFound
		}
		return nil, err
	}
	return postgresToDomain(pgArticle), nil
}

// FindBySlug finds an article by slug
func (a *ArticleRepositoryAdapter) FindBySlug(slug string) (*article.Article, error) {
	pgArticle, err := a.repo.FindBySlug(slug)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, article.ErrArticleNotFound
		}
		return nil, err
	}
	return postgresToDomain(pgArticle), nil
}

// List retrieves articles with filters
func (a *ArticleRepositoryAdapter) List(filter *article.ListFilter) ([]*article.Article, int64, error) {
	// For now, use a simplified approach
	pgArticles, total, err := a.repo.FindAll(filter.Limit, filter.Offset(), filter.Status)
	if err != nil {
		return nil, 0, err
	}

	articles := make([]*article.Article, len(pgArticles))
	for i, pg := range pgArticles {
		articles[i] = postgresToDomain(pg)
	}

	return articles, total, nil
}

// Update updates an article
func (a *ArticleRepositoryAdapter) Update(art *article.Article) error {
	pgArticle := domainToPostgres(art)
	return a.repo.Update(pgArticle)
}

// Delete deletes an article
func (a *ArticleRepositoryAdapter) Delete(id int64) error {
	return a.repo.Delete(id)
}

// IncrementViewCount increments view count
func (a *ArticleRepositoryAdapter) IncrementViewCount(id int64) error {
	return a.repo.IncrementViewCount(id)
}

// domainToPostgres converts domain article to postgres article
func domainToPostgres(art *article.Article) *Article {
	var publishedAt *int64
	if art.PublishedAt != nil {
		ts := art.PublishedAt.Unix()
		publishedAt = &ts
	}

	return &Article{
		ID:          art.ID,
		Title:       art.Title,
		Slug:        art.Slug,
		Content:     art.Content,
		AuthorID:    art.AuthorID,
		Status:      art.Status,
		ViewCount:   art.ViewCount,
		LikeCount:   art.LikeCount,
		ReadingTime: art.ReadingTime,
		CreatedAt:   art.CreatedAt.Unix(),
		UpdatedAt:   art.UpdatedAt.Unix(),
		PublishedAt: publishedAt,
	}
}

// postgresToDomain converts postgres article to domain article
func postgresToDomain(pg *Article) *article.Article {
	return &article.Article{
		ID:          pg.ID,
		Title:       pg.Title,
		Slug:        pg.Slug,
		Content:     pg.Content,
		AuthorID:    pg.AuthorID,
		Status:      pg.Status,
		ViewCount:   pg.ViewCount,
		LikeCount:   pg.LikeCount,
		ReadingTime: pg.ReadingTime,
	}
}
