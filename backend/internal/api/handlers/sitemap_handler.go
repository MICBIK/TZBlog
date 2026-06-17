package handlers

import (
	"encoding/xml"

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
// @Router       /api/v1/sitemap.xml [get]
func (h *SitemapHandler) GenerateSitemap(c *gin.Context) {
	// 分页拉取全部已发布文章：避免硬编码 Limit 在文章数超过上限时静默截断 sitemap
	const pageSize = 500
	const maxPages = 1000 // 防御性上限（最多 50 万篇），避免异常情况下死循环

	var articles []*article.Article
	for page := 1; page <= maxPages; page++ {
		filter := &article.ListFilter{
			Status: "published",
			Page:   page,
			Limit:  pageSize,
		}

		batch, total, err := h.articleRepo.List(filter)
		if err != nil {
			c.String(500, "Failed to generate sitemap")
			return
		}

		articles = append(articles, batch...)

		// 本页为空或已拉满全部则停止
		if len(batch) == 0 || int64(len(articles)) >= total {
			break
		}
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
