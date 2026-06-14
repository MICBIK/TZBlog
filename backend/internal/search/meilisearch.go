package search

import (
	"fmt"

	"github.com/meilisearch/meilisearch-go"
)

// Client represents a Meilisearch client
type Client struct {
	client meilisearch.ServiceManager
	index  string
}

// Config represents Meilisearch configuration
type Config struct {
	Host   string
	APIKey string
	Index  string
}

// ArticleDocument represents an article document for search
type ArticleDocument struct {
	ID          string   `json:"id"`
	Slug        string   `json:"slug"`
	Title       string   `json:"title"`
	Summary     string   `json:"summary"`
	Content     string   `json:"content"`
	Author      string   `json:"author"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	PublishedAt int64    `json:"publishedAt"`
	ViewCount   int64    `json:"viewCount"`
}

// SearchResult represents a search result
type SearchResult struct {
	Hits           []ArticleDocument `json:"hits"`
	EstimatedTotal int64             `json:"estimatedTotalHits"`
	Query          string            `json:"query"`
	Limit          int64             `json:"limit"`
	Offset         int64             `json:"offset"`
	ProcessingTime int64             `json:"processingTimeMs"`
}

// NewClient creates a new Meilisearch client
func NewClient(config *Config) *Client {
	client := meilisearch.New(config.Host, meilisearch.WithAPIKey(config.APIKey))

	return &Client{
		client: client,
		index:  config.Index,
	}
}

// InitializeIndex initializes the search index
func (c *Client) InitializeIndex() error {
	// Get or create index
	index := c.client.Index(c.index)

	// Configure searchable attributes
	searchableAttrs := []string{"title", "summary", "content", "author", "tags"}
	_, err := index.UpdateSearchableAttributes(&searchableAttrs)
	if err != nil {
		return fmt.Errorf("failed to update searchable attributes: %w", err)
	}

	// Configure filterable attributes
	filterableAttrs := []interface{}{"category", "tags", "author", "publishedAt"}
	_, err = index.UpdateFilterableAttributes(&filterableAttrs)
	if err != nil {
		return fmt.Errorf("failed to update filterable attributes: %w", err)
	}

	// Configure sortable attributes
	sortableAttrs := []string{"publishedAt", "viewCount"}
	_, err = index.UpdateSortableAttributes(&sortableAttrs)
	if err != nil {
		return fmt.Errorf("failed to update sortable attributes: %w", err)
	}

	// Configure ranking rules
	rankingRules := []string{"words", "typo", "proximity", "attribute", "sort", "exactness", "viewCount:desc"}
	_, err = index.UpdateRankingRules(&rankingRules)
	if err != nil {
		return fmt.Errorf("failed to update ranking rules: %w", err)
	}

	return nil
}

// IndexArticle adds or updates an article in the search index
func (c *Client) IndexArticle(doc *ArticleDocument) error {
	index := c.client.Index(c.index)
	primaryKey := "id"
	_, err := index.AddDocuments([]ArticleDocument{*doc}, &meilisearch.DocumentOptions{PrimaryKey: &primaryKey})
	if err != nil {
		return fmt.Errorf("failed to index article: %w", err)
	}
	return nil
}

// IndexArticles adds or updates multiple articles in the search index
func (c *Client) IndexArticles(docs []ArticleDocument) error {
	index := c.client.Index(c.index)
	primaryKey := "id"
	_, err := index.AddDocuments(docs, &meilisearch.DocumentOptions{PrimaryKey: &primaryKey})
	if err != nil {
		return fmt.Errorf("failed to index articles: %w", err)
	}
	return nil
}

// DeleteArticle removes an article from the search index
func (c *Client) DeleteArticle(id string) error {
	index := c.client.Index(c.index)
	_, err := index.DeleteDocument(id, nil)
	if err != nil {
		return fmt.Errorf("failed to delete article: %w", err)
	}
	return nil
}

// Search searches for articles
func (c *Client) Search(query string, options *SearchOptions) (*SearchResult, error) {
	index := c.client.Index(c.index)

	request := &meilisearch.SearchRequest{
		Limit:  options.Limit,
		Offset: options.Offset,
	}

	// Add filters
	if len(options.Filters) > 0 {
		filters := buildFilters(options.Filters)
		request.Filter = filters
	}

	// Add sort
	if len(options.Sort) > 0 {
		request.Sort = options.Sort
	}

	// Add attributes to retrieve
	if len(options.AttributesToRetrieve) > 0 {
		request.AttributesToRetrieve = options.AttributesToRetrieve
	}

	resp, err := index.Search(query, request)
	if err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	// Convert response
	hits := make([]ArticleDocument, 0, len(resp.Hits))
	for _, hit := range resp.Hits {
		var doc ArticleDocument
		if err := hit.Decode(&doc); err == nil {
			hits = append(hits, doc)
		}
	}

	result := &SearchResult{
		Hits:           hits,
		EstimatedTotal: resp.EstimatedTotalHits,
		Query:          query,
		Limit:          resp.Limit,
		Offset:         resp.Offset,
		ProcessingTime: resp.ProcessingTimeMs,
	}

	return result, nil
}

// SearchOptions represents search options
type SearchOptions struct {
	Limit                 int64
	Offset                int64
	Filters               map[string]interface{}
	Sort                  []string
	AttributesToRetrieve  []string
}

// buildFilters builds Meilisearch filter string
func buildFilters(filters map[string]interface{}) interface{} {
	filterStrings := make([]string, 0)

	for key, value := range filters {
		switch v := value.(type) {
		case string:
			filterStrings = append(filterStrings, fmt.Sprintf("%s = %s", key, v))
		case []string:
			filterStrings = append(filterStrings, fmt.Sprintf("%s IN %v", key, v))
		case int64:
			filterStrings = append(filterStrings, fmt.Sprintf("%s = %d", key, v))
		}
	}

	if len(filterStrings) == 1 {
		return filterStrings[0]
	}

	return filterStrings
}

// GetStats returns index statistics
func (c *Client) GetStats() (map[string]interface{}, error) {
	index := c.client.Index(c.index)
	stats, err := index.GetStats(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	return map[string]interface{}{
		"numberOfDocuments": stats.NumberOfDocuments,
		"isIndexing":        stats.IsIndexing,
		"fieldDistribution": stats.FieldDistribution,
	}, nil
}
