package handlers

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
	"github.com/MICBIK/TZBlog/backend/internal/seo/sitemap"
	"github.com/gin-gonic/gin"
)

type SitemapHandler struct {
	articleRepo ArticleRepository
	generator   *sitemap.Generator
}

func NewSitemapHandler(articleRepo ArticleRepository, baseURL string) *SitemapHandler {
	return &SitemapHandler{
		articleRepo: articleRepo,
		generator:   sitemap.NewGenerator(baseURL),
	}
}

// GenerateSitemap generates and returns sitemap.xml
// @Summary Generate sitemap.xml
// @Tags SEO
// @Produce xml
// @Success 200 {string} string "XML content"
// @Router /sitemap.xml [get]
func (h *SitemapHandler) GenerateSitemap(c *gin.Context) {
	// Fetch all published articles
	filter := &article.ListFilter{
		Status: "published",
		Limit:  1000, // Get all articles
	}

	articles, _, err := h.articleRepo.List(filter)
	if err != nil {
		c.String(500, "Failed to generate sitemap")
		return
	}

	// Generate sitemap XML
	xmlData, err := h.generator.Generate(articles)
	if err != nil {
		c.String(500, "Failed to generate sitemap")
		return
	}

	c.Header("Content-Type", "application/xml")
	c.String(200, xml.Header+string(xmlData))
}
