package follow

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFollow_TableName(t *testing.T) {
	f := Follow{}
	assert.Equal(t, "follows", f.TableName())
}

func TestFollow_Fields(t *testing.T) {
	f := Follow{
		ID:          1,
		FollowerID:  100,
		FollowingID: 200,
	}

	assert.Equal(t, int64(1), f.ID)
	assert.Equal(t, int64(100), f.FollowerID)
	assert.Equal(t, int64(200), f.FollowingID)
}
