# 2026-06-17 全栈 5 轮复审 · 汇总报告

**审计基线**: `main @ 9853c2a`（审计期间用户已将 prod-config / db-indexes / E2E 三支合并进 main）
**审计方式**: 多代理并行 workflow（5 轮）+ 主流程证据复核
**对照对象**: 2026-06-16 修正版审计（26 真实问题）
**铁律**: 每条结论附 `file:line` 或命令输出；主流程亲自抽查所有 BLOCKER/HIGH

---

## 一、综合评分对比

| 维度 | 2026-06-16(修正) | 2026-06-17 | Δ |
|------|:---:|:---:|:---:|
| Round 1 前端 1:1 复刻 | 78 | **82** | +4 |
| Round 2 前后端集成 | 85 | **82** | -3 |
| Round 3 性能 | 72 | **74** | +2 |
| Round 4 测试 | 35 | **62** | +27 |
| Round 5 生产就绪 | 45 | **52** | +7 |
| **综合** | **63** | **70** | **+7** |

**一句话结论**: 昨天的修复**确实落地并已合并进 main**，分数全面回升；但本轮暴露出 2 个昨天没看到的真 BLOCKER（生产部署链路）和一条贯穿性事实——**前端是高质量的 1:1 静态原型，尚未接通后端**。**仍不可上线**，但距离比昨天近。

---

## 二、昨天 26 个问题的核实结果

### ✅ 已确实修复（11）
| ID | 问题 | 证据 |
|----|------|------|
| B-1 | go build 失败 | `go build ./...` 退出码 0 |
| B-2 | 6 个 postgres 测试失败 | `go test ./...` 全 30 包 PASS |
| B-3 | 二进制入库 | `git ls-files` 无 server 二进制 |
| B-5 | 缺 TOC | `articles/[slug]/_components/ArticleSidebar.tsx:12-67` scroll-spy TOC |
| B-6 | 代码块无复制 | `_components/CodeBlock.tsx:24-29` clipboard + 反馈态 |
| H-4 | 缺最近评论 widget | `(public)/page.tsx:278-298` 只读评论列表 |
| H-7 | 密钥强度/熵校验 | `config/validation.go:84-205`，对应测试全 PASS |
| M-5 | 连接池未配置 | `config/database.go:207-210` 显式四项 + 校验 |
| R2-2~R2-5 | 信封解包/Preload/刷新保活/路由对齐 | 见 round-2，逐条 file:line 确认 |
| B4 | 列表返回全文 | `article_repo.go:67` `.Omit("content")` |
| M-4 | 缺 E2E | `playwright.config.ts` + `e2e/tests` 8 spec × 6 浏览器 |

### ⚠️ 部分修复 / 落地不完整（8）
| ID | 问题 | 现状 |
|----|------|------|
| H-6 | 生产配置强校验 | 代码已写已测，但部署链路下**根本不触发**（见 BLOCKER-1） |
| H-1 | status/created_at 索引 | migration 已入 main，但 `idx_articles_status` 与既有复合索引冗余，GORM tag 无效（无 AutoMigrate） |
| B-4 | 前端 0% 测试 | 已有 14 测试文件，但真实业务覆盖 ~6%（见 HIGH） |
| H-2 | 打包体积 | lucide 已按需导入；prism/react-markdown 整套是死代码；未实测 <100KB |
| H-3 | next/image | 全站仅 2 处裸 `<img>`（本地 blob 预览），公开页零图片，问题范围远小于昨天 |
| H-5 | 板块 CRUD | 增删查/可见性切换 UI 完整，但「编辑」是占位、全页本地 mock 无后端 |
| M-9 | 生产 Docker | 多阶段 OK，但无 USER（root 运行）、context/挂载路径错（见 HIGH） |
| M-10 | CI/CD | backend-ci 完整，但前端 CI 不跑测试、Go 版本不匹配（见 HIGH） |

### 🟥 仍开放（1）
- **M-6 Redis 缓存未接入读路径**：`internal/cache/*` 仅被 `examples/` 引用，`CacheMiddleware` 全仓零注册，`ArticleService` 无 cache 字段，读路径直打 DB。缓存层是死代码。

### ⚪ 假阳性 / 不成立（1）
- **N+1 查询**：`article_repo.go:62-103` List 无 Preload；follow/like 用 JOIN/Count；handler 无逐条循环。确认不成立（与昨日修正版一致）。

---

## 三、本轮新发现（2 BLOCKER + 8 HIGH + 8 MEDIUM + 10 LOW）

### 🔴 BLOCKER（2）——均已主流程亲自验证

**BLOCKER-1｜生产 env 变量无法注入配置，整套生产安全校验被绕过**
- `config.go:30` 仅 `v.AutomaticEnv()`，**无 `SetEnvKeyReplacer` / `BindEnv`**。Viper 的 AutomaticEnv + Unmarshal 对嵌套键（`database.password` 等）**不会**从 `DB_PASSWORD`/`JWT_SECRET`/`SERVER_MODE` 读取。
- 后果链：`docker-compose.prod.yml` 注入的 env 被静默忽略 → 应用实读 `config.yaml`（`mode:development`、`password:tzblog`、`jwt.secret:"dev_secret_key_..."`、`sslmode:disable`，R2 为 `${CLOUDFLARE_*}` 字面量）→ 因 `mode=development`，`IsProduction()=false` → **`ValidateProduction` 永不触发**，且启用 development CORS。
- 即：按官方文档用 env 注入密钥部署的生产容器，会带着开发弱密钥 + 宽松 CORS + SSL 关闭启动。`validation.go` 写得很好，但**保护不到真实部署路径**。
- 修复：`config.go` 加 `v.SetEnvKeyReplacer(strings.NewReplacer(".","_"))` + 对每个键显式 `v.BindEnv("database.password","DB_PASSWORD")` 等别名映射；补一条「设 env 后 Load() 断言取到 env 值」的集成测试。

**BLOCKER-2｜开发配置 config.yaml 被烤进生产镜像**
- `Dockerfile.prod:32` `COPY --from=builder /app/config/config.yaml ./config/`；`backend/.dockerignore` **未排除** config.yaml。
- 叠加 BLOCKER-1，生产镜像固化开发弱值且无法用 env 纠正。
- 修复：生产改纯 env 驱动（配合 BLOCKER-1）或挂载只读 `config.production.yaml`；至少把 config.yaml 加入 `.dockerignore`；启动时 mode 非 production 应 fail-fast。

> BLOCKER-1 + BLOCKER-2 是同一根因（配置注入链路断裂）的两面，必须一起修。这是本轮**第一优先级**。

### 🟠 HIGH（8）
1. **登录/注册 UI 未接后端**：`AuthTerminal.tsx:50-91` handleSubmit 只做客户端校验后弹「✓ 登录成功」，**从不调用 `login()`/`setAuth()`**、不写 token、不跳转；OAuth/魔法链接按钮只 `showToast`。前台用户实际无法登录。（主流程已验证）
2. **tag_id 过滤端到端失效**：`article_handler.go:148-150` 解析 `filter.TagID`，但 `article_repo.go:62-103` List 从不使用 → 按标签筛选恒返回全量。（主流程已验证）
3. **/articles 忽略 category/tag(slug)/sort**：列表页 `articles/page.tsx:27` 传的 `category`/`tag`/`sort` 后端只在 `/search` 支持，`ListArticles` 不读 → 分类/标签筛选静默失效。
4. **前端覆盖率 95% 是假象**：v8 只统计被测 import 的 7/120 文件，真实业务覆盖 ~6%；`vitest.config.ts:24` 的 60% 阈值因未设 `all:true` 形同虚设。
5. **E2E 大量条件断言 + try/catch 吞错**：16 处 `if(count>0)` 包裹断言 + auth 10 处 try/catch → 功能缺失时测试静默通过（假绿），无法捕捉回归。
6. **docker-compose.prod.yml 路径/变量错**：`build.context: ./backend` 在 backend/ 下解析为 `backend/backend/`；nginx/certbot 挂载目录不存在；R2 用 `R2_ACCOUNT_ID` 而配置期望 `CLOUDFLARE_ACCOUNT_ID`。按此 compose 起不来。
7. **前端 CI 不跑任何测试**：`frontend-ci.yml` 只有 lint/typecheck/build，14 个 vitest + Playwright 无门禁。
8. **CI Go 版本不匹配**：`backend-ci.yml:50` 用 `1.22`，`go.mod:3` 要求 `1.25.0`，`Dockerfile.prod:4` 用 `1.25`。存在「CI 绿但生产构建/行为不一致」风险。

### 🟡 MEDIUM（8）
1. 两套重复 TOC/CodeBlock，重依赖版本（prism + react-markdown + 6 插件）是死代码（`components/article/*`）。
2. 板块管理无后端持久化，「编辑」占位，模块级 `let nextId=100` 反模式。
3. 点赞字段漂移：前端期望 `likeCount`，后端返回 `count`，且 like/unlike 不回计数 → 计数恒 undefined。
4. category/tag 列表接口无分页上限（`category_handler.go:42-51`/`tag_handler.go:42-51` 不经 service 封顶，可 `?limit=1000000`）。
5. E2E 登录/注册成功用例断言恒真（`isOnHomePage = url.includes("/")`），核心鉴权流程实际没测。
6. E2E 普遍 `waitForTimeout` 硬等待（12 处），CI 易 flaky，retries=2 掩盖间歇失败。
7. `backup.sh:9` `source ../.env` 相对路径 + 无 `set -o pipefail`（检查的是 gzip 退出码非 pg_dump）→ 可能静默产出空备份还报成功。
8. 弱密码用 `strings.Contains` 子串匹配（`validation.go:222`）→ 含 "root"/"qwerty" 子串的强随机密码会被误拒、阻断启动。

### ⚪ LOW（10）
1. 文章详情页正文/元数据硬编码单篇（`articles/[slug]/page.tsx`），任何 slug 渲染同一篇，未接数据层。
2. 首页/文章页大量 `href="#"` 占位链接，影响可访问性。
3. 注册 `displayName` 被后端静默丢弃（`RegisterDTO` 无该字段）。
4. Sitemap 硬编码 `Limit:1000`，文章超量静默截断，影响 SEO。
5. `CategoryRepository.FindAll()` 无界查询（当前为死代码）。
6. `article.go:30,37` GORM index tag 无效（全仓无 AutoMigrate），索引双轨易误导。
7. `setup.spec.ts` 两个用例无断言只 console.log。
8. 后端 `TEST_COVERAGE_REPORT.md` 已过期（称 service 40.5%，实测 67.3%），`$(date)` 字面量未求值。
9. 仓库跟踪了测试产物/临时文档：`backend/full_test.txt`、`backend/test_output.txt`、`frontend/PHASE4_*.md`、`frontend/VERIFICATION_NEEDED.md`。
10. `/health` 为静态探针不查依赖（真实检查在 `/ready`）；`feature/backend-phase1-3`(+22)、`feature/backend/quality-improvements-p2`(+6) 两条 stale 分支建议清理。

---

## 四、三条贯穿性主题

1. **生产配置：代码到位，链路断裂**（BLOCKER-1/2 + HIGH-6）。`validation.go` 是优秀的安全代码且测试充分，但 Viper 不读 env + config.yaml 烤进镜像，使它在真实 `docker compose up` 路径下完全不生效。**修复优先级最高**。

2. **前端：高质量 1:1 视觉原型，未接后端**（HIGH-1/2/3 + MEDIUM-2/3 + LOW-1/3）。视觉复刻、暗色终端风格、a11y 基础到位，但登录是假的、板块是 mock、文章详情硬编码、多个接口契约对不上。lib/api 层写得对，**缺的是把 UI 接到 API 上**。

3. **测试信号具有误导性**（HIGH-4/5 + MEDIUM-5/6）。"覆盖率 95%"和"E2E 全绿"都名不副实：覆盖率只测了 7 个文件，E2E 用条件断言/吞错在功能缺失时也通过，且前端测试不在 CI 跑。**"测试通过"高估了真实安全度**。

---

## 五、行动清单（按优先级）

详见 [round-1..5](.) 各轮文件。摘要：

**P0（上线前必修，1-2 天）**
- [ ] 修 BLOCKER-1：config.go 加 `SetEnvKeyReplacer` + 各键 `BindEnv`，补 env 注入集成测试
- [ ] 修 BLOCKER-2：config.yaml 移出生产镜像（纯 env 或挂载），加入 .dockerignore，mode 非 production 时 fail-fast
- [ ] 修 docker-compose.prod.yml 的 context/nginx/certbot 路径与 R2 env 名（HIGH-6）

**P1（本周，3-5 天）**
- [ ] 接通登录/注册 UI 到 lib/api/auth（HIGH-1）
- [ ] 后端补 tag_id / category-slug / sort 过滤，或前端改传 id（HIGH-2/3）
- [ ] vitest 开 `coverage.all + include`，暴露真实覆盖率再补测（HIGH-4）
- [ ] E2E 去条件断言/try-catch，用确定性断言 + 事件等待重写关键流程（HIGH-5 + MEDIUM-5/6）
- [ ] CI：前端加 `pnpm test`，后端 go-version 升到 1.25（HIGH-7/8）

**P2（下周）**
- [ ] 板块管理接后端持久化 + 实现编辑（MEDIUM-2）
- [ ] 点赞字段统一 likeCount（MEDIUM-3）；category/tag 列表加分页上限（MEDIUM-4）
- [ ] backup.sh 加 pipefail + 绝对路径（MEDIUM-7）；弱密码改整词匹配（MEDIUM-8）
- [ ] 清理死代码组件与重依赖（MEDIUM-1）、跟踪的 junk 文件（LOW-9）、stale 分支（LOW-10）
- [ ] 文章详情页接数据层（LOW-1）；刷新后端覆盖率报告（LOW-8）

---

## 六、验收门槛（可上线）
- [ ] BLOCKER-1/2 修复并用 production env 端到端验证校验真的触发
- [ ] 登录/注册可真实完成
- [ ] 前端真实覆盖率（`coverage.all`）≥ 60% 且进 CI
- [ ] E2E 关键流程为确定性断言
- [ ] 综合评分 ≥ 75，生产就绪 ≥ 70

**当前结论：不可上线**（综合 70/100，生产就绪 52/100）。比昨天明显更近，核心欠账从"功能缺失"转为"集成接线 + 部署链路"。

---
**审计完成**: 2026-06-17 · **下次复审**: P0 修复后验证部署链路
