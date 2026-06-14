package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad_Success(t *testing.T) {
	// Create a temporary config file
	content := `
server:
  port: "8080"
  mode: "test"

database:
  host: "localhost"
  port: 5432
  user: "test"
  password: "test"
  dbname: "testdb"

redis:
  host: "localhost"
  port: 6379
  password: ""
  db: 0

jwt:
  secret: "test-secret"
  expiry: "168h"

storage:
  r2:
    account_id: "test"
    access_key_id: "test"
    secret_access_key: "test"
    bucket: "test"
    public_url: "https://test.com"
`
	tmpfile, err := os.CreateTemp("", "config-*.yaml")
	assert.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(content))
	assert.NoError(t, err)
	tmpfile.Close()

	cfg, err := Load(tmpfile.Name())
	assert.NoError(t, err)
	assert.NotNil(t, cfg)
	assert.Equal(t, "8080", cfg.Server.Port)
	assert.Equal(t, "test", cfg.Server.Mode)
	assert.Equal(t, "localhost", cfg.Database.Host)
	assert.Equal(t, "test-secret", cfg.JWT.Secret)
}

func TestLoad_FileNotFound(t *testing.T) {
	cfg, err := Load("nonexistent.yaml")
	assert.Error(t, err)
	assert.Nil(t, cfg)
}

func TestLoad_InvalidYAML(t *testing.T) {
	content := `
invalid: yaml: content:
  - broken
`
	tmpfile, err := os.CreateTemp("", "config-*.yaml")
	assert.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(content))
	assert.NoError(t, err)
	tmpfile.Close()

	cfg, err := Load(tmpfile.Name())
	assert.Error(t, err)
	assert.Nil(t, cfg)
}
