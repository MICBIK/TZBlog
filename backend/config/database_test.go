package config

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestDatabasePoolConfig_Validate_Success(t *testing.T) {
	cfg := DefaultDatabasePoolConfig()
	err := cfg.Validate()
	assert.NoError(t, err)
}

func TestDatabasePoolConfig_Validate_InvalidMaxOpenConns(t *testing.T) {
	cfg := DefaultDatabasePoolConfig()
	cfg.MaxOpenConns = 0
	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "max_open_conns must be positive")

	cfg.MaxOpenConns = -1
	err = cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "max_open_conns must be positive")
}

func TestDatabasePoolConfig_Validate_InvalidMaxIdleConns(t *testing.T) {
	cfg := DefaultDatabasePoolConfig()
	cfg.MaxIdleConns = 0
	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "max_idle_conns must be positive")
}

func TestDatabasePoolConfig_Validate_IdleExceedsMax(t *testing.T) {
	cfg := DefaultDatabasePoolConfig()
	cfg.MaxOpenConns = 10
	cfg.MaxIdleConns = 20
	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "max_idle_conns")
	assert.Contains(t, err.Error(), "cannot exceed max_open_conns")
}

func TestDatabasePoolConfig_Validate_InvalidConnMaxLifetime(t *testing.T) {
	cfg := DefaultDatabasePoolConfig()
	cfg.ConnMaxLifetime = 0
	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "conn_max_lifetime must be positive")

	cfg.ConnMaxLifetime = -time.Minute
	err = cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "conn_max_lifetime must be positive")
}

func TestDatabasePoolConfig_Validate_InvalidConnMaxIdleTime(t *testing.T) {
	cfg := DefaultDatabasePoolConfig()
	cfg.ConnMaxIdleTime = 0
	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "conn_max_idle_time must be positive")
}

func TestDatabasePoolConfig_Validate_IdleTimeExceedsLifetime(t *testing.T) {
	cfg := DefaultDatabasePoolConfig()
	cfg.ConnMaxLifetime = time.Minute * 5
	cfg.ConnMaxIdleTime = time.Minute * 10
	err := cfg.Validate()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "conn_max_idle_time")
	assert.Contains(t, err.Error(), "cannot exceed conn_max_lifetime")
}

func TestValidateDatabaseConfig_Success(t *testing.T) {
	cfg := &DatabaseConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "secret",
		DBName:   "testdb",
	}
	err := ValidateDatabaseConfig(cfg)
	assert.NoError(t, err)
}

func TestValidateDatabaseConfig_MissingHost(t *testing.T) {
	cfg := &DatabaseConfig{
		Host:   "",
		Port:   5432,
		User:   "postgres",
		DBName: "testdb",
	}
	err := ValidateDatabaseConfig(cfg)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "host is required")
}

func TestValidateDatabaseConfig_InvalidPort(t *testing.T) {
	cfg := &DatabaseConfig{
		Host:   "localhost",
		Port:   0,
		User:   "postgres",
		DBName: "testdb",
	}
	err := ValidateDatabaseConfig(cfg)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "port must be between")

	cfg.Port = 70000
	err = ValidateDatabaseConfig(cfg)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "port must be between")
}

func TestValidateDatabaseConfig_MissingUser(t *testing.T) {
	cfg := &DatabaseConfig{
		Host:   "localhost",
		Port:   5432,
		User:   "",
		DBName: "testdb",
	}
	err := ValidateDatabaseConfig(cfg)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "user is required")
}

func TestValidateDatabaseConfig_MissingDBName(t *testing.T) {
	cfg := &DatabaseConfig{
		Host: "localhost",
		Port: 5432,
		User: "postgres",
	}
	err := ValidateDatabaseConfig(cfg)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "database name is required")
}

func TestGetDSNSafe_PasswordRedacted(t *testing.T) {
	cfg := &DatabaseConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "supersecret123",
		DBName:   "testdb",
	}

	dsn := GetDSNSafe(cfg)

	// Password should be redacted
	assert.Contains(t, dsn, "***REDACTED***")
	assert.NotContains(t, dsn, "supersecret123")

	// Other fields should be present
	assert.Contains(t, dsn, cfg.Host)
	assert.Contains(t, dsn, cfg.User)
	assert.Contains(t, dsn, cfg.DBName)
}

func TestGetDSNForConnection_PasswordVisible(t *testing.T) {
	cfg := &DatabaseConfig{
		Host:     "localhost",
		Port:     5432,
		User:     "postgres",
		Password: "supersecret123",
		DBName:   "testdb",
	}

	dsn := GetDSNForConnection(cfg)

	// Actual password should be present for connection
	assert.Contains(t, dsn, "supersecret123")
	assert.NotContains(t, dsn, "***REDACTED***")
}

func TestOptimizedPoolConfig(t *testing.T) {
	cfg := OptimizedPoolConfig()

	assert.Equal(t, 50, cfg.MaxOpenConns)
	assert.Equal(t, 10, cfg.MaxIdleConns)
	assert.Equal(t, time.Hour, cfg.ConnMaxLifetime)
	assert.Equal(t, time.Minute*5, cfg.ConnMaxIdleTime)

	// Should pass validation
	err := cfg.Validate()
	assert.NoError(t, err)
}

func TestHighLoadPoolConfig(t *testing.T) {
	cfg := HighLoadPoolConfig()

	assert.Equal(t, 100, cfg.MaxOpenConns)
	assert.Equal(t, 25, cfg.MaxIdleConns)
	assert.Equal(t, time.Minute*30, cfg.ConnMaxLifetime)
	assert.Equal(t, time.Minute*3, cfg.ConnMaxIdleTime)

	// Should pass validation
	err := cfg.Validate()
	assert.NoError(t, err)
}

func TestLowLoadPoolConfig(t *testing.T) {
	cfg := LowLoadPoolConfig()

	assert.Equal(t, 10, cfg.MaxOpenConns)
	assert.Equal(t, 2, cfg.MaxIdleConns)
	assert.Equal(t, time.Hour*2, cfg.ConnMaxLifetime)
	assert.Equal(t, time.Minute*10, cfg.ConnMaxIdleTime)

	// Should pass validation
	err := cfg.Validate()
	assert.NoError(t, err)
}

func TestPoolConfig_PresetConfigurations(t *testing.T) {
	configs := []*DatabasePoolConfig{
		DefaultDatabasePoolConfig(),
		OptimizedPoolConfig(),
		HighLoadPoolConfig(),
		LowLoadPoolConfig(),
	}

	for i, cfg := range configs {
		t.Run(string(rune('A'+i)), func(t *testing.T) {
			// All preset configs should be valid
			err := cfg.Validate()
			assert.NoError(t, err)

			// MaxIdleConns should never exceed MaxOpenConns
			assert.LessOrEqual(t, cfg.MaxIdleConns, cfg.MaxOpenConns)

			// ConnMaxIdleTime should never exceed ConnMaxLifetime
			assert.LessOrEqual(t, cfg.ConnMaxIdleTime, cfg.ConnMaxLifetime)
		})
	}
}
