package domain

import "time"

// Subscription represents an email subscription
type Subscription struct {
	ID         int64     `json:"id" gorm:"primaryKey"`
	Email      string    `json:"email" gorm:"uniqueIndex;not null"`
	Status     string    `json:"status" gorm:"type:varchar(20);default:'active'"`
	Token      string    `json:"-" gorm:"uniqueIndex;not null"`
	VerifiedAt *time.Time `json:"verifiedAt"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// TableName returns the table name
func (Subscription) TableName() string {
	return "subscriptions"
}

// SubscriptionRepository defines the interface for subscription operations
type SubscriptionRepository interface {
	Subscribe(email string) (*Subscription, error)
	Verify(token string) error
	Unsubscribe(token string) error
	FindByEmail(email string) (*Subscription, error)
	FindByToken(token string) (*Subscription, error)
	GetActiveSubscribers(limit, offset int) ([]*Subscription, int64, error)
	GetCount() (int64, error)
}
