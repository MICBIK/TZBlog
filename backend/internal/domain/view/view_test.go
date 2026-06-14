package view

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestView_TableName tests view table name
func TestView_TableName(t *testing.T) {
	view := View{}
	assert.Equal(t, "views", view.TableName())
}
