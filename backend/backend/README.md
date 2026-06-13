# TZBlog Backend

> Go + Gin + GORM + PostgreSQL + Redis

## Tech Stack

- Go 1.22+
- Gin Web Framework
- GORM
- PostgreSQL 15+
- Redis 7+
- JWT Authentication

## Quick Start

### Prerequisites

- Go 1.22+
- PostgreSQL 15+
- Redis 7+

### Install Dependencies

```bash
make deps
```

### Configuration

```bash
cp .env.example .env
# Edit .env file
```

### Run Migrations

```bash
make migrate-up
```

### Start Server

```bash
make run
```

Server runs at http://localhost:8080

### Health Check

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

## Commands

```bash
make run              # Run server
make build            # Build binary
make test             # Run tests
make lint             # Run linter
make migrate-up       # Run migrations
make migrate-down     # Rollback
make clean            # Clean artifacts
```

## Project Structure

```
backend/
├── cmd/server/       # Entry point
├── internal/         # Private code
│   ├── api/         # API layer
│   ├── domain/      # Domain models
│   ├── repository/  # Data access
│   └── service/     # Business logic
├── pkg/             # Public packages
├── config/          # Configuration
├── migrations/      # DB migrations
└── tests/           # Tests
```

## API Documentation

See: `docs/superpowers/specs/api-design.md`

## License

MIT
