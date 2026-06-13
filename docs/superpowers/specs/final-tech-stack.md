# TZBlog 最终技术方案确认

## ✅ 已确定的技术选型

### 1. 编辑器：**Markdown + @uiw/react-md-editor**
**理由**：
- 目标用户是技术人员，熟悉Markdown
- 性能优秀，bundle体积小
- 维护成本低，内容可迁移
- 支持代码高亮、工具栏辅助

**未来扩展**：6-12个月后可选支持富文本（Tiptap），双轨运行

---

### 2. 对象存储：**Cloudflare R2**
**理由**：
- 免费出口流量（最大优势）
- S3兼容API，可无缝切换
- 全球CDN加速
- 成本最低（10GB免费）

**未来扩展**：流量起来后可自建MinIO或切换阿里云OSS

---

### 3. 搜索引擎：**Meilisearch**
**理由**：
- 性能优秀（<50ms搜索响应）
- 中文分词支持好
- 部署简单，可与后端共享服务器
- 支持几十万篇文章规模
- 零额外成本

**实施计划**：
- Phase 1（前3个月）：不做搜索，专注内容
- Phase 2（文章达到30-50篇）：引入Meilisearch
- Phase 3（10万+篇，几年后）：考虑升级Elasticsearch

---

### 4. 退款策略：**阶梯式退款**
**核心规则**：

| 商品类型 | 退款窗口 | 退款条件 | 退款比例 |
|---------|---------|---------|---------|
| 单篇文章(¥29-99) | 24小时 | 阅读进度<50% | 100% |
| 月度会员(¥99/月) | 7天 | 阅读付费文章<3篇 | 100% |
| 年度会员(¥999/年) | 30天 | 按使用月数 | 按比例 |
| 专栏课程(¥199-699) | 14天 | 学习进度<20% | 100%-50% |
| 技术咨询 | 服务前24h | 未开始 | 100% |

**防滥用机制**：
- 用户信用评分系统
- 每年最多3次退款
- 退款率>30%触发人工审核

**目标受众**：
- 主要：国内用户
- 未来：国际用户（支持Stripe）
- 不需要发票系统

---

## 📦 完整技术栈

### 前端
```yaml
框架: Next.js 15 (App Router)
UI库: React 19
语言: TypeScript (strict mode)
样式: Tailwind CSS v4
组件: shadcn/ui + Radix UI
动画: Framer Motion
状态: Zustand / Jotai
数据获取: TanStack Query
编辑器: @uiw/react-md-editor
Markdown渲染: react-markdown + remark/rehype
代码高亮: prism-react-renderer
```

### 后端
```yaml
语言: Go 1.22+
框架: Gin
ORM: GORM
数据库: PostgreSQL 15+
缓存: Redis 7+
搜索: Meilisearch 1.x
对象存储: Cloudflare R2
日志: zap
JWT: golang-jwt/jwt
```

### 基础设施
```yaml
前端部署: Vercel
后端部署: 云服务器 (腾讯云/阿里云 2核4G)
CDN: Cloudflare
监控: Sentry + Prometheus
CI/CD: GitHub Actions
域名: 需备案
```

---

## 💰 成本预估（月度）

### 最小化配置
```
腾讯云轻量2核4G    ¥74
域名分摊           ¥5
Cloudflare R2      ¥0 (免费额度)
Vercel            ¥0 (免费版)
----------------------------
总计：            ~¥80/月
```

### 推荐配置（流量起来后）
```
阿里云ECS 2核4G    ¥200
Cloudflare R2      ¥50 (超出免费额度)
Vercel Pro        ¥140
----------------------------
总计：            ~¥390/月
```

---

## 🗂️ 数据库结构

**10张核心表**：
1. `users` - 用户
2. `articles` - 文章
3. `categories` - 分类
4. `tags` - 标签
5. `article_tags` - 文章标签关联
6. `comments` - 评论
7. `likes` - 点赞
8. `follows` - 关注
9. `subscriptions` - 订阅会员
10. `orders` - 订单

---

## 📅 实施时间线

### Phase 1: 基础搭建 (Week 1-2)
- [ ] 后端Go项目初始化
- [ ] 前端Next.js项目初始化
- [ ] 数据库设计与迁移
- [ ] JWT认证实现
- [ ] Docker环境配置

### Phase 2: 核心功能 (Week 3-6)
- [ ] 文章CRUD功能
- [ ] Markdown编辑器集成
- [ ] 图片上传到R2
- [ ] 前端文章列表/详情页
- [ ] 分类标签管理

### Phase 3: 高级功能 (Week 7-9)
- [ ] 评论系统
- [ ] 点赞功能
- [ ] 后台管理界面
- [ ] 统计分析

### Phase 4: SEO优化 (Week 10-11)
- [ ] Meta标签动态生成
- [ ] Sitemap自动生成
- [ ] 结构化数据
- [ ] 性能优化

### Phase 5: 上线部署 (Week 12)
- [ ] 域名备案
- [ ] 服务器部署
- [ ] Cloudflare CDN配置
- [ ] 监控告警

### Phase 6: 搜索与变现 (未来)
- [ ] Meilisearch集成（文章30+篇时）
- [ ] 支付系统（6个月后）
- [ ] 会员订阅（12个月后）

---

## 🚀 下一步行动

现在可以开始编码了！建议按以下顺序：

1. **先搭建后端**（Week 1）
   - 创建Go项目结构
   - 配置数据库连接
   - 实现用户认证API
   - 实现文章CRUD API

2. **再开发前端**（Week 2）
   - 创建Next.js项目
   - 配置Tailwind + shadcn/ui
   - 实现首页和文章列表页
   - 集成Markdown编辑器

3. **联调测试**（Week 3）
   - 前后端对接
   - 图片上传功能
   - 完整发布流程测试

**准备好开始了吗？我可以帮你：**
1. 生成完整的项目脚手架
2. 编写数据库迁移脚本
3. 实现核心API接口
4. 创建前端页面组件

告诉我你想从哪里开始！🎯
