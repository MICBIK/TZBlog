package handlers

import (
	"strconv"

	"github.com/MICBIK/TZBlog/backend/internal/search"
	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	searchClient *search.Client
}

func NewSearchHandler(searchClient *search.Client) *SearchHandler {
	return &SearchHandler{
		searchClient: searchClient,
	}
}

// Search performs full-text search on articles
// @Summary Search articles
// @Tags Search
// @Param q query string true "Search query"
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Param category query string false "Category filter"
// @Param tag query string false "Tag filter"
// @Param sort query string false "Sort by" Enums(publishedAt:desc, publishedAt:asc, viewCount:desc)
// @Success 200 {object} search.SearchResult
// @Router       /api/v1/search [get]
func (h *SearchHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.BadRequest(c, "Search query is required")
		return
	}

	// Parse pagination
	limit, _ := strconv.ParseInt(c.DefaultQuery("limit", "20"), 10, 64)
	offset, _ := strconv.ParseInt(c.DefaultQuery("offset", "0"), 10, 64)

	// Build search options
	options := &search.SearchOptions{
		Limit:  limit,
		Offset: offset,
		Filters: make(map[string]interface{}),
	}

	// Add filters
	if category := c.Query("category"); category != "" {
		options.Filters["category"] = category
	}
	if tag := c.Query("tag"); tag != "" {
		options.Filters["tags"] = tag
	}

	// Add sort
	if sort := c.Query("sort"); sort != "" {
		options.Sort = []string{sort}
	}

	// Perform search
	result, err := h.searchClient.Search(query, options)
	if err != nil {
		response.InternalError(c, "Search failed")
		return
	}

	response.Success(c, result)
}

// GetSearchStats returns search index statistics
// @Summary Get search statistics
// @Tags Search
// @Success 200 {object} map[string]interface{}
// @Router       /api/v1/search/stats [get]
func (h *SearchHandler) GetSearchStats(c *gin.Context) {
	stats, err := h.searchClient.GetStats()
	if err != nil {
		response.InternalError(c, "Failed to get search stats")
		return
	}

	response.Success(c, stats)
}
