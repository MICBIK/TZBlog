package tag

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestTag_TableName tests tag table name
func TestTag_TableName(t *testing.T) {
	tag := Tag{}
	assert.Equal(t, "tags", tag.TableName())
}
