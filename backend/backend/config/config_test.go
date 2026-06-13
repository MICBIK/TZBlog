package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	// 创建临时配置文件
	configContent := `
server:
  port: 8080
  mode: debug

database:
  host: localhost
  port: 5432
  user: postgres
  password: password
  dbname: tzblog
  sslmode: disable
  max_idle_conns: 10
  max_open_conns: 100
  conn_max_lifetime: 1h

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0
  pool_size: 10

jwt:
  secret: test-secret
  expiry: 168h

storage:
  provider: cloudflare_r2
  r2:
    account_id: test-account
    access_key_id: test-key
    secret_access_key: test-secret
    bucket: test-bucket
    public_url: https://cdn.test.com
    region: auto

log:
  level: info
  format: json
  output: stdout
  file_path: logs/app.log
`

	tmpFile, err := os.CreateTemp("", "config-*.yaml")
	if err != nil {
		t.Fatalf("Failed to create temp config file: %v", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(configContent); err != nil {
		t.Fatalf("Failed to write temp config file: %v", err)
	}
	tmpFile.Close()

	// 测试加载配置
	cfg, err := Load(tmpFile.Name())
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	// 验证配置
	if cfg.Server.Port != "8080" {
		t.Errorf("Expected port 8080, got %s", cfg.Server.Port)
	}

	if cfg.Database.Host != "localhost" {
		t.Errorf("Expected database host localhost, got %s", cfg.Database.Host)
	}

	if cfg.JWT.Secret != "test-secret" {
		t.Errorf("Expected JWT secret test-secret, got %s", cfg.JWT.Secret)
	}

	if cfg.JWT.Expiry != 168*time.Hour {
		t.Errorf("Expected JWT expiry 168h, got %v", cfg.JWT.Expiry)
	}
}

func TestGetDSN(t *testing.T) {
	dbConfig := DatabaseConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "password",
		DBName:   "tzblog",
		SSLMode:  "disable",
	}

	expected := "host=localhost port=5432 user=postgres password=password dbname=tzblog sslmode=disable"
	actual := dbConfig.GetDSN()

	if actual != expected {
		t.Errorf("Expected DSN %s, got %s", expected, actual)
	}
}

func TestGetRedisAddr(t *testing.T) {
	redisConfig := RedisConfig{
		Host: "localhost",
		Port: 6379,
	}

	expected := "localhost:6379"
	actual := redisConfig.GetAddr()

	if actual != expected {
		t.Errorf("Expected Redis addr %s, got %s", expected, actual)
	}
}
