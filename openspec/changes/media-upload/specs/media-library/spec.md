## ADDED Requirements

### Requirement: /admin/media 列表页

`/admin/media` SHALL 渲染所有 Media 行，按 `createdAt desc` 排序，分页 12 条/页。

#### Scenario: 空状态
- **WHEN** Media 表为空
- **THEN** 页面渲染空状态卡片，文案"暂无媒体。在文章编辑器中上传图片，或拖文件到这里。"

#### Scenario: 有数据时网格渲染
- **WHEN** Media 表有 >0 行
- **THEN** 页面以卡片网格（4 列桌面 / 2 列移动）渲染缩略图、文件名、大小（kB/MB 格式）、上传时间
- **AND** 每张卡片右上角有"复制 URL"和"删除"两个图标按钮（hover 才显示）

#### Scenario: 分页
- **WHEN** Media 数量 > 12
- **THEN** 底部出现"上一页 / 第 X 页 / 下一页"分页控件
- **AND** URL 加 `?page=N` query 持久化页码

### Requirement: GET /api/admin/media

`GET /api/admin/media` SHALL 返回分页媒体列表，支持 `?page=N&pageSize=M` query。仅 admin 可访问。

#### Scenario: 默认分页
- **WHEN** 调用 `GET /api/admin/media` 不带 query
- **THEN** 响应 200 `{ data: Media[], meta: { total, page: 1, pageSize: 12 } }`

#### Scenario: 自定义分页
- **WHEN** 调用 `GET /api/admin/media?page=2&pageSize=24`
- **THEN** 响应返回第 25-48 条，`meta.page = 2`、`meta.pageSize = 24`

#### Scenario: pageSize 上限
- **WHEN** 调用 `GET /api/admin/media?pageSize=200`
- **THEN** 响应 400 `VALIDATION`，pageSize 上限 100

### Requirement: DELETE /api/admin/media/[id]

`DELETE /api/admin/media/:id` SHALL 删除 Media 行 + 调用 `storage.delete(key)` 清理物理文件。仅 admin 可访问。

#### Scenario: 成功删除
- **WHEN** admin 删除一个存在的 Media id
- **THEN** Media 行从 DB 移除
- **AND** 物理文件被删除（local: rm -f；s3: removeObject）
- **AND** 响应 200 `{ data: { id } }`

#### Scenario: 删除不存在的 id
- **WHEN** admin 删除一个不存在的 Media id
- **THEN** 响应 404 `NOT_FOUND`，DB 与文件系统都无副作用

#### Scenario: 物理文件已不存在时仍能完成删除
- **WHEN** Media 行存在但其 key 对应的物理文件已被外部清理
- **THEN** DB 行仍被删除，响应 200（storage.delete 是幂等的，不抛 ENOENT）
- **AND** 服务端 log warning，但不影响响应

#### Scenario: 删除时不检查媒体是否被引用
- **WHEN** Media 被某 Post.cover 引用，admin 选择删除该 Media
- **THEN** 删除仍然成功（不做外键约束），但前端在调用前 SHOULD 用 confirm dialog 提示"该图可能正被文章使用"
- **AND** 删除后 Post.cover 仍指向不存在的 url，渲染时会破图（接受的副作用，硬删的代价）

### Requirement: MediaTable / MediaCard 复用约束

媒体库页面 SHALL 复用项目已有的 shadcn Table / Card 组件，新增的 `MediaTable.tsx` / `MediaCard.tsx` / `MediaRowActions.tsx` 不引入任何 shadcn 之外的 UI 库。

#### Scenario: 仅依赖 shadcn 基础组件
- **WHEN** 检视 `components/admin/media/*.tsx` 的 import
- **THEN** 任何第三方 UI 组件 import 必须来自 `@/components/ui/*`（shadcn）或 `lucide-react`（图标）

### Requirement: 复制 URL 操作

媒体卡片上的"复制 URL"按钮 SHALL 把该 Media 的完整 url 写入剪贴板，并显示 sonner toast 确认。

#### Scenario: 点击复制
- **WHEN** 用户点击某 Media 卡片右上角的"复制 URL"按钮
- **THEN** `navigator.clipboard.writeText(media.url)` 被调用
- **AND** 显示 sonner toast "已复制 URL"

#### Scenario: clipboard API 不可用时降级
- **WHEN** 浏览器不支持 `navigator.clipboard`（HTTP / 不安全上下文）
- **THEN** 降级到 `document.execCommand("copy")`，仍显示 toast；若两者都失败，显示 error toast "复制失败，请手动选择"
