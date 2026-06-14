package sitemap

import (
	"encoding/xml"
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/article"
)

// URLSet represents the root element of a sitemap
type URLSet struct {
	XMLName xml.Name `xml:"urlset"`
	Xmlns   string   `xml:"xmlns,attr"`
	URLs    []URL    `xml:"url"`
}

// URL represents a single URL entry in a sitemap
type URL struct {
	Loc        string  `xml:"loc"`
	LastMod    string  `xml:"lastmod,omitempty"`
	ChangeFreq string  `xml:"changefreq,omitempty"`
	Priority   float64 `xml:"priority,omitempty"`
}

// Generator handles sitemap generation
type Generator struct {
	baseURL string
}

// NewGenerator creates a new sitemap generator
func NewGenerator(baseURL string) *Generator {
	return &Generator{
		baseURL: baseURL,
	}
}

// Generate creates a sitemap XML from articles
func (g *Generator) Generate(articles []*article.Article) ([]byte, error) {
	urlset := URLSet{
		Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
		URLs:  make([]URL, 0),
	}

	// Add home page
	urlset.URLs = append(urlset.URLs, URL{
		Loc:        g.baseURL,
		LastMod:    time.Now().Format("2006-01-02"),
		ChangeFreq: "daily",
		Priority:   1.0,
	})

	// Add articles page
	urlset.URLs = append(urlset.URLs, URL{
		Loc:        g.baseURL + "/articles",
		LastMod:    time.Now().Format("2006-01-02"),
		ChangeFreq: "daily",
		Priority:   0.9,
	})

	// Add individual articles
	for _, a := range articles {
		if a.Status != "published" {
			continue
		}

		urlset.URLs = append(urlset.URLs, URL{
			Loc:        g.baseURL + "/articles/" + a.Slug,
			LastMod:    a.UpdatedAt.Format("2006-01-02"),
			ChangeFreq: "weekly",
			Priority:   0.8,
		})
	}

	// Add archive page
	urlset.URLs = append(urlset.URLs, URL{
		Loc:        g.baseURL + "/archive",
		ChangeFreq: "weekly",
		Priority:   0.7,
	})

	// Add about page
	urlset.URLs = append(urlset.URLs, URL{
		Loc:        g.baseURL + "/about",
		ChangeFreq: "monthly",
		Priority:   0.6,
	})

	return xml.MarshalIndent(urlset, "", "  ")
}
