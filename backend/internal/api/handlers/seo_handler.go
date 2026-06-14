package handlers

import (
	"github.com/MICBIK/TZBlog/backend/internal/seo"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type SEOHandler struct {
	articleRepo ArticleRepository
	baseURL     string
}

func NewSEOHandler(articleRepo ArticleRepository, baseURL string) *SEOHandler {
	return &SEOHandler{
		articleRepo: articleRepo,
		baseURL:     baseURL,
	}
}

// GetArticleSEO returns SEO metadata for a specific article
// @Summary Get article SEO metadata
// @Tags SEO
// @Param slug path string true "Article slug"
// @Success 200 {object} seo.SEOData
// @Router /seo/articles/{slug} [get]
func (h *SEOHandler) GetArticleSEO(c *gin.Context) {
	slug := c.Param("slug")

	article, err := h.articleRepo.FindBySlug(slug)
	if err != nil {
		response.InternalError(c, "Failed to fetch article")
		return
	}

	if article == nil {
		response.NotFound(c, "Article not found")
		return
	}

	seoData := seo.GenerateArticleSEO(article, h.baseURL)
	response.Success(c, seoData)
}

// GetHomeSEO returns SEO metadata for home page
// @Summary Get home page SEO metadata
// @Tags SEO
// @Success 200 {object} seo.SEOData
// @Router /seo/home [get]
func (h *SEOHandler) GetHomeSEO(c *gin.Context) {
	seoData := seo.GenerateHomeSEO(h.baseURL)
	response.Success(c, seoData)
}
