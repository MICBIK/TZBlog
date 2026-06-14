package postgres

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"gorm.io/gorm"
)

// UserRepository implements user.UserRepository
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) user.UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user
func (r *UserRepository) Create(u *user.User) error {
	return r.db.Create(u).Error
}

// FindByID finds a user by ID
func (r *UserRepository) FindByID(id int64) (*user.User, error) {
	var u user.User
	err := r.db.First(&u, id).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindByEmail finds a user by email
func (r *UserRepository) FindByEmail(email string) (*user.User, error) {
	var u user.User
	err := r.db.Where("email = ?", email).First(&u).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindByUsername finds a user by username
func (r *UserRepository) FindByUsername(username string) (*user.User, error) {
	var u user.User
	err := r.db.Where("username = ?", username).First(&u).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// Update updates a user
func (r *UserRepository) Update(u *user.User) error {
	return r.db.Save(u).Error
}

// Delete deletes a user
func (r *UserRepository) Delete(id int64) error {
	return r.db.Delete(&user.User{}, id).Error
}

// UpdateLastLogin updates the last login time
func (r *UserRepository) UpdateLastLogin(id int64) error {
	now := time.Now()
	return r.db.Model(&user.User{}).
		Where("id = ?", id).
		Update("last_login_at", now).Error
}

// List returns paginated users
func (r *UserRepository) List(limit, offset int) ([]*user.User, int64, error) {
	var users []*user.User
	var total int64

	if err := r.db.Model(&user.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Limit(limit).Offset(offset).Find(&users).Error
	return users, total, err
}
