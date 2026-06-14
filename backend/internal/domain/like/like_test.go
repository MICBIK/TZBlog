package like

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestLike_TableName tests like table name
func TestLike_TableName(t *testing.T) {
	like := Like{}
	assert.Equal(t, "likes", like.TableName())
}
