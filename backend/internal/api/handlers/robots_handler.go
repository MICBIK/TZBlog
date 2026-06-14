package handlers

import (
	"github.com/gin-gonic/gin"
)

type RobotsHandler struct{}

func NewRobotsHandler() *RobotsHandler {
	return &RobotsHandler{}
}

// ServeRobots serves robots.txt file
// @Summary Serve robots.txt
// @Tags SEO
// @Produce plain
// @Success 200 {string} string "Robots.txt content"
// @Router /robots.txt [get]
func (h *RobotsHandler) ServeRobots(c *gin.Context) {
	content := `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://tzblog.com/sitemap.xml

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Disallow search pages with parameters
Disallow: /*?*

# Crawl-delay
Crawl-delay: 1
`

	c.Header("Content-Type", "text/plain")
	c.String(200, content)
}
