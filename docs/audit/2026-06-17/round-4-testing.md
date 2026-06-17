# Round 4 — 测试覆盖与质量

**评分**: 62/100（昨天 35） · **基线**: `main @ 9853c2a`

## 历史问题核实
| ID | 问题 | 状态 | 证据 |
|----|------|------|------|
| M-4 | 缺 E2E | ✅ FIXED | `playwright.config.ts` testDir=./e2e/tests，6 浏览器矩阵，webServer 自动起 dev；8 spec 覆盖登录/注册/文章/首页/搜索/错误/视觉 |
| B-4 | 前端 0% 测试 | ⚠️ PARTIAL | 已有 6 单测 + 8 e2e；但 `coverage/index.html` 报 95.34% 是 v8 只统计被 import 的 7 文件造成的假高值，真实业务覆盖 ~6%（7/120 源文件） |

后端补充事实：实测 `go test -cover ./internal/service/ ./internal/api/handlers/` = **service 67.3% / handlers 66.4%**（远高于过期报告称的 40.5%），全 30 包 PASS，search/seo 构建问题已解决。

## 新发现
- **HIGH-4** 前端覆盖率 95% 是假象 — `coverage-final.json` 仅含 7 文件（ui/badge,button,card + lib/api/client + constants + authStore + utils）；app 50 页面、components 非 ui 33 个、lib/api 5 模块零覆盖。`vitest.config.ts:24` 60% 阈值因未设 `all:true` 形同虚设。建议加 `coverage.all + include:['app/**','components/**','lib/**']` 暴露真实数字后再补测。
- **HIGH-5** E2E 条件断言 + try/catch 吞错（假绿）— `search.spec.ts:33-43`、`article.spec.ts:41-50`、`auth.spec.ts:58-94`：16 处 `if(count>0)` 包裹断言 + auth 10 处 try/catch，组件不渲染时测试照样 PASS。建议确定性断言（mock 数据已可控）+ 去 try/catch。
- **MEDIUM** E2E 登录/注册成功用例断言恒真 — `auth.spec.ts:39` `isOnHomePage = url.includes("/")`（任意 URL 恒真），`:41` `isLoggedIn || isOnHomePage`。核心鉴权未被有效校验。建议 `waitForURL` 具体目标 / 断言 token。
- **MEDIUM** 普遍 `waitForTimeout` 硬等待 — 12 处（auth/article/visual），CI 易 flaky，`config.ts:14` retries=2 掩盖间歇失败。建议事件驱动等待。
- **LOW** `setup.spec.ts:25-48` 两用例无断言只 console.log。
- **LOW** 后端 `TEST_COVERAGE_REPORT.md` 过期（称 40.5%，实测 67.3%），`:177` `$(date)` 未求值。

## 小结
相比昨天 35 分实质进步：E2E 落地、后端 service/handlers 实测 67%/66%、全包 PASS。但**测试信号误导性强**是主要扣分项：前端覆盖率假高（真实 ~6%）、E2E 条件断言/吞错使功能缺失也通过、前端测试还不在 CI 跑（见 Round 5 HIGH-7）。
