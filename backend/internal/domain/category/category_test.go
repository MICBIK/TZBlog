package category

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestCategory_TableName tests category table name
func TestCategory_TableName(t *testing.T) {
	category := Category{}
	assert.Equal(t, "categories", category.TableName())
}
