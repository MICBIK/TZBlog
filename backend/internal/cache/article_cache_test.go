package cache

import (
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestRedisForCache(t *testing.T) (*redis.Client, *miniredis.Miniredis) {
	s, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})

	return client, s
}

func TestArticleCache_SetAndGet(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, time.Hour)

	// Test data
	article := map[string]interface{}{
		"id":    1,
		"title": "Test Article",
		"slug":  "test-article",
	}

	// Set article
	err := cache.SetArticle("test-article", article)
	assert.NoError(t, err)

	// Get article
	var result map[string]interface{}
	err = cache.GetArticleBySlug("test-article", &result)
	assert.NoError(t, err)
	assert.Equal(t, "Test Article", result["title"])
}

func TestArticleCache_Delete(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, time.Hour)

	// Set article
	article := map[string]interface{}{"id": 1, "title": "Test"}
	err := cache.SetArticle("test-article", article)
	assert.NoError(t, err)

	// Delete article
	err = cache.DeleteArticle("test-article")
	assert.NoError(t, err)

	// Verify deleted
	var result map[string]interface{}
	err = cache.GetArticleBySlug("test-article", &result)
	assert.Error(t, err) // Should return error (redis.Nil or cache miss)
}

func TestArticleCache_GetNonExistent(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, time.Hour)

	var result map[string]interface{}
	err := cache.GetArticleBySlug("non-existent", &result)
	assert.Error(t, err)
}

func TestArticleCache_TTL(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, 100*time.Millisecond)

	// Set article with short TTL
	article := map[string]interface{}{"id": 1, "title": "Test"}
	err := cache.SetArticle("test-article", article)
	assert.NoError(t, err)

	// Fast-forward time in miniredis
	s.FastForward(200 * time.Millisecond)

	// Should be expired
	var result map[string]interface{}
	err = cache.GetArticleBySlug("test-article", &result)
	assert.Error(t, err)
}

func TestArticleCache_InvalidateArticleCache(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, time.Hour)

	// Set article
	article := map[string]interface{}{"id": 1, "title": "Test"}
	err := cache.SetArticle("test-article", article)
	assert.NoError(t, err)

	// Invalidate
	err = cache.InvalidateArticleCache("test-article")
	assert.NoError(t, err)

	// Should be gone
	var result map[string]interface{}
	err = cache.GetArticleBySlug("test-article", &result)
	assert.Error(t, err)
}

func TestArticleCache_ViewCount(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, time.Hour)

	// Initial count should be 0
	count, err := cache.GetViewCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)

	// Increment
	count, err = cache.IncrementViewCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)

	// Increment again
	count, err = cache.IncrementViewCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)

	// Get count
	count, err = cache.GetViewCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)
}

func TestArticleCache_LikeCount(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, time.Hour)

	// Initial count should be 0
	count, err := cache.GetLikeCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)

	// Increment
	err = cache.IncrementLikeCount(1)
	assert.NoError(t, err)

	count, err = cache.GetLikeCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)

	// Increment again
	err = cache.IncrementLikeCount(1)
	assert.NoError(t, err)

	count, err = cache.GetLikeCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)

	// Decrement
	err = cache.DecrementLikeCount(1)
	assert.NoError(t, err)

	count, err = cache.GetLikeCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
}

func TestArticleCache_RedisConnectionFailure(t *testing.T) {
	// Create client with invalid address
	client := redis.NewClient(&redis.Options{
		Addr: "localhost:9999",
	})
	defer client.Close()

	cache := NewArticleCache(client, 100*time.Millisecond, time.Hour)

	// All operations should fail gracefully
	article := map[string]interface{}{"id": 1, "title": "Test"}
	err := cache.SetArticle("test", article)
	assert.Error(t, err)

	var result map[string]interface{}
	err = cache.GetArticleBySlug("test", &result)
	assert.Error(t, err)

	err = cache.DeleteArticle("test")
	assert.Error(t, err)

	_, err = cache.GetViewCount(1)
	assert.Error(t, err)

	_, err = cache.IncrementViewCount(1)
	assert.Error(t, err)
}

func TestArticleCache_ConcurrentAccess(t *testing.T) {
	client, s := setupTestRedisForCache(t)
	defer s.Close()
	defer client.Close()

	cache := NewArticleCache(client, time.Second, time.Hour)

	// Concurrent increments
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func() {
			_, _ = cache.IncrementViewCount(1)
			done <- true
		}()
	}

	for i := 0; i < 10; i++ {
		<-done
	}

	// Should have 10 increments
	count, err := cache.GetViewCount(1)
	assert.NoError(t, err)
	assert.Equal(t, int64(10), count)
}
