# 数据库完整设计

## 数据库选择
- **PostgreSQL 15+**
- **字符集**: UTF8
- **时区**: UTC（应用层转换为本地时间）

---

## 核心表结构

### 1. users (用户表)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user', -- admin, author, user
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- 软删除
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

### 2. categories (分类表)
```sql
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    icon VARCHAR(50), -- 图标名称
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

### 3. tags (标签表)
```sql
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7), -- HEX颜色值 #FF5733
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
```

### 4. articles (文章表)
```sql
CREATE TABLE articles (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL, -- Markdown格式
    cover_image TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false, -- 付费内容标识
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    reading_time INT, -- 阅读时长（分钟）
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- 软删除
);

CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articles_deleted_at ON articles(deleted_at);
```

### 5. article_tags (文章标签关联表)
```sql
CREATE TABLE article_tags (
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX idx_article_tags_article ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag ON article_tags(tag_id);
```

### 6. comments (评论表)
```sql
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false, -- 软删除
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
```

### 7. likes (点赞表)
```sql
CREATE TABLE likes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL, -- article, comment
    target_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
```

### 8. follows (关注表)
```sql
CREATE TABLE follows (
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id) -- 不能关注自己
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

### 9. subscriptions (订阅表 - 付费会员)
```sql
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- basic, premium, enterprise
    status VARCHAR(20) NOT NULL, -- active, expired, cancelled
    amount DECIMAL(10,2) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);
```

### 10. orders (订单表)
```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_no VARCHAR(100) UNIQUE NOT NULL, -- 订单号
    order_type VARCHAR(20) NOT NULL, -- subscription, article, course
    target_id BIGINT, -- 关联的商品ID
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, paid, failed, refunded
    payment_method VARCHAR(50), -- wechat, alipay, stripe
    transaction_id VARCHAR(255), -- 第三方交易号
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_no ON orders(order_no);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

---

## 辅助表

### 11. article_views (文章浏览记录 - 可选)
用于精准统计和防刷
```sql
CREATE TABLE article_views (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- NULL表示匿名
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_article_views_article ON article_views(article_id);
CREATE INDEX idx_article_views_user ON article_views(user_id);
CREATE INDEX idx_article_views_created ON article_views(created_at);
```

### 12. user_read_progress (用户阅读进度)
用于退款判定和个性化推荐
```sql
CREATE TABLE user_read_progress (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    progress INT DEFAULT 0, -- 阅读进度百分比 0-100
    last_position INT DEFAULT 0, -- 最后阅读位置（字符数）
    is_completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id)
);

CREATE INDEX idx_user_read_progress_user ON user_read_progress(user_id);
CREATE INDEX idx_user_read_progress_updated ON user_read_progress(updated_at DESC);
```

---

## 触发器设计

### 1. 更新updated_at字段
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到需要的表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... 其他表类似
```

### 2. 自动更新标签使用次数
```sql
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_tags_usage_count
AFTER INSERT OR DELETE ON article_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();
```

---

## 数据迁移策略

### 使用golang-migrate
```bash
# 安装
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 创建迁移
migrate create -ext sql -dir migrations -seq init_schema

# 执行迁移
migrate -database "postgresql://user:pass@localhost:5432/tzblog?sslmode=disable" -path migrations up

# 回滚
migrate -database "..." -path migrations down 1
```

---

## 性能优化建议

### 1. 分区表（流量大时考虑）
```sql
-- 按时间分区article_views表
CREATE TABLE article_views (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE article_views_2026_06 PARTITION OF article_views
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

### 2. 物化视图（统计数据）
```sql
-- 热门文章榜单
CREATE MATERIALIZED VIEW hot_articles AS
SELECT 
    a.id,
    a.title,
    a.slug,
    a.view_count,
    a.like_count,
    a.comment_count,
    (a.view_count * 0.3 + a.like_count * 2 + a.comment_count * 1.5) as hot_score
FROM articles a
WHERE a.status = 'published' AND a.deleted_at IS NULL
ORDER BY hot_score DESC
LIMIT 100;

-- 定时刷新（每小时）
CREATE INDEX idx_hot_articles_score ON hot_articles(hot_score DESC);
```

### 3. 查询优化
- 避免SELECT *，只查询需要的字段
- 使用JOIN代替N+1查询
- 合理使用LIMIT和OFFSET（深分页考虑游标）
- 利用覆盖索引

---

## 备份策略

### 1. 自动备份
```bash
# 每日全量备份
0 2 * * * pg_dump -U postgres tzblog > /backup/tzblog_$(date +\%Y\%m\%d).sql

# 保留30天
find /backup -name "tzblog_*.sql" -mtime +30 -delete
```

### 2. 恢复测试
每月测试一次备份恢复流程

---

## 数据字典

完整的表结构、字段说明、索引说明整理为独立文档。
