package domain

import "time"

// Follow represents a user follow relationship
type Follow struct {
	ID         int64     `json:"id" gorm:"primaryKey"`
	FollowerID int64     `json:"followerId" gorm:"not null;index:idx_follower_following,unique"`
	FollowingID int64    `json:"followingId" gorm:"not null;index:idx_follower_following,unique"`
	CreatedAt  time.Time `json:"createdAt"`
}

// TableName returns the table name
func (Follow) TableName() string {
	return "follows"
}

// FollowRepository defines the interface for follow operations
type FollowRepository interface {
	Follow(followerID, followingID int64) error
	Unfollow(followerID, followingID int64) error
	IsFollowing(followerID, followingID int64) (bool, error)
	GetFollowers(userID int64, limit, offset int) ([]*User, int64, error)
	GetFollowing(userID int64, limit, offset int) ([]*User, int64, error)
	GetFollowerCount(userID int64) (int64, error)
	GetFollowingCount(userID int64) (int64, error)
}
