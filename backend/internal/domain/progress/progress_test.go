package progress

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestProgress_TableName tests progress table name
func TestProgress_TableName(t *testing.T) {
	progress := Progress{}
	assert.Equal(t, "reading_progress", progress.TableName())
}
