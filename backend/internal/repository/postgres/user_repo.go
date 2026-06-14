package postgres

import (
	"errors"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建用户仓储
func NewUserRepository(db *gorm.DB) user.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(u *user.User) error {
	return r.db.Create(u).Error
}

func (r *userRepository) FindByID(id int64) (*user.User, error) {
	var u user.User
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByEmail(email string) (*user.User, error) {
	var u user.User
	err := r.db.Where("email = ? AND deleted_at IS NULL", email).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByUsername(username string) (*user.User, error) {
	var u user.User
	err := r.db.Where("username = ? AND deleted_at IS NULL", username).First(&u).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) Update(u *user.User) error {
	return r.db.Save(u).Error
}

func (r *userRepository) Delete(id int64) error {
	return r.db.Model(&user.User{}).Where("id = ?", id).Update("deleted_at", gorm.Expr("EXTRACT(EPOCH FROM NOW())")).Error
}
