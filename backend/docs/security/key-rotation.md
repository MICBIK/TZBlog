# 密钥轮换流程

**最后更新**: 2026-06-17  
**维护者**: TZBlog Team

---

## 概述

定期轮换密钥是安全最佳实践，可以：
- 限制密钥泄露的影响窗口
- 符合合规要求（PCI-DSS, SOC2）
- 降低长期暴露风险

---

## 轮换计划

### 轮换周期

| 密钥类型 | 轮换周期 | 优先级 | 影响范围 |
|---------|---------|--------|---------|
| JWT_SECRET | 90 天 | P0 | 所有用户需要重新登录 |
| DB_PASSWORD | 180 天 | P0 | 服务短暂中断（<1 分钟）|
| REDIS_PASSWORD | 180 天 | P1 | 缓存失效，性能短暂下降 |
| R2 密钥 | 365 天 | P1 | 无影响（支持多密钥）|

### 提前通知

| 时间点 | 动作 |
|--------|------|
| 轮换前 30 天 | 团队通知，准备轮换计划 |
| 轮换前 7 天 | 最终确认，准备回滚方案 |
| 轮换前 1 天 | 备份当前配置，通知用户 |
| 轮换中 | 执行轮换，监控指标 |
| 轮换后 24 小时 | 验证成功，清理旧密钥 |

---

## JWT_SECRET 轮换

### 影响评估

- ✅ **影响**: 所有用户需要重新登录
- ⏱️ **停机时间**: 无（支持平滑轮换）
- 🔄 **回滚难度**: 低

### 方案 A: 平滑轮换（推荐）

**原理**: 同时支持新旧两个密钥，逐步淘汰旧密钥

#### Step 1: 准备阶段

```bash
# 1. 生成新密钥
NEW_JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo "新密钥: $NEW_JWT_SECRET"

# 2. 记录旧密钥
OLD_JWT_SECRET=$(grep JWT_SECRET .env.production | cut -d= -f2)
echo "旧密钥: $OLD_JWT_SECRET"

# 3. 备份配置
cp .env.production .env.production.backup.$(date +%Y%m%d)
```

#### Step 2: 部署双密钥支持

**修改代码** (临时):

```go
// internal/middleware/auth.go

var (
    currentSecret = os.Getenv("JWT_SECRET")
    oldSecret     = os.Getenv("JWT_SECRET_OLD") // 新增
)

func validateToken(tokenString string) (*Claims, error) {
    // 先用新密钥验证
    claims, err := parseToken(tokenString, currentSecret)
    if err == nil {
        return claims, nil
    }
    
    // 失败则用旧密钥验证
    if oldSecret != "" {
        claims, err = parseToken(tokenString, oldSecret)
        if err == nil {
            log.Info("使用旧密钥验证成功，建议用户重新登录")
            return claims, nil
        }
    }
    
    return nil, err
}
```

#### Step 3: 轮换执行

```bash
# 1. 设置双密钥配置
cat >> .env.production << EOF
JWT_SECRET=$NEW_JWT_SECRET
JWT_SECRET_OLD=$OLD_JWT_SECRET
EOF

# 2. 重启服务
systemctl restart tzblog

# 3. 验证服务正常
curl https://api.example.com/health
```

#### Step 4: 观察期（7 天）

```bash
# 监控旧密钥使用情况
grep "使用旧密钥验证成功" /var/log/tzblog/app.log | wc -l

# 如果使用次数持续下降，说明用户逐步重新登录
```

#### Step 5: 清理旧密钥

```bash
# 7 天后，移除旧密钥配置
sed -i '/JWT_SECRET_OLD/d' .env.production

# 移除代码中的双密钥支持
git revert <commit>

# 重启服务
systemctl restart tzblog
```

### 方案 B: 快速轮换（停机轮换）

**原理**: 直接替换密钥，所有用户立即失效

#### 执行步骤

```bash
# 1. 生成新密钥
NEW_JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')

# 2. 备份配置
cp .env.production .env.production.backup.$(date +%Y%m%d)

# 3. 更新配置
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env.production

# 4. 重启服务
systemctl restart tzblog

# 5. 清空 Redis 会话缓存（强制所有用户登出）
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD FLUSHDB
```

#### 用户通知

```
【维护通知】
我们将于 2026-06-20 02:00 UTC 轮换安全密钥。
届时所有用户将被登出，请重新登录。
预计影响时间：5 分钟
```

---

## DB_PASSWORD 轮换

### 影响评估

- ✅ **影响**: 服务短暂中断（<1 分钟）
- ⏱️ **停机时间**: 30-60 秒
- 🔄 **回滚难度**: 低

### 执行步骤

#### Step 1: 准备阶段

```bash
# 1. 生成新密码
NEW_DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
echo "新密码: $NEW_DB_PASSWORD"

# 2. 备份配置
cp .env.production .env.production.backup.$(date +%Y%m%d)

# 3. 测试数据库连接
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"
```

#### Step 2: 数据库端轮换

```sql
-- 1. 连接到数据库
psql -h $DB_HOST -U postgres -d postgres

-- 2. 修改用户密码
ALTER USER tzblog_prod WITH PASSWORD 'NEW_DB_PASSWORD';

-- 3. 验证修改成功
\du tzblog_prod
```

#### Step 3: 应用端轮换

```bash
# 1. 更新配置文件
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASSWORD/" .env.production

# 2. 重启服务
systemctl restart tzblog

# 3. 验证服务正常
curl https://api.example.com/health

# 4. 检查数据库连接
tail -f /var/log/tzblog/app.log | grep "database"
```

#### Step 4: 回滚方案（如果失败）

```bash
# 1. 恢复旧配置
cp .env.production.backup.$(date +%Y%m%d) .env.production

# 2. 数据库恢复旧密码
psql -h $DB_HOST -U postgres -d postgres -c "ALTER USER tzblog_prod WITH PASSWORD 'OLD_DB_PASSWORD';"

# 3. 重启服务
systemctl restart tzblog
```

---

## REDIS_PASSWORD 轮换

### 影响评估

- ✅ **影响**: 缓存失效，性能短暂下降
- ⏱️ **停机时间**: 无（Redis 重启 <5 秒）
- 🔄 **回滚难度**: 低

### 执行步骤

#### Step 1: 准备阶段

```bash
# 1. 生成新密码
NEW_REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '\n')
echo "新密码: $NEW_REDIS_PASSWORD"

# 2. 备份配置
cp .env.production .env.production.backup.$(date +%Y%m%d)

# 3. 测试 Redis 连接
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD PING
```

#### Step 2: Redis 端轮换

```bash
# 1. 连接到 Redis
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD

# 2. 修改密码（临时，重启后失效）
CONFIG SET requirepass "$NEW_REDIS_PASSWORD"

# 3. 测试新密码
redis-cli -h $REDIS_HOST -a $NEW_REDIS_PASSWORD PING

# 4. 更新 redis.conf（永久生效）
ssh redis-server
sudo sed -i "s/^requirepass .*/requirepass $NEW_REDIS_PASSWORD/" /etc/redis/redis.conf

# 5. 重启 Redis
sudo systemctl restart redis
```

#### Step 3: 应用端轮换

```bash
# 1. 更新配置文件
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$NEW_REDIS_PASSWORD/" .env.production

# 2. 重启服务
systemctl restart tzblog

# 3. 验证服务正常
curl https://api.example.com/health

# 4. 检查 Redis 连接
tail -f /var/log/tzblog/app.log | grep "redis"
```

---

## R2 密钥轮换

### 影响评估

- ✅ **影响**: 无（Cloudflare 支持多密钥）
- ⏱️ **停机时间**: 无
- 🔄 **回滚难度**: 极低

### 执行步骤

#### Step 1: 生成新密钥

```bash
# 1. 登录 Cloudflare Dashboard
# 2. 进入 R2 -> Manage R2 API Tokens
# 3. 创建新的 API Token
# 4. 复制 Access Key ID 和 Secret Access Key
```

#### Step 2: 部署新密钥

```bash
# 1. 备份配置
cp .env.production .env.production.backup.$(date +%Y%m%d)

# 2. 更新配置
cat >> .env.production << EOF
CLOUDFLARE_ACCESS_KEY_ID=<new_access_key_id>
CLOUDFLARE_SECRET_ACCESS_KEY=<new_secret_access_key>
EOF

# 3. 重启服务
systemctl restart tzblog

# 4. 验证上传功能
curl -X POST https://api.example.com/api/v1/uploads/presign \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Step 3: 清理旧密钥

```bash
# 30 天后，删除旧密钥
# 1. 登录 Cloudflare Dashboard
# 2. 进入 R2 -> Manage R2 API Tokens
# 3. 删除旧的 API Token
```

---

## 自动化脚本

### 密钥轮换脚本

**文件**: `scripts/rotate-secrets.sh`

```bash
#!/bin/bash
set -euo pipefail

# 密钥轮换脚本
# 用法: ./rotate-secrets.sh <secret_type>
# 示例: ./rotate-secrets.sh jwt

SECRET_TYPE="${1:-}"
BACKUP_DIR="/var/backups/tzblog"
ENV_FILE="/opt/tzblog/.env.production"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查权限
if [[ $EUID -ne 0 ]]; then
   log_error "此脚本必须以 root 权限运行"
   exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份当前配置
backup_config() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/env.production.$timestamp"
    
    log_info "备份当前配置到: $backup_file"
    cp "$ENV_FILE" "$backup_file"
    chmod 600 "$backup_file"
}

# 轮换 JWT_SECRET
rotate_jwt() {
    log_info "开始轮换 JWT_SECRET..."
    
    # 生成新密钥
    NEW_JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
    
    # 备份
    backup_config
    
    # 更新配置
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" "$ENV_FILE"
    
    # 重启服务
    log_info "重启服务..."
    systemctl restart tzblog
    
    # 验证
    sleep 5
    if systemctl is-active --quiet tzblog; then
        log_info "JWT_SECRET 轮换成功"
    else
        log_error "服务启动失败，请检查日志"
        exit 1
    fi
}

# 轮换 DB_PASSWORD
rotate_db() {
    log_info "开始轮换 DB_PASSWORD..."
    
    # 生成新密码
    NEW_DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
    
    # 获取数据库配置
    DB_HOST=$(grep DB_HOST "$ENV_FILE" | cut -d= -f2)
    DB_USER=$(grep DB_USER "$ENV_FILE" | cut -d= -f2)
    
    # 备份
    backup_config
    
    # 数据库端轮换
    log_info "更新数据库密码..."
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOST" -U postgres -d postgres \
        -c "ALTER USER $DB_USER WITH PASSWORD '$NEW_DB_PASSWORD';"
    
    # 应用端轮换
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASSWORD/" "$ENV_FILE"
    
    # 重启服务
    log_info "重启服务..."
    systemctl restart tzblog
    
    # 验证
    sleep 5
    if systemctl is-active --quiet tzblog; then
        log_info "DB_PASSWORD 轮换成功"
    else
        log_error "服务启动失败，正在回滚..."
        rollback
        exit 1
    fi
}

# 回滚
rollback() {
    log_warn "执行回滚..."
    local latest_backup=$(ls -t "$BACKUP_DIR"/env.production.* | head -1)
    cp "$latest_backup" "$ENV_FILE"
    systemctl restart tzblog
    log_info "回滚完成"
}

# 主逻辑
case "$SECRET_TYPE" in
    jwt)
        rotate_jwt
        ;;
    db)
        rotate_db
        ;;
    *)
        log_error "未知的密钥类型: $SECRET_TYPE"
        echo "用法: $0 <jwt|db|redis|r2>"
        exit 1
        ;;
esac

log_info "密钥轮换完成"
```

### 使用方式

```bash
# 赋予执行权限
chmod +x scripts/rotate-secrets.sh

# 轮换 JWT_SECRET
sudo ./scripts/rotate-secrets.sh jwt

# 轮换 DB_PASSWORD
sudo ./scripts/rotate-secrets.sh db
```

---

## 监控与告警

### 密钥过期监控

**文件**: `scripts/check-secret-age.sh`

```bash
#!/bin/bash

# 检查密钥年龄
# 用法: ./check-secret-age.sh

# 密钥最后轮换时间（存储在文件中）
SECRET_AGE_FILE="/var/lib/tzblog/secret-age.json"

# 检查 JWT_SECRET 年龄
jwt_rotated_at=$(jq -r '.jwt_secret_rotated_at' "$SECRET_AGE_FILE")
jwt_age_days=$(( ($(date +%s) - $(date -d "$jwt_rotated_at" +%s)) / 86400 ))

if [ "$jwt_age_days" -gt 80 ]; then
    echo "⚠️  WARNING: JWT_SECRET 已 $jwt_age_days 天未轮换（建议: 90 天）"
fi

if [ "$jwt_age_days" -gt 90 ]; then
    echo "🚨 CRITICAL: JWT_SECRET 已超过 90 天未轮换！"
fi
```

### Cron 任务

```bash
# 添加到 crontab
crontab -e

# 每天检查密钥年龄
0 9 * * * /opt/tzblog/scripts/check-secret-age.sh | mail -s "密钥年龄检查" admin@example.com
```

---

## 应急响应

### 密钥泄露处理

如果密钥泄露（如 Git 提交、日志泄露、内部泄露），**立即**执行：

#### 阶段 1: 隔离（0-15 分钟）

```bash
# 1. 立即轮换受影响的密钥
sudo ./scripts/rotate-secrets.sh <secret_type>

# 2. 清空所有会话（如果是 JWT_SECRET）
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD FLUSHDB

# 3. 通知团队
# 发送紧急通知邮件

# 4. 临时限制访问（如果必要）
# 启用 IP 白名单或临时关闭服务
```

#### 阶段 2: 审计（15 分钟 - 24 小时）

```bash
# 1. 检查访问日志
grep "401\|403" /var/log/tzblog/app.log | tail -100

# 2. 查找异常访问
# 查找可疑 IP、异常时间段、大量失败请求

# 3. 数据库审计
# 检查是否有未授权的数据访问或修改

# 4. 生成事件报告
```

#### 阶段 3: 修复（1-7 天）

```bash
# 1. 修复泄露原因
# - 如果是 Git 提交：BFG Repo-Cleaner 清理历史
# - 如果是日志泄露：修改日志配置，脱敏密钥
# - 如果是内部泄露：加强访问控制

# 2. 加强监控
# - 添加密钥使用监控
# - 添加异常访问告警

# 3. 团队培训
# - 安全意识培训
# - 密钥管理最佳实践
```

### Git 历史清理（密钥已提交）

```bash
# 1. 安装 BFG Repo-Cleaner
brew install bfg

# 2. 克隆仓库
git clone --mirror https://github.com/MICBIK/TZBlog.git

# 3. 删除包含密钥的文件
bfg --delete-files .env.production TZBlog.git

# 4. 清理引用
cd TZBlog.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. 强制推送（⚠️ 危险操作）
git push --force

# 6. 通知团队重新克隆
```

---

## 检查清单

### 轮换前检查

- [ ] 已通知团队
- [ ] 已准备回滚方案
- [ ] 已备份当前配置
- [ ] 已生成新密钥
- [ ] 已在测试环境验证

### 轮换中检查

- [ ] 配置文件已更新
- [ ] 服务已重启
- [ ] 服务状态正常
- [ ] 健康检查通过
- [ ] 日志无错误

### 轮换后检查

- [ ] 监控指标正常
- [ ] 用户功能正常
- [ ] 24 小时观察期
- [ ] 更新轮换记录
- [ ] 清理临时文件

---

## 参考资料

- [NIST SP 800-57](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final) - 密钥管理建议
- [AWS Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [HashiCorp Vault Rotation](https://www.vaultproject.io/docs/secrets/databases/postgresql#setup)

---

**文档版本**: 1.0  
**最后更新**: 2026-06-17  
**维护者**: TZBlog Team  
**反馈**: 如有问题请提交 Issue
