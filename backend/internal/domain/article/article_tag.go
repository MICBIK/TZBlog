package article

// ArticleTag represents the many-to-many relationship between articles and tags
type ArticleTag struct {
	ArticleID int64 `gorm:"primaryKey"`
	TagID     int64 `gorm:"primaryKey"`
}

// TableName returns the table name
func (ArticleTag) TableName() string {
	return "article_tags"
}
