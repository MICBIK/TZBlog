# 搜索引擎方案推荐：Meilisearch

## 为什么选择Meilisearch？

### 对比分析

| 特性 | PostgreSQL | Meilisearch | Elasticsearch |
|------|-----------|-------------|---------------|
| **部署复杂度** | ⭐ (已有) | ⭐⭐ (简单) | ⭐⭐⭐⭐⭐ (复杂) |
| **资源占用** | 低 | 低-中 (50-200MB) | 高 (1GB+) |
| **搜索速度** | 慢 (<100ms) | 快 (<50ms) | 快 (<50ms) |
| **中文分词** | 弱 | 强 | 强 (需配置) |
| **相关性排序** | 基础 | 优秀 | 优秀 |
| **容错搜索** | 无 | 有 (typo tolerance) | 有 |
| **实时更新** | 立即 | 立即 | 近实时 |
| **学习成本** | 低 | 低 | 高 |
| **适合规模** | <500篇 | 500-50K篇 | 10K+ |

---

## 推荐方案：Meilisearch

### 核心优势

#### 1. **适合博客场景**
- 专为内容搜索优化（不是日志分析、指标聚合）
- 开箱即用的相关性排序
- 自动高亮搜索词
- Typo tolerance（输入"nexjs"能搜到"nextjs"）

#### 2. **中文支持优秀**
```json
// 配置示例
{
  "searchableAttributes": ["title", "content", "summary"],
  "filterableAttributes": ["category", "tags", "isPremium"],
  "sortableAttributes": ["publishedAt", "viewCount"],
  "rankingRules": [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness"
  ]
}
```

#### 3. **性能表现**
- 1万篇文章，搜索响应<10ms
- 增量索引更新
- 内存占用可控（约200-500MB）

#### 4. **开发体验极佳**
```go
// Go客户端示例
import "github.com/meilisearch/meilisearch-go"

client := meilisearch.NewClient(meilisearch.ClientConfig{
    Host: "http://localhost:7700",
    APIKey: os.Getenv("MEILI_MASTER_KEY"),
})

// 添加文档
index.AddDocuments([]map[string]interface{}{
    {
        "id": 1,
        "title": "Next.js 15新特性",
        "content": "文章内容...",
        "tags": []string{"Next.js", "React"},
    },
})

// 搜索
results, _ := index.Search("nextjs", &meilisearch.SearchRequest{
    Limit: 20,
    AttributesToHighlight: []string{"title", "content"},
})
```

#### 5. **运维友好**
- 单一二进制文件，部署简单
- Docker一键启动
- 自动备份和恢复
- Web UI管理界面

---

## 部署方案

### 开发环境
```bash
# Docker启动
docker run -d \
  --name meilisearch \
  -p 7700:7700 \
  -v $(pwd)/meili_data:/meili_data \
  getmeili/meilisearch:latest
```

### 生产环境
```bash
# 与后端部署在同一服务器
# 占用端口: 7700
# 内存: 预留500MB

# systemd服务配置
[Unit]
Description=Meilisearch
After=network.target

[Service]
Type=simple
User=meilisearch
ExecStart=/usr/local/bin/meilisearch \
  --db-path /var/lib/meilisearch/data \
  --http-addr 127.0.0.1:7700 \
  --master-key ${MEILI_MASTER_KEY}
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

---

## 索引设计

### 文章索引结构
```json
{
  "id": 1,
  "title": "Next.js 15新特性详解",
  "summary": "深入解析Next.js 15的重大更新",
  "content": "完整文章内容（截取前1000字）",
  "slug": "nextjs-15-features",
  "categoryName": "前端开发",
  "tags": ["Next.js", "React", "前端"],
  "authorName": "TZ",
  "publishedAt": 1686614400,
  "viewCount": 1234,
  "isPremium": false
}
```

### 搜索功能实现

#### 前端搜索组件
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.hits);
      setLoading(false);
    }, 300); // 防抖300ms

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索文章..."
        className="w-full px-4 py-2 pl-10 border rounded-lg"
      />
      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
      
      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white shadow-lg rounded-lg">
          {results.map(hit => (
            <a href={`/articles/${hit.slug}`} key={hit.id}>
              <div dangerouslySetInnerHTML={{ 
                __html: hit._formatted.title 
              }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 后端搜索接口
```go
func (h *SearchHandler) Search(c *gin.Context) {
    query := c.Query("q")
    
    results, err := h.meilisearch.Index("articles").Search(query, &meilisearch.SearchRequest{
        Limit: 20,
        AttributesToHighlight: []string{"title", "summary"},
        Filter: "isPremium = false", // 免费内容
        Sort: []string{"viewCount:desc"},
    })
    
    if err != nil {
        response.Error(c, http.StatusInternalServerError, err)
        return
    }
    
    response.Success(c, results.Hits)
}
```

---

## 何时需要升级到Elasticsearch？

### 考虑升级的场景
1. **文章量超过10万篇**
2. **需要复杂聚合分析**（按时间/分类的统计图表）
3. **需要日志分析**（用户行为分析、错误日志）
4. **需要多租户隔离**

但对于个人博客，即使有10万篇文章，Meilisearch也完全够用。

---

## 成本分析

### Meilisearch
- **资源占用**: 500MB内存，可与后端共享服务器
- **额外成本**: ¥0（与Go后端同服务器）

### Elasticsearch
- **最小配置**: 2GB内存
- **推荐配置**: 4GB+ 内存
- **额外成本**: 需要独立服务器，¥200-400/月

---

## 最终推荐

**使用Meilisearch**，理由：

1. ✅ 性能足够（<50ms搜索）
2. ✅ 支持几十万篇文章规模
3. ✅ 中文分词优秀
4. ✅ 零额外成本（共享服务器）
5. ✅ 部署运维简单
6. ✅ 开发体验好
7. ✅ 未来如需切换到ES，迁移成本可控

**落地计划**：
- Phase 1: 先不做搜索，专注内容（前3个月）
- Phase 2: 文章达到30-50篇时，引入Meilisearch
- Phase 3: 文章超过10万篇时再考虑ES（几年后）

你同意这个方案吗？
