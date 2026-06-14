package subscription

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestSubscription_TableName tests subscription table name
func TestSubscription_TableName(t *testing.T) {
	subscription := Subscription{}
	assert.Equal(t, "subscriptions", subscription.TableName())
}
