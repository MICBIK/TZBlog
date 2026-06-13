# 缓存策略设计

## Redis缓存方案

### 1. 文章缓存
**Key设计**：
```
article:slug:{slug}           # 文章详情 (TTL: 1小时)
article:id:{id}               # 文章详情(ID) (TTL: 1小时)
articles:list:page:{page}     # 文章列表 (TTL: 5分钟)
articles:hot                  # 热门文章 (TTL: 30分钟)
articles:featured             # 精选文章 (TTL: 1小时)
```

**实现示例**：
```go
func (s *ArticleService) GetBySlug(ctx context.Context, slug string) (*Article, error) {
    // 1. 尝试从缓存获取
    cacheKey := fmt.Sprintf("article:slug:%s", slug)
    cached, err := s.cache.Get(ctx, cacheKey)
    if err == nil {
        var article Article
        json.Unmarshal([]byte(cached), &article)
        return &article, nil
    }
    
    // 2. 从数据库查询
    article, err := s.repo.FindBySlug(ctx, slug)
    if err != nil {
        return nil, err
    }
    
    // 3. 写入缓存
    data, _ := json.Marshal(article)
    s.cache.Set(ctx, cacheKey, data, time.Hour)
    
    return article, nil
}
```

### 2. 用户会话缓存
```
session:{token}               # 用户会话 (TTL: 7天)
user:{id}                     # 用户信息 (TTL: 1小时)
```

### 3. 统计数据缓存
```
stats:article:{id}:views      # 文章浏览数 (使用INCR)
stats:article:{id}:likes      # 文章点赞数
stats:daily:views             # 每日PV统计
```

### 4. 缓存更新策略
- **文章发布/更新**：删除相关缓存键
- **点赞/浏览**：异步更新，先写Redis，定时同步到DB
- **列表缓存**：标签变更时清除
