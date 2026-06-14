package search

import (
	"fmt"

	"github.com/meilisearch/meilisearch-go"
)

// Client represents a Meilisearch client
type Client struct {
	client *meilisearch.Client
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
	client := meilisearch.NewClient(meilisearch.ClientConfig{
		Host:   config.Host,
		APIKey: config.APIKey,
	})

	return &Client{
		client: client,
		index:  config.Index,
	}
}

// InitializeIndex initializes the search index
func (c *Client) InitializeIndex() error {
	// Create index if not exists
	_, err := c.client.CreateIndex(&meilisearch.IndexConfig{
		Uid:        c.index,
		PrimaryKey: "id",
	})
	if err != nil {
		// Index might already exist, continue
	}

	// Configure searchable attributes
	index := c.client.Index(c.index)
	_, err = index.UpdateSearchableAttributes(&[]string{
		"title",
		"summary",
		"content",
		"author",
		"tags",
	})
	if err != nil {
		return fmt.Errorf("failed to update searchable attributes: %w", err)
	}

	// Configure filterable attributes
	_, err = index.UpdateFilterableAttributes(&[]string{
		"category",
		"tags",
		"author",
		"publishedAt",
	})
	if err != nil {
		return fmt.Errorf("failed to update filterable attributes: %w", err)
	}

	// Configure sortable attributes
	_, err = index.UpdateSortableAttributes(&[]string{
		"publishedAt",
		"viewCount",
	})
	if err != nil {
		return fmt.Errorf("failed to update sortable attributes: %w", err)
	}

	// Configure ranking rules
	_, err = index.UpdateRankingRules(&[]string{
		"words",
		"typo",
		"proximity",
		"attribute",
		"sort",
		"exactness",
		"viewCount:desc",
	})
	if err != nil {
		return fmt.Errorf("failed to update ranking rules: %w", err)
	}

	return nil
}

// IndexArticle adds or updates an article in the search index
func (c *Client) IndexArticle(doc *ArticleDocument) error {
	index := c.client.Index(c.index)
	_, err := index.AddDocuments([]ArticleDocument{*doc}, "id")
	if err != nil {
		return fmt.Errorf("failed to index article: %w", err)
	}
	return nil
}

// IndexArticles adds or updates multiple articles in the search index
func (c *Client) IndexArticles(docs []ArticleDocument) error {
	index := c.client.Index(c.index)
	_, err := index.AddDocuments(docs, "id")
	if err != nil {
		return fmt.Errorf("failed to index articles: %w", err)
	}
	return nil
}

// DeleteArticle removes an article from the search index
func (c *Client) DeleteArticle(id string) error {
	index := c.client.Index(c.index)
	_, err := index.DeleteDocument(id)
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
		if doc, ok := hit.(map[string]interface{}); ok {
			hits = append(hits, convertToArticleDocument(doc))
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

// convertToArticleDocument converts map to ArticleDocument
func convertToArticleDocument(doc map[string]interface{}) ArticleDocument {
	result := ArticleDocument{}

	if id, ok := doc["id"].(string); ok {
		result.ID = id
	}
	if slug, ok := doc["slug"].(string); ok {
		result.Slug = slug
	}
	if title, ok := doc["title"].(string); ok {
		result.Title = title
	}
	if summary, ok := doc["summary"].(string); ok {
		result.Summary = summary
	}
	if content, ok := doc["content"].(string); ok {
		result.Content = content
	}
	if author, ok := doc["author"].(string); ok {
		result.Author = author
	}
	if category, ok := doc["category"].(string); ok {
		result.Category = category
	}
	if tags, ok := doc["tags"].([]interface{}); ok {
		result.Tags = make([]string, len(tags))
		for i, tag := range tags {
			if tagStr, ok := tag.(string); ok {
				result.Tags[i] = tagStr
			}
		}
	}
	if publishedAt, ok := doc["publishedAt"].(float64); ok {
		result.PublishedAt = int64(publishedAt)
	}
	if viewCount, ok := doc["viewCount"].(float64); ok {
		result.ViewCount = int64(viewCount)
	}

	return result
}

// GetStats returns index statistics
func (c *Client) GetStats() (map[string]interface{}, error) {
	index := c.client.Index(c.index)
	stats, err := index.GetStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	return map[string]interface{}{
		"numberOfDocuments": stats.NumberOfDocuments,
		"isIndexing":        stats.IsIndexing,
		"fieldDistribution": stats.FieldDistribution,
	}, nil
}
