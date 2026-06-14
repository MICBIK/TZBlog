package user

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestUser_Validate tests user validation
func TestUser_Validate(t *testing.T) {
	tests := []struct {
		name    string
		user    *User
		wantErr error
	}{
		{
			name: "valid user",
			user: &User{
				Username: "testuser",
				Email:    "test@example.com",
			},
			wantErr: nil,
		},
		{
			name: "empty username",
			user: &User{
				Username: "",
				Email:    "test@example.com",
			},
			wantErr: ErrInvalidUsername,
		},
		{
			name: "username too short",
			user: &User{
				Username: "ab",
				Email:    "test@example.com",
			},
			wantErr: ErrInvalidUsernameLength,
		},
		{
			name: "username too long",
			user: &User{
				Username: "this_is_a_very_long_username_that_exceeds_fifty_characters_limit",
				Email:    "test@example.com",
			},
			wantErr: ErrInvalidUsernameLength,
		},
		{
			name: "empty email",
			user: &User{
				Username: "testuser",
				Email:    "",
			},
			wantErr: ErrInvalidEmail,
		},
		{
			name: "invalid email format",
			user: &User{
				Username: "testuser",
				Email:    "invalid-email",
			},
			wantErr: ErrInvalidEmailFormat,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.user.Validate()
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// TestUser_SetPassword tests password hashing
func TestUser_SetPassword(t *testing.T) {
	user := &User{}

	tests := []struct {
		name     string
		password string
		wantErr  error
	}{
		{
			name:     "valid password",
			password: "password123",
			wantErr:  nil,
		},
		{
			name:     "password too short",
			password: "short",
			wantErr:  ErrPasswordTooShort,
		},
		{
			name:     "password too long",
			password: "this_is_an_extremely_long_password_that_exceeds_the_seventy_two_character_limit_for_bcrypt_hashing",
			wantErr:  ErrPasswordTooLong,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := user.SetPassword(tt.password)
			if tt.wantErr != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.wantErr, err)
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, user.PasswordHash)
			}
		})
	}
}

// TestUser_CheckPassword tests password verification
func TestUser_CheckPassword(t *testing.T) {
	user := &User{}
	password := "testpassword123"

	// Set password
	err := user.SetPassword(password)
	assert.NoError(t, err)

	// Test correct password
	assert.True(t, user.CheckPassword(password))

	// Test incorrect password
	assert.False(t, user.CheckPassword("wrongpassword"))
}

// TestUser_IsActive tests active status check
func TestUser_IsActive(t *testing.T) {
	tests := []struct {
		name   string
		status string
		want   bool
	}{
		{
			name:   "active user",
			status: StatusActive,
			want:   true,
		},
		{
			name:   "inactive user",
			status: StatusInactive,
			want:   false,
		},
		{
			name:   "banned user",
			status: StatusBanned,
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user := &User{Status: tt.status}
			assert.Equal(t, tt.want, user.IsActive())
		})
	}
}

// TestUser_TableName tests table name
func TestUser_TableName(t *testing.T) {
	user := User{}
	assert.Equal(t, "users", user.TableName())
}

// TestIsValidEmail tests email validation
func TestIsValidEmail(t *testing.T) {
	tests := []struct {
		name  string
		email string
		want  bool
	}{
		{
			name:  "valid email",
			email: "test@example.com",
			want:  true,
		},
		{
			name:  "valid email with subdomain",
			email: "user@mail.example.com",
			want:  true,
		},
		{
			name:  "invalid - no @",
			email: "testexample.com",
			want:  false,
		},
		{
			name:  "invalid - multiple @",
			email: "test@@example.com",
			want:  false,
		},
		{
			name:  "invalid - no domain",
			email: "test@",
			want:  false,
		},
		{
			name:  "invalid - no username",
			email: "@example.com",
			want:  false,
		},
		{
			name:  "invalid - no dot in domain",
			email: "test@example",
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidEmail(tt.email)
			assert.Equal(t, tt.want, result)
		})
	}
}
