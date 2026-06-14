package postgres

import (
	"testing"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/category"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupCategoryTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.Exec(`
		CREATE TABLE categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR(100) NOT NULL UNIQUE,
			slug VARCHAR(100) NOT NULL UNIQUE,
			description TEXT,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			deleted_at DATETIME
		)
	`).Error
	require.NoError(t, err)

	return db
}

func newTestCategory(name, slug string) *category.Category {
	now := time.Now()
	return &category.Category{
		Name:        name,
		Slug:        slug,
		Description: "Description for " + name,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

func TestCategoryRepository_Create(t *testing.T) {
	tests := []struct {
		name      string
		setup     func(repo category.CategoryRepository)
		input     *category.Category
		expectErr bool
	}{
		{
			name:      "successful create",
			setup:     func(repo category.CategoryRepository) {},
			input:     newTestCategory("Technology", "tech"),
			expectErr: false,
		},
		{
			name: "duplicate slug fails",
			setup: func(repo category.CategoryRepository) {
				_ = repo.Create(newTestCategory("Lifestyle", "dup"))
			},
			input:     newTestCategory("Travel", "dup"),
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db := setupCategoryTestDB(t)
			repo := NewCategoryRepository(db)
			tt.setup(repo)

			err := repo.Create(tt.input)

			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotZero(t, tt.input.ID)
			}
		})
	}
}

func TestCategoryRepository_FindByID(t *testing.T) {
	db := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)

	cat := newTestCategory("Technology", "tech")
	require.NoError(t, repo.Create(cat))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindByID(cat.ID)
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, "Technology", found.Name)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindByID(99999)
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestCategoryRepository_FindBySlug(t *testing.T) {
	db := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)

	cat := newTestCategory("Technology", "tech")
	require.NoError(t, repo.Create(cat))

	t.Run("found", func(t *testing.T) {
		found, err := repo.FindBySlug("tech")
		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, cat.ID, found.ID)
	})

	t.Run("not found returns nil, nil", func(t *testing.T) {
		found, err := repo.FindBySlug("nonexistent")
		assert.NoError(t, err)
		assert.Nil(t, found)
	})
}

func TestCategoryRepository_FindAll(t *testing.T) {
	db := setupCategoryTestDB(t)
	// FindAll is not part of the interface; use the concrete type
	repo := &CategoryRepository{db: db}

	for _, name := range []string{"Tech", "Life", "Travel"} {
		require.NoError(t, repo.Create(newTestCategory(name, name)))
	}

	categories, err := repo.FindAll()
	require.NoError(t, err)
	assert.Len(t, categories, 3)
}

func TestCategoryRepository_List(t *testing.T) {
	db := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)

	for _, name := range []string{"Tech", "Life", "Travel", "Food"} {
		require.NoError(t, repo.Create(newTestCategory(name, name)))
	}

	t.Run("list all", func(t *testing.T) {
		categories, total, err := repo.List(10, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(4), total)
		assert.Len(t, categories, 4)
	})

	t.Run("list with limit", func(t *testing.T) {
		categories, total, err := repo.List(2, 0)
		require.NoError(t, err)
		assert.Equal(t, int64(4), total)
		assert.Len(t, categories, 2)
	})
}

func TestCategoryRepository_Update(t *testing.T) {
	db := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)

	cat := newTestCategory("Technology", "tech")
	require.NoError(t, repo.Create(cat))

	cat.Name = "Updated Tech"
	err := repo.Update(cat)
	require.NoError(t, err)

	found, err := repo.FindByID(cat.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Tech", found.Name)
}

func TestCategoryRepository_Delete(t *testing.T) {
	db := setupCategoryTestDB(t)
	repo := NewCategoryRepository(db)

	cat := newTestCategory("Technology", "tech")
	require.NoError(t, repo.Create(cat))

	err := repo.Delete(cat.ID)
	require.NoError(t, err)

	found, err := repo.FindByID(cat.ID)
	assert.NoError(t, err)
	assert.Nil(t, found)
}
