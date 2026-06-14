package comment

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestComment_Validate tests comment validation
func TestComment_Validate(t *testing.T) {
	tests := []struct {
		name    string
		comment *Comment
		wantErr error
	}{
		{
			name: "valid comment",
			comment: &Comment{
				Content:   "This is a valid comment",
				ArticleID: 1,
				UserID:    1,
			},
			wantErr: nil,
		},
		{
			name: "empty content",
			comment: &Comment{
				Content:   "",
				ArticleID: 1,
				UserID:    1,
			},
			wantErr: ErrInvalidContent,
		},
		{
			name: "content too long",
			comment: &Comment{
				Content:   makeString(1001),
				ArticleID: 1,
				UserID:    1,
			},
			wantErr: ErrContentTooLong,
		},
		{
			name: "content at max length",
			comment: &Comment{
				Content:   makeString(1000),
				ArticleID: 1,
				UserID:    1,
			},
			wantErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.comment.Validate()
			if tt.wantErr != nil {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestComment_CanBeEditedBy tests edit permission check
func TestComment_CanBeEditedBy(t *testing.T) {
	comment := &Comment{UserID: 1}

	assert.True(t, comment.CanBeEditedBy(1))
	assert.False(t, comment.CanBeEditedBy(2))
}

// TestComment_TableName tests table name
func TestComment_TableName(t *testing.T) {
	comment := Comment{}
	assert.Equal(t, "comments", comment.TableName())
}

// Helper function
func makeString(length int) string {
	result := ""
	for i := 0; i < length; i++ {
		result += "a"
	}
	return result
}
