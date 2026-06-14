.PHONY: run build test lint clean migrate-up migrate-down migrate-create deps help

# Variables
DB_USER ?= postgres
DB_PASS ?= password
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_NAME ?= tzblog

# Run server
run:
	@echo "Starting server..."
	@go run cmd/server/main.go

# Build binary
build:
	@echo "Building..."
	@go build -o bin/server cmd/server/main.go

# Run tests
test:
	@echo "Running tests..."
	@go test -v -race -coverprofile=coverage.out ./...

# Test coverage
test-coverage: test
	@go tool cover -html=coverage.out

# Lint
lint:
	@echo "Running lint..."
	@golangci-lint run ./...

# Clean
clean:
	@echo "Cleaning..."
	@rm -rf bin/ coverage.out

# Database migrations
migrate-up:
	@echo "Running migrations up..."
	@migrate -database "postgresql://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable" -path migrations up

migrate-down:
	@echo "Running migrations down..."
	@migrate -database "postgresql://$(DB_USER):$(DB_PASS)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=disable" -path migrations down 1

migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir migrations -seq $$name

# Install dependencies
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

# Development mode
dev:
	@air

# Docker
docker-build:
	@docker build -t tzblog-backend .

docker-run:
	@docker run -p 8080:8080 --env-file .env tzblog-backend

# Help
help:
	@echo "Available commands:"
	@echo "  make run             - Run the server"
	@echo "  make build           - Build the binary"
	@echo "  make test            - Run tests"
	@echo "  make test-coverage   - Coverage report"
	@echo "  make lint            - Run linter"
	@echo "  make clean           - Clean artifacts"
	@echo "  make migrate-up      - Run migrations"
	@echo "  make migrate-down    - Rollback migration"
	@echo "  make migrate-create  - Create migration"
	@echo "  make deps            - Install dependencies"
