# Design: build-payload-content-collections

> 详细字段定义和完整代码见：`docs/TZBlog CMS数据链路实现方案.md` 第三章

## 1. 文件结构

```
apps/cms/src/
  collections/
    Users.ts      # 已存在，不改动
    Media.ts      # 已存在，不改动
    Posts.ts      # 新建
    Projects.ts   # 新建
    Docs.ts       # 新建
    Notes.ts      # 新建
  payload.config.ts  # 修改：注册4个新 collection
```

## 2. 共用 sections 字段结构

所有4个 collection 都包含 `sections` array 字段，结构一致：

```
sections (array)
  ├── id (text, required)           # 区块锚点 ID
  ├── title (text, required)        # 区块标题
  ├── paragraphs (array, required)  # 段落
  │     └── text (textarea)
  └── bullets (array, optional)     # 要点列表
        └── text (text)
```

## 3. 各 collection 特有字段

### Posts 特有
- `category` (text) — 分类，如 "Architecture Notes"
- `orbit` (text) — 副标题，如 "Deep Space Observatory"
- `publishedAt` (date) — 发布日期
- `readTime` (text) — 如 "8 min"
- `featured` (checkbox) — 是否精选
- `tags` (array of text)

### Projects 特有
- `stage` (select) — In Progress / Planned / Concept / Stable / Archived
- `orbit` (text)
- `featured` (checkbox)
- `stack` (array of text) — 技术栈
- `tags` (array of text)
- `links` (array of {label, href}) — 外部链接
- `highlights` (array of text) — 项目亮点

### Docs 特有
- `version` (text) — 如 "v0.2" / "draft"
- `orbit` (text)
- `tags` (array of text)

### Notes 特有
- `publishedAt` (date)
- `mood` (text) — 如 "Ship Log" / "Short Note" / "Field Memo"
- `tags` (array of text)

## 4. 通用配置（所有 collection）

```ts
access: { read: () => true }   // 公开读取
versions: { drafts: true }      // 草稿支持
admin: { useAsTitle: 'title' }  // 后台列表显示 title
```

## 5. payload.config.ts 修改点

```ts
// 新增 import
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Docs } from './collections/Docs'
import { Notes } from './collections/Notes'

// collections 数组改为
collections: [Users, Media, Posts, Projects, Docs, Notes],
```

## 6. 注意事项

- Payload 启动时会自动执行数据库 migration，在 PostgreSQL 创建对应表
- `PAYLOAD_SECRET` 必须替换为真实随机字符串，生成命令：
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- 首次启动后访问 `http://localhost:3000/admin` 创建管理员账号
- CORS 配置：如果 Astro dev server 请求 Payload 出现跨域，在 payload.config.ts 加：
  `cors: ['http://localhost:4321'], csrf: ['http://localhost:4321']`
