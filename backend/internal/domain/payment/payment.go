package domain

import "time"

// Payment represents a payment transaction
type Payment struct {
	ID              int64     `json:"id" gorm:"primaryKey"`
	UserID          int64     `json:"userId" gorm:"not null;index"`
	StripePaymentID string    `json:"stripePaymentId" gorm:"uniqueIndex"`
	Amount          int64     `json:"amount"` // Amount in cents
	Currency        string    `json:"currency" gorm:"type:varchar(3);default:'USD'"`
	Status          string    `json:"status" gorm:"type:varchar(20)"` // pending, succeeded, failed, canceled
	Description     string    `json:"description"`
	Metadata        string    `json:"metadata" gorm:"type:jsonb"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// TableName returns the table name
func (Payment) TableName() string {
	return "payments"
}

// MembershipTier represents a membership tier
type MembershipTier string

const (
	TierFree     MembershipTier = "free"
	TierBasic    MembershipTier = "basic"
	TierPremium  MembershipTier = "premium"
	TierLifetime MembershipTier = "lifetime"
)

// Membership represents a user membership
type Membership struct {
	ID                   int64          `json:"id" gorm:"primaryKey"`
	UserID               int64          `json:"userId" gorm:"uniqueIndex;not null"`
	Tier                 MembershipTier `json:"tier" gorm:"type:varchar(20);default:'free'"`
	Status               string         `json:"status" gorm:"type:varchar(20);default:'active'"` // active, canceled, expired
	StripeSubscriptionID string         `json:"stripeSubscriptionId" gorm:"uniqueIndex"`
	StartDate            time.Time      `json:"startDate"`
	EndDate              *time.Time     `json:"endDate"`
	CreatedAt            time.Time      `json:"createdAt"`
	UpdatedAt            time.Time      `json:"updatedAt"`
}

// TableName returns the table name
func (Membership) TableName() string {
	return "memberships"
}

// IsActive checks if membership is active
func (m *Membership) IsActive() bool {
	if m.Status != "active" {
		return false
	}
	if m.EndDate != nil && m.EndDate.Before(time.Now()) {
		return false
	}
	return true
}

// PaymentRepository defines the interface for payment operations
type PaymentRepository interface {
	Create(payment *Payment) error
	FindByID(id int64) (*Payment, error)
	FindByStripePaymentID(stripePaymentID string) (*Payment, error)
	FindByUserID(userID int64, limit, offset int) ([]*Payment, int64, error)
	UpdateStatus(id int64, status string) error
}

// MembershipRepository defines the interface for membership operations
type MembershipRepository interface {
	Create(membership *Membership) error
	FindByID(id int64) (*Membership, error)
	FindByUserID(userID int64) (*Membership, error)
	Update(membership *Membership) error
	UpdateTier(userID int64, tier MembershipTier, endDate *time.Time) error
	Cancel(userID int64) error
	GetActiveCount() (int64, error)
	GetCountByTier(tier MembershipTier) (int64, error)
}
