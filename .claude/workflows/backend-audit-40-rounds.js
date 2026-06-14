export const meta = {
  name: 'backend-full-audit-40-rounds',
  description: '后端代码库 40 轮全量审计 - 20 个专业代理并行执行',
  phases: [
    { title: '安全审计', detail: '8 轮 - OWASP Top 10, 认证授权, 输入验证, 密码学' },
    { title: '性能审计', detail: '8 轮 - 数据库查询, 内存泄漏, 缓存策略, 算法优化' },
    { title: '代码质量', detail: '8 轮 - 复杂度, 错误处理, 命名规范, 重复代码' },
    { title: '架构审计', detail: '6 轮 - 分层架构, 接口设计, 模块耦合' },
    { title: '测试审计', detail: '6 轮 - 单元测试, 集成测试, 测试质量' },
    { title: '专项审计', detail: '4 轮 - 并发安全, API 设计' },
    { title: '汇总分析', detail: '生成最终审计报告' }
  ]
}

const FINDING_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          category: { type: 'string' },
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'number' },
          impact: { type: 'string' },
          recommendation: { type: 'string' }
        },
        required: ['severity', 'category', 'title', 'file', 'impact', 'recommendation']
      }
    },
    summary: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        critical: { type: 'number' },
        high: { type: 'number' },
        medium: { type: 'number' },
        low: { type: 'number' }
      },
      required: ['total', 'critical', 'high', 'medium', 'low']
    }
  },
  required: ['findings', 'summary']
}

// Phase 1: 安全审计 (8 轮)
phase('安全审计')
log('🔒 启动安全审计 - 4 个代理并行执行 8 轮')

const securityTasks = [
  { id: 1, name: 'OWASP & CWE', files: 'internal/api/handlers/, internal/api/middleware/' },
  { id: 2, name: '认证授权', files: 'pkg/auth/, internal/api/middleware/auth' },
  { id: 3, name: '输入验证', files: 'internal/repository/, internal/api/handlers/' },
  { id: 4, name: '密码学', files: 'pkg/auth/, config/, internal/domain/user/' }
]

const securityResults = await pipeline(
  securityTasks,
  task => agent(
    '你是安全审计专家 - ' + task.name + '\n\n' +
    '第 1 轮审计\n\n' +
    '审计文件: backend/' + task.files + '\n\n' +
    '检查: SQL注入, XSS, CSRF, 认证授权, 输入验证, 密码学安全\n\n' +
    '返回发现的所有安全问题',
    { label: 'sec-' + task.id + '-r1', phase: '安全审计', schema: FINDING_SCHEMA }
  ),
  (r1, task) => agent(
    '你是安全审计专家 - ' + task.name + '\n\n' +
    '第 2 轮深度审计\n\n' +
    '第1轮发现: ' + (r1 ? r1.summary.total : 0) + ' 个问题\n\n' +
    '现在检查: 边缘情况, 攻击链, 业务逻辑漏洞, 侧信道攻击\n\n' +
    '返回新发现的问题',
    { label: 'sec-' + task.id + '-r2', phase: '安全审计', schema: FINDING_SCHEMA }
  )
)

const secTotal = securityResults.filter(Boolean).reduce((s, r) => s + (r.summary ? r.summary.total : 0), 0)
log('✅ 安全审计完成 - ' + secTotal + ' 个问题')

// Phase 2: 性能审计 (8 轮)
phase('性能审计')
log('⚡ 启动性能审计 - 4 个代理并行执行 8 轮')

const perfTasks = [
  { id: 5, name: 'DB查询', files: 'internal/repository/postgres/' },
  { id: 6, name: '内存泄漏', files: 'internal/api/middleware/, cmd/server/' },
  { id: 7, name: '缓存策略', files: 'internal/cache/, internal/service/' },
  { id: 8, name: '算法复杂度', files: 'internal/service/, pkg/' }
]

const perfResults = await pipeline(
  perfTasks,
  task => agent(
    '你是性能审计专家 - ' + task.name + '\n\n' +
    '第 1 轮审计\n\n' +
    '审计文件: backend/' + task.files + '\n\n' +
    '检查: N+1查询, 索引缺失, Goroutine泄漏, 内存泄漏, 缓存缺失, 算法复杂度\n\n' +
    '返回发现的所有性能问题',
    { label: 'perf-' + task.id + '-r1', phase: '性能审计', schema: FINDING_SCHEMA }
  ),
  (r1, task) => agent(
    '你是性能审计专家 - ' + task.name + '\n\n' +
    '第 2 轮深度审计\n\n' +
    '第1轮发现: ' + (r1 ? r1.summary.total : 0) + ' 个问题\n\n' +
    '现在检查: 压力场景, 高并发瓶颈, 内存热点, CPU密集操作\n\n' +
    '返回新发现的问题',
    { label: 'perf-' + task.id + '-r2', phase: '性能审计', schema: FINDING_SCHEMA }
  )
)

const perfTotal = perfResults.filter(Boolean).reduce((s, r) => s + (r.summary ? r.summary.total : 0), 0)
log('✅ 性能审计完成 - ' + perfTotal + ' 个问题')

// Phase 3: 代码质量审计 (8 轮)
phase('代码质量')
log('🎨 启动代码质量审计 - 4 个代理并行执行 8 轮')

const qualityTasks = [
  { id: 9, name: '代码复杂度', files: 'internal/service/, internal/api/handlers/' },
  { id: 10, name: '错误处理', files: 'internal/, pkg/' },
  { id: 11, name: '命名规范', files: 'internal/' },
  { id: 12, name: '重复代码', files: 'internal/, pkg/' }
]

const qualityResults = await pipeline(
  qualityTasks,
  task => agent(
    '你是代码质量审计专家 - ' + task.name + '\n\n' +
    '第 1 轮审计\n\n' +
    '审计文件: backend/' + task.files + '\n\n' +
    '检查: 函数过长, 圈复杂度, 深层嵌套, 错误处理, 命名规范, 重复代码\n\n' +
    '返回发现的所有质量问题',
    { label: 'qual-' + task.id + '-r1', phase: '代码质量', schema: FINDING_SCHEMA }
  ),
  (r1, task) => agent(
    '你是代码质量审计专家 - ' + task.name + '\n\n' +
    '第 2 轮深度审计\n\n' +
    '第1轮发现: ' + (r1 ? r1.summary.total : 0) + ' 个问题\n\n' +
    '现在检查: 可读性, 可测试性, 可扩展性, 文档完整性\n\n' +
    '返回新发现的问题',
    { label: 'qual-' + task.id + '-r2', phase: '代码质量', schema: FINDING_SCHEMA }
  )
)

const qualTotal = qualityResults.filter(Boolean).reduce((s, r) => s + (r.summary ? r.summary.total : 0), 0)
log('✅ 代码质量审计完成 - ' + qualTotal + ' 个问题')

// Phase 4: 架构审计 (6 轮)
phase('架构审计')
log('🏗️ 启动架构审计 - 3 个代理并行执行 6 轮')

const archTasks = [
  { id: 13, name: '分层架构', files: 'internal/, cmd/server/' },
  { id: 14, name: '接口设计', files: 'internal/domain/' },
  { id: 15, name: '模块耦合', files: 'internal/' }
]

const archResults = await pipeline(
  archTasks,
  task => agent(
    '你是架构审计专家 - ' + task.name + '\n\n' +
    '第 1 轮审计\n\n' +
    '审计文件: backend/' + task.files + '\n\n' +
    '检查: 分层清晰, 依赖方向, 循环依赖, 接口设计, 抽象层次, 模块耦合\n\n' +
    '返回发现的所有架构问题',
    { label: 'arch-' + task.id + '-r1', phase: '架构审计', schema: FINDING_SCHEMA }
  ),
  (r1, task) => agent(
    '你是架构审计专家 - ' + task.name + '\n\n' +
    '第 2 轮深度审计\n\n' +
    '第1轮发现: ' + (r1 ? r1.summary.total : 0) + ' 个问题\n\n' +
    '现在检查: 架构演进, 扩展点, 架构腐化, 重构机会\n\n' +
    '返回新发现的问题',
    { label: 'arch-' + task.id + '-r2', phase: '架构审计', schema: FINDING_SCHEMA }
  )
)

const archTotal = archResults.filter(Boolean).reduce((s, r) => s + (r.summary ? r.summary.total : 0), 0)
log('✅ 架构审计完成 - ' + archTotal + ' 个问题')

// Phase 5: 测试审计 (6 轮)
phase('测试审计')
log('🧪 启动测试审计 - 3 个代理并行执行 6 轮')

const testTasks = [
  { id: 16, name: '单元测试', files: 'internal/*_test.go' },
  { id: 17, name: '集成测试', files: 'tests/, internal/*_test.go' },
  { id: 18, name: '测试质量', files: 'internal/*_test.go' }
]

const testResults = await pipeline(
  testTasks,
  task => agent(
    '你是测试审计专家 - ' + task.name + '\n\n' +
    '第 1 轮审计\n\n' +
    '审计文件: backend/' + task.files + '\n\n' +
    '检查: 测试覆盖率, Mock使用, 测试隔离, 边界测试, 错误场景测试\n\n' +
    '返回发现的所有测试问题',
    { label: 'test-' + task.id + '-r1', phase: '测试审计', schema: FINDING_SCHEMA }
  ),
  (r1, task) => agent(
    '你是测试审计专家 - ' + task.name + '\n\n' +
    '第 2 轮深度审计\n\n' +
    '第1轮发现: ' + (r1 ? r1.summary.total : 0) + ' 个问题\n\n' +
    '现在检查: 覆盖盲点, 测试质量, 测试策略, 回归风险\n\n' +
    '返回新发现的问题',
    { label: 'test-' + task.id + '-r2', phase: '测试审计', schema: FINDING_SCHEMA }
  )
)

const testTotal = testResults.filter(Boolean).reduce((s, r) => s + (r.summary ? r.summary.total : 0), 0)
log('✅ 测试审计完成 - ' + testTotal + ' 个问题')

// Phase 6: 专项审计 (4 轮)
phase('专项审计')
log('🔬 启动专项审计 - 2 个代理并行执行 4 轮')

const specialTasks = [
  { id: 19, name: '并发安全', files: 'internal/, pkg/' },
  { id: 20, name: 'API设计', files: 'internal/api/handlers/, cmd/server/' }
]

const specialResults = await pipeline(
  specialTasks,
  task => agent(
    '你是专项审计专家 - ' + task.name + '\n\n' +
    '第 1 轮审计\n\n' +
    '审计文件: backend/' + task.files + '\n\n' +
    '检查: ' + (task.id === 19 ? '数据竞争, Goroutine安全, Channel使用, Mutex使用, Context传递' : 'RESTful规范, HTTP方法, 状态码, 响应格式, API版本') + '\n\n' +
    '返回发现的所有专项问题',
    { label: 'spec-' + task.id + '-r1', phase: '专项审计', schema: FINDING_SCHEMA }
  ),
  (r1, task) => agent(
    '你是专项审计专家 - ' + task.name + '\n\n' +
    '第 2 轮深度审计\n\n' +
    '第1轮发现: ' + (r1 ? r1.summary.total : 0) + ' 个问题\n\n' +
    '现在检查: ' + (task.id === 19 ? '复杂并发场景, 边缘并发条件, 并发测试' : 'API一致性, API文档, API演进策略') + '\n\n' +
    '返回新发现的问题',
    { label: 'spec-' + task.id + '-r2', phase: '专项审计', schema: FINDING_SCHEMA }
  )
)

const specTotal = specialResults.filter(Boolean).reduce((s, r) => s + (r.summary ? r.summary.total : 0), 0)
log('✅ 专项审计完成 - ' + specTotal + ' 个问题')

// Phase 7: 汇总分析
phase('汇总分析')
log('📊 开始汇总分析')

const allResults = [
  ...securityResults,
  ...perfResults,
  ...qualityResults,
  ...archResults,
  ...testResults,
  ...specialResults
].filter(Boolean)

const allFindings = allResults.flatMap(r => r.findings || [])
const totalCount = allFindings.length
const critCount = allFindings.filter(f => f.severity === 'CRITICAL').length
const highCount = allFindings.filter(f => f.severity === 'HIGH').length
const medCount = allFindings.filter(f => f.severity === 'MEDIUM').length
const lowCount = allFindings.filter(f => f.severity === 'LOW').length

log('📊 40 轮审计完成！\n\n' +
    '总体统计:\n' +
    '- 审计轮次: 40 轮\n' +
    '- 审计代理: 20 个\n' +
    '- 发现问题: ' + totalCount + ' 个\n\n' +
    '严重程度:\n' +
    '- CRITICAL: ' + critCount + ' 个\n' +
    '- HIGH: ' + highCount + ' 个\n' +
    '- MEDIUM: ' + medCount + ' 个\n' +
    '- LOW: ' + lowCount + ' 个\n\n' +
    '分类统计:\n' +
    '- 安全问题: ' + secTotal + ' 个\n' +
    '- 性能问题: ' + perfTotal + ' 个\n' +
    '- 质量问题: ' + qualTotal + ' 个\n' +
    '- 架构问题: ' + archTotal + ' 个\n' +
    '- 测试问题: ' + testTotal + ' 个\n' +
    '- 专项问题: ' + specTotal + ' 个')

return {
  meta: {
    auditDate: new Date().toISOString(),
    totalRounds: 40,
    totalAgents: 20,
    totalFindings: totalCount,
    severity: { critical: critCount, high: highCount, medium: medCount, low: lowCount }
  },
  findings: allFindings,
  summary: {
    security: secTotal,
    performance: perfTotal,
    quality: qualTotal,
    architecture: archTotal,
    test: testTotal,
    special: specTotal
  },
  topCritical: allFindings.filter(f => f.severity === 'CRITICAL').slice(0, 10),
  topHigh: allFindings.filter(f => f.severity === 'HIGH').slice(0, 20)
}
