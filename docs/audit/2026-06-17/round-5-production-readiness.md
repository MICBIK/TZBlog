# Round 5 — 生产就绪

**评分**: 52/100（昨天 45） · **基线**: `main @ 9853c2a`（审计期间 prod-config / db-indexes / E2E 已合并入 main）

## 历史问题核实
| ID | 问题 | 状态 | 证据 |
|----|------|------|------|
| H-7 | JWT/密码强度与熵校验 | ✅ FIXED | `config/validation.go:84-205` 弱密钥黑名单+长度+Shannon 熵；对应测试全 PASS。逻辑质量高 |
| H-6 | 生产配置强校验 | ⚠️ PARTIAL | `validation.go` 已入 main、`config.go:38` Load 时调 Validate；但部署链路下根本不触发（见 BLOCKER-1） |
| M-9 | 生产级 Docker | ⚠️ PARTIAL | `Dockerfile.prod:4-39` 多阶段+静态+ldflags；但**无 USER（root 运行）**、容器层无 HEALTHCHECK |
| M-10 | CI/CD | ⚠️ PARTIAL | `backend-ci.yml` 完整（vet+test -race+coverage+build）；但前端 CI 无测试、Go 版本不匹配（见 HIGH） |

## 新发现
### 🔴 BLOCKER（已主流程亲自验证）
- **BLOCKER-1 生产 env 无法注入配置** — `config.go:30` 仅 `v.AutomaticEnv()`，无 `SetEnvKeyReplacer`/`BindEnv`。Viper 对嵌套键不从 `DB_PASSWORD`/`JWT_SECRET`/`SERVER_MODE` 读取 → compose 注入的 env 被静默忽略 → 应用实读 `config.yaml`（`mode:development`/`password:tzblog`/`jwt.secret:"dev_secret_key_..."`/`sslmode:disable`）→ `IsProduction()=false` → **ValidateProduction 永不触发** + development CORS。整套生产安全校验被绕过。
  修复：`v.SetEnvKeyReplacer(strings.NewReplacer(".","_"))` + 各键显式 `BindEnv` 别名映射 + env 注入集成测试。
- **BLOCKER-2 config.yaml 烤进生产镜像** — `Dockerfile.prod:32` COPY config.yaml，`.dockerignore` 未排除 → 开发弱值固化进镜像且（叠加 B-1）无法用 env 纠正。
  修复：生产纯 env 驱动或挂载只读 config.production.yaml；config.yaml 加入 .dockerignore；mode 非 production 时 fail-fast。

### 🟠 HIGH
- **HIGH-6** `docker-compose.prod.yml:45` 路径/变量错 — 在 backend/ 下 `context:./backend` → `backend/backend/`；nginx/certbot 挂载目录不存在；R2 用 `R2_ACCOUNT_ID` 而配置期望 `CLOUDFLARE_ACCOUNT_ID`。
- **HIGH-7** 前端 CI 不跑测试 — `frontend-ci.yml:38` 只 lint/typecheck/build，14 测试无门禁。
- **HIGH-8** CI Go 版本不匹配 — `backend-ci.yml:50` `1.22` vs `go.mod:3` `1.25.0` vs `Dockerfile.prod:4` `1.25`。

### 🟡 / ⚪
- **MEDIUM** `backup.sh:9` 相对路径 `source ../.env` + 无 `set -o pipefail`（检查 gzip 而非 pg_dump 退出码）→ 可能静默产出空备份还报成功。
- **MEDIUM** 弱密码 `strings.Contains` 子串匹配（`validation.go:222`）→ 含 "root"/"qwerty" 子串的强随机密码被误拒、阻断启动。
- **LOW** 跟踪 junk：`backend/full_test.txt`、`backend/test_output.txt`、`frontend/PHASE4_*.md`、`frontend/VERIFICATION_NEEDED.md`。
- **LOW** `/health(main.go:419)` 静态探针不查依赖（真实检查在 `/ready`）；stale 分支 `feature/backend-phase1-3`(+22)、`feature/backend/quality-improvements-p2`(+6) 建议清理。

## 小结
校验代码已合并入 main 且质量高（熵/弱密钥/HTTPS/SSL/R2 强制齐全），但本轮核心结论是**部署链路断裂**：Viper 不读 env + config.yaml 烤进镜像，使整套生产校验在真实 `docker compose up` 下形同虚设——生产容器会以开发弱配置 + 宽松 CORS 启动。这是离"可生产"最远的一块，须优先修。
