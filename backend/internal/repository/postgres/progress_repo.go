package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/progress"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ProgressRepository implements progress.ProgressRepository
type ProgressRepository struct {
	db *gorm.DB
}

// NewProgressRepository creates a new progress repository
func NewProgressRepository(db *gorm.DB) progress.ProgressRepository {
	return &ProgressRepository{db: db}
}

// Upsert creates or updates a progress record
func (r *ProgressRepository) Upsert(p *progress.Progress) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "article_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"percentage", "last_read_at", "updated_at"}),
	}).Create(p).Error
}

// FindByUserAndArticle finds progress by user and article
func (r *ProgressRepository) FindByUserAndArticle(userID, articleID int64) (*progress.Progress, error) {
	var p progress.Progress
	err := r.db.Where("user_id = ? AND article_id = ?", userID, articleID).First(&p).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// FindByUser finds all progress records for a user
func (r *ProgressRepository) FindByUser(userID int64, limit, offset int) ([]*progress.Progress, int64, error) {
	var progressList []*progress.Progress
	var total int64

	if err := r.db.Model(&progress.Progress{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Where("user_id = ?", userID).
		Limit(limit).
		Offset(offset).
		Order("last_read_at DESC").
		Find(&progressList).Error

	return progressList, total, err
}
