package postgres

import (
	"errors"

	"github.com/MICBIK/TZBlog/backend/internal/domain/progress"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type progressRepository struct {
	db *gorm.DB
}

func NewProgressRepository(db *gorm.DB) progress.ProgressRepository {
	return &progressRepository{db: db}
}

func (r *progressRepository) SaveProgress(p *progress.UserReadProgress) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "article_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"progress", "last_position", "updated_at"}),
	}).Create(p).Error
}

func (r *progressRepository) GetProgress(userID, articleID int64) (*progress.UserReadProgress, error) {
	var p progress.UserReadProgress
	err := r.db.Where("user_id = ? AND article_id = ?", userID, articleID).First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}
