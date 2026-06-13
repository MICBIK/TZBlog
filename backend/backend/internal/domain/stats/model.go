package stats

type OverviewStats struct {
	TotalArticles int64 `json:"total_articles"`
	TotalUsers    int64 `json:"total_users"`
	TotalViews    int64 `json:"total_views"`
	TotalComments int64 `json:"total_comments"`
	TodayViews    int64 `json:"today_views"`
	TodayComments int64 `json:"today_comments"`
}

type ArticleStats struct {
	Published int64 `json:"published"`
	Draft     int64 `json:"draft"`
	Featured  int64 `json:"featured"`
	Premium   int64 `json:"premium"`
}

type TrafficStats struct {
	UniqueVisitors int64              `json:"unique_visitors"`
	PageViews      int64              `json:"page_views"`
	DailyViews     []DailyViewStats   `json:"daily_views"`
}

type DailyViewStats struct {
	Date  string `json:"date"`
	Views int64  `json:"views"`
}

type StatsRepository interface {
	GetOverviewStats() (*OverviewStats, error)
	GetArticleStats() (*ArticleStats, error)
	GetTrafficStats() (*TrafficStats, error)
}
