export const meta = {
  name: 'backend-quick-audit',
  description: '后端代码快速审计 - 5 个专业代理覆盖核心维度',
  phases: [
    { title: '安全审计', detail: '检查 OWASP Top 10 和认证授权' },
    { title: '性能审计', detail: '检查数据库查询和缓存策略' },
    { title: '代码质量', detail: '检查复杂度和错误处理' },
    { title: '架构审计', detail: '检查分层和依赖关系' },
    { title: '测试审计', detail: '检查测试覆盖率和质量' },
  ],
}

// 5 个专业审计代理配置
const AUDITS = [
  {
    id: 'security',
    phase: '安全审计',
    prompt: '作为安全专家，审计 backend/ 代码库的安全问题。\n\n重点检查：\n1. SQL 注入风险（是否使用参数化查询）\n2. XSS 漏洞（HTML 清理是否完整）\n3. 认证授权（JWT 验证、权限检查）\n4. 敏感数据处理（密码存储、日志脱敏）\n5. CSRF 防护\n6. 输入验证\n\n审计范围：\n- internal/api/handlers/*.go\n- internal/api/middleware/*.go\n- pkg/auth/*.go\n- internal/repository/postgres/*.go\n\n输出格式：\n- 发现的问题列表（文件:行号 + 问题描述）\n- 严重程度：CRITICAL/HIGH/MEDIUM/LOW\n- 修复建议',
  },
  {
    id: 'performance',
    phase: '性能审计',
    prompt: '作为性能专家，审计 backend/ 代码库的性能问题。\n\n重点检查：\n1. N+1 查询问题\n2. 缺失的数据库索引\n3. Goroutine 泄漏风险\n4. 内存泄漏\n5. 缓存策略（是否合理使用 Redis）\n6. 连接池配置\n\n审计范围：\n- internal/repository/postgres/*.go\n- internal/service/*.go\n- internal/cache/*.go\n- cmd/server/main.go\n\n输出格式：\n- 发现的问题列表（文件:行号 + 问题描述）\n- 性能影响评估\n- 优化建议',
  },
  {
    id: 'quality',
    phase: '代码质量',
    prompt: '作为代码质量专家，审计 backend/ 代码库的质量问题。\n\n重点检查：\n1. 函数过长（>50 行）\n2. 文件过大（>800 行）\n3. 圈复杂度过高\n4. 深层嵌套（>4 层）\n5. 错误处理不完整\n6. 重复代码\n7. Magic numbers\n8. 命名不清晰\n\n审计范围：\n- internal/service/*.go\n- internal/api/handlers/*.go\n- internal/domain/**/*.go\n\n输出格式：\n- 发现的问题列表（文件:行号 + 问题描述）\n- 可维护性评分\n- 重构建议',
  },
  {
    id: 'architecture',
    phase: '架构审计',
    prompt: '作为架构专家，审计 backend/ 代码库的架构问题。\n\n重点检查：\n1. 分层是否清晰（Handler → Service → Domain → Repository）\n2. 依赖方向是否正确（向内依赖）\n3. 是否存在循环依赖\n4. 接口设计是否合理\n5. 模块职责是否单一\n6. 耦合度评估\n\n审计范围：\n- internal/ 完整目录结构\n- cmd/server/main.go\n- internal/domain/**/*.go\n\n输出格式：\n- 架构问题列表\n- 依赖关系图\n- 改进建议',
  },
  {
    id: 'testing',
    phase: '测试审计',
    prompt: '作为测试专家，审计 backend/ 代码库的测试问题。\n\n重点检查：\n1. 测试覆盖率（目标 70%+）\n2. 关键路径是否有测试\n3. 边界条件测试\n4. 错误场景测试\n5. Mock 使用是否正确\n6. 测试命名是否清晰\n\n审计范围：\n- internal/**/*_test.go\n- 测试覆盖率报告\n\n输出格式：\n- 未覆盖的关键代码\n- 测试质量评分\n- 改进建议',
  },
]

// JSON Schema for structured output
const AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    phase: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          issue: { type: 'string' },
          suggestion: { type: 'string' },
        },
        required: ['file', 'severity', 'issue', 'suggestion'],
      },
    },
    score: { type: 'number', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
  },
  required: ['phase', 'findings', 'score', 'summary'],
}

// 主执行流程
phase('安全审计')
const securityResult = await agent(AUDITS[0].prompt, {
  label: 'security-audit',
  phase: '安全审计',
  schema: AUDIT_SCHEMA,
})

phase('性能审计')
const performanceResult = await agent(AUDITS[1].prompt, {
  label: 'performance-audit',
  phase: '性能审计',
  schema: AUDIT_SCHEMA,
})

phase('代码质量')
const qualityResult = await agent(AUDITS[2].prompt, {
  label: 'quality-audit',
  phase: '代码质量',
  schema: AUDIT_SCHEMA,
})

phase('架构审计')
const architectureResult = await agent(AUDITS[3].prompt, {
  label: 'architecture-audit',
  phase: '架构审计',
  schema: AUDIT_SCHEMA,
})

phase('测试审计')
const testingResult = await agent(AUDITS[4].prompt, {
  label: 'testing-audit',
  phase: '测试审计',
  schema: AUDIT_SCHEMA,
})

// 汇总结果
const allResults = [
  securityResult,
  performanceResult,
  qualityResult,
  architectureResult,
  testingResult,
].filter(Boolean)

// 计算统计信息
const totalFindings = allResults.reduce((sum, r) => sum + (r.findings ? r.findings.length : 0), 0)
const criticalCount = allResults.reduce(
  (sum, r) => sum + (r.findings ? r.findings.filter(f => f.severity === 'CRITICAL').length : 0),
  0
)
const highCount = allResults.reduce(
  (sum, r) => sum + (r.findings ? r.findings.filter(f => f.severity === 'HIGH').length : 0),
  0
)
const avgScore = allResults.reduce((sum, r) => sum + (r.score || 0), 0) / allResults.length

// 返回汇总结果
return {
  timestamp: '2026-06-14',
  audits_completed: allResults.length,
  total_findings: totalFindings,
  critical_issues: criticalCount,
  high_issues: highCount,
  average_score: Math.round(avgScore),
  details: allResults,
  recommendation:
    criticalCount > 0
      ? '发现 CRITICAL 问题，建议立即修复'
      : highCount > 5
      ? '发现较多 HIGH 问题，建议优先修复'
      : '代码质量良好，可以继续开发',
}
