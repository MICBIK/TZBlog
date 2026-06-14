package payment

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestPayment_TableName tests payment table name
func TestPayment_TableName(t *testing.T) {
	payment := Payment{}
	assert.Equal(t, "payments", payment.TableName())
}

// TestMembership_TableName tests membership table name
func TestMembership_TableName(t *testing.T) {
	membership := Membership{}
	assert.Equal(t, "memberships", membership.TableName())
}

// TestMembership_IsActive tests membership active status check
func TestMembership_IsActive(t *testing.T) {
	now := time.Now()
	future := now.Add(24 * time.Hour)
	past := now.Add(-24 * time.Hour)

	tests := []struct {
		name       string
		membership *Membership
		want       bool
	}{
		{
			name: "active with no end date",
			membership: &Membership{
				Status:  "active",
				EndDate: nil,
			},
			want: true,
		},
		{
			name: "active with future end date",
			membership: &Membership{
				Status:  "active",
				EndDate: &future,
			},
			want: true,
		},
		{
			name: "active with past end date",
			membership: &Membership{
				Status:  "active",
				EndDate: &past,
			},
			want: false,
		},
		{
			name: "canceled status",
			membership: &Membership{
				Status:  "canceled",
				EndDate: nil,
			},
			want: false,
		},
		{
			name: "expired status",
			membership: &Membership{
				Status:  "expired",
				EndDate: &past,
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.membership.IsActive())
		})
	}
}

// TestMembershipTier_Constants tests membership tier constants
func TestMembershipTier_Constants(t *testing.T) {
	assert.Equal(t, MembershipTier("free"), TierFree)
	assert.Equal(t, MembershipTier("basic"), TierBasic)
	assert.Equal(t, MembershipTier("premium"), TierPremium)
	assert.Equal(t, MembershipTier("lifetime"), TierLifetime)
}
