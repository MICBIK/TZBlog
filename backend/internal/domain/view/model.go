package view

type ArticleView struct {
	ID        int64  `json:"id" gorm:"primaryKey"`
	ArticleID int64  `json:"article_id" gorm:"not null;index"`
	UserID    *int64 `json:"user_id" gorm:"index"`
	IPAddress string `json:"ip_address" gorm:"size:45"`
	UserAgent string `json:"user_agent"`
	CreatedAt int64  `json:"created_at" gorm:"autoCreateTime;index"`
}

func (ArticleView) TableName() string {
	return "article_views"
}

type ViewRepository interface {
	RecordView(view *ArticleView) error
	CanRecordView(articleID int64, ipHash string) (bool, error)
	GetHotArticles(limit int) ([]HotArticle, error)
}

type HotArticle struct {
	ArticleID  int64  `json:"article_id"`
	Title      string `json:"title"`
	ViewCount  int    `json:"view_count"`
}
