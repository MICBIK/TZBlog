# Round 3 — 性能

**评分**: 74/100（昨天 72） · **基线**: `main @ 9853c2a`

## 历史问题核实
| ID | 问题 | 状态 | 证据 |
|----|------|------|------|
| M-5 | 连接池未配置 | ✅ FIXED | `config/database.go:207-210` 显式 SetMaxOpenConns/MaxIdleConns/ConnMaxLifetime/ConnMaxIdleTime + `Validate():36-64` 校验 |
| B4 | 列表返回全文 | ✅ FIXED | `article_repo.go:67` `.Omit("content")`（主流程已验证 List 全程基于该 query） |
| N+1 | List 等读路径 N+1 | ⚪ FALSE_POSITIVE | List 无 Preload；follow/like 用 JOIN/Count；handler 无逐条循环 |
| H-1 | status/created_at 索引 | ⚠️ PARTIAL | `000006_*.up.sql:21-30` 语法正确且**已合并入 main(4265ab9)**；但 `idx_articles_status` 与既有复合索引 `idx_articles_status_created`(000002) 及 covering 索引(000003) 冗余，仅 `created_at` 单列是真正新增；`article.go:30,37` GORM index tag 因全仓无 AutoMigrate 而无效 |
| M-6 | Redis 缓存未接入读路径 | 🟥 STILL_OPEN | `internal/cache/*` 仅被 `examples/` 引用且 warmup 全注释；`CacheMiddleware` 全仓零注册；`ArticleService:21` 无 cache 字段，读路径直打 DB。**缓存层是死代码** |

## 新发现
- **MEDIUM** category/tag 列表无分页上限 — `category_handler.go:42-51`/`tag_handler.go:42-51` 不经 service 封顶（article/comment 在 service 层有 limit>100→100），可 `?limit=1000000`。
- **LOW** Sitemap 硬编码 `Limit:1000` — `sitemap_handler.go:33` 丢弃 total，>1000 篇静默截断，影响 SEO 收录。
- **LOW** `CategoryRepository.FindAll()` 无界查询 — `category_repo.go:50-53`，当前为死代码但属可被误用的模式。
- **LOW** `article.go:30,37` GORM index tag 无效/死标记 — schema 由 SQL migration 管理，tag 不创建任何索引且语法易误读。

## 小结
连接池修复扎实、List Omit content、N+1 确认不成立。H-1 索引方案已入 main 但**冗余 + GORM tag 无效**；M-6 缓存承诺未兑现仍是死代码。新问题集中在**无界查询/分页上限缺失**。注：`article_repo.go:81` 搜索仍 `content LIKE` 会扫全文列（List 虽 Omit 但 WHERE 仍命中），数据量大时需关注。
