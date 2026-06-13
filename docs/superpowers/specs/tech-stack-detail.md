# 技术栈详细说明

## 前端技术栈解析

### Next.js 15 特性利用
1. **App Router**: 文件系统路由，更清晰的代码组织
2. **Server Components**: 默认服务端渲染，减少客户端JS
3. **Server Actions**: 简化表单提交和数据修改
4. **Streaming**: 渐进式渲染，提升感知性能
5. **Partial Prerendering**: 静态+动态混合渲染

### React 19 新特性
1. **use hook**: 简化异步数据读取
2. **Actions**: 原生表单处理
3. **优化的useFormStatus**: 表单状态管理

### Tailwind CSS v4优势
- CSS变量原生支持
- 更小的bundle体积
- 更快的编译速度
- 新的容器查询支持

### shadcn/ui选择理由
- 非npm包，代码直接在项目中，可自由修改
- 基于Radix UI，无障碍访问(a11y)做得好
- Tailwind原生，样式一致性强
- 组件质量高，设计现代

## 后端技术栈解析

### Go语言优势
1. **性能**: 编译型语言，接近C的性能
2. **并发**: goroutine天然支持高并发
3. **部署**: 单一二进制文件，部署简单
4. **生态**: 丰富的Web框架和工具库

### Gin框架选择
- 性能最优秀的Go Web框架之一
- 中间件生态丰富
- 文档完善，社区活跃
- API设计简洁直观

### GORM优势
- Go生态最成熟的ORM
- 支持主流数据库
- 迁移工具完善
- 关联查询方便

### PostgreSQL选择
- 功能强大的开源关系型数据库
- JSON支持，可存储半结构化数据
- 全文搜索能力
- 成熟的备份和高可用方案

### Redis应用场景
1. **缓存**: 文章详情、列表、热门数据
2. **Session**: 用户会话存储
3. **计数器**: 浏览量、点赞数
4. **排行榜**: 热门文章榜单(ZSET)
5. **消息队列**: 异步任务(可选)

## 工具链

### 开发工具
- **包管理**: pnpm (快速、节省磁盘空间)
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged
- **API测试**: Thunder Client / Postman

### 监控工具
- **错误追踪**: Sentry
- **性能监控**: Vercel Analytics
- **日志**: 自建 + Loki/Grafana
- **APM**: 可选集成New Relic
