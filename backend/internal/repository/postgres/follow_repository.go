package postgres

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/follow"
	"github.com/MICBIK/TZBlog/backend/internal/domain/user"
	"gorm.io/gorm"
)

type FollowRepository struct {
	db *gorm.DB
}

func NewFollowRepository(db *gorm.DB) *FollowRepository {
	return &FollowRepository{db: db}
}

// Follow creates a follow relationship
func (r *FollowRepository) Follow(followerID, followingID int64) error {
	if followerID == followingID {
		return gorm.ErrInvalidValue
	}

	f := &follow.Follow{
		FollowerID:  followerID,
		FollowingID: followingID,
	}

	return r.db.Create(f).Error
}

// Unfollow removes a follow relationship
func (r *FollowRepository) Unfollow(followerID, followingID int64) error {
	return r.db.Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&follow.Follow{}).Error
}

// IsFollowing checks if follower is following the user
func (r *FollowRepository) IsFollowing(followerID, followingID int64) (bool, error) {
	var count int64
	err := r.db.Model(&follow.Follow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error

	return count > 0, err
}

// GetFollowers returns users who follow the specified user
func (r *FollowRepository) GetFollowers(userID int64, limit, offset int) ([]*user.User, int64, error) {
	var followers []*user.User
	var total int64

	// Get total count
	err := r.db.Model(&follow.Follow{}).
		Where("following_id = ?", userID).
		Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get followers with pagination
	err = r.db.Table("users").
		Select("users.*").
		Joins("INNER JOIN follows ON follows.follower_id = users.id").
		Where("follows.following_id = ?", userID).
		Limit(limit).
		Offset(offset).
		Find(&followers).Error

	return followers, total, err
}

// GetFollowing returns users that the specified user is following
func (r *FollowRepository) GetFollowing(userID int64, limit, offset int) ([]*user.User, int64, error) {
	var following []*user.User
	var total int64

	// Get total count
	err := r.db.Model(&follow.Follow{}).
		Where("follower_id = ?", userID).
		Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Get following with pagination
	err = r.db.Table("users").
		Select("users.*").
		Joins("INNER JOIN follows ON follows.following_id = users.id").
		Where("follows.follower_id = ?", userID).
		Limit(limit).
		Offset(offset).
		Find(&following).Error

	return following, total, err
}

// GetFollowerCount returns the number of followers
func (r *FollowRepository) GetFollowerCount(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&follow.Follow{}).
		Where("following_id = ?", userID).
		Count(&count).Error
	return count, err
}

// GetFollowingCount returns the number of users being followed
func (r *FollowRepository) GetFollowingCount(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&follow.Follow{}).
		Where("follower_id = ?", userID).
		Count(&count).Error
	return count, err
}
