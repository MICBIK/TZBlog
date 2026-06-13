package postgres

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/view"
	"gorm.io/gorm"
)

type viewRepository struct {
	db *gorm.DB
}

func NewViewRepository(db *gorm.DB) view.ViewRepository {
	return &viewRepository{db: db}
}

func (r *viewRepository) RecordView(v *view.ArticleView) error {
	return r.db.Create(v).Error
}

func (r *viewRepository) CanRecordView(articleID int64, ipHash string) (bool, error) {
	oneHourAgo := time.Now().Unix() - 3600
	var count int64

	err := r.db.Model(&view.ArticleView{}).
		Where("article_id = ? AND ip_address = ? AND created_at > ?",
			articleID, ipHash, oneHourAgo).
		Count(&count).Error

	return count == 0, err
}

func (r *viewRepository) GetHotArticles(limit int) ([]view.HotArticle, error) {
	var results []view.HotArticle

	err := r.db.Raw(`
		SELECT a.id as article_id, a.title, COUNT(v.id) as view_count
		FROM articles a
		LEFT JOIN article_views v ON a.id = v.article_id
		WHERE a.deleted_at IS NULL AND a.status = 'published'
		GROUP BY a.id, a.title
		ORDER BY view_count DESC
		LIMIT ?
	`, limit).Scan(&results).Error

	return results, err
}
