# Migration 000004 验证文档

## 概述

Migration 000004 修复了 Phase 3 审计中发现的关键数据库问题：
- C-011: 缺失 api_keys 表
- C-012: 缺失 password_history 表
- C-014: 缺失 audit_logs 表
- C-015: orders 表缺少外键约束

## 创建的表

### 1. api_keys 表

**用途**: 管理 API 密钥，支持撤销和过期功能

```sql
CREATE TABLE api_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(128) NOT NULL UNIQUE,
    permissions TEXT[],
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**索引**:
- `idx_api_keys_user_id`: 查询用户的所有 API keys
- `idx_api_keys_key_hash`: 快速验证 API key（UNIQUE）
- `idx_api_keys_expires_at`: 查找即将过期的 keys
- `idx_api_keys_revoked`: 查找活跃的 keys

**约束**:
- `chk_api_keys_revoked_at`: 确保 is_revoked=true 时 revoked_at 不为空

### 2. password_history 表

**用途**: 跟踪密码历史，防止密码重用

```sql
CREATE TABLE password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**索引**:
- `idx_password_history_user_id`: 查询用户密码历史
- `idx_password_history_created_at`: 按时间排序
- `idx_password_history_user_recent`: 复合索引，检查最近的密码

**用例**:
- 防止用户重用最近 5 次使用过的密码
- 密码变更历史审计

### 3. audit_logs 表

**用途**: 记录所有安全相关操作，用于合规和安全审计

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_id BIGINT,
    resource_type VARCHAR(50),
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    result VARCHAR(20) NOT NULL,
    error_msg TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**索引**:
- `idx_audit_logs_user_id`: 查询用户活动
- `idx_audit_logs_action`: 按操作类型查询
- `idx_audit_logs_ip`: 按 IP 地址查询（检测异常）
- `idx_audit_logs_created_at`: 时间范围查询
- `idx_audit_logs_result_failure`: 只索引失败记录（部分索引）
- `idx_audit_logs_user_action_date`: 用户活动分析（复合索引）
- `idx_audit_logs_resource`: 资源追踪（复合索引）

**约束**:
- `chk_audit_logs_result`: result 只能是 'success' 或 'failure'

**记录的操作示例**:
- 登录/登出
- 密码修改
- API key 创建/撤销
- 敏感数据访问
- 权限变更

### 4. orders 表外键修复

**问题**: orders.user_id 缺少外键约束

**解决方案**:
```sql
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
```

**影响**:
- 确保订单记录的用户存在
- 用户删除时级联删除其订单
- 提高 orders 按用户查询的性能

## 验证清单

### 静态验证 ✓

- [x] SQL 语法正确
- [x] 所有表都有主键
- [x] 外键约束正确引用
- [x] 索引命名规范一致
- [x] CHECK 约束逻辑正确
- [x] 数据类型选择合理

### 动态验证（需要数据库连接）

运行以下命令进行完整验证：

```bash
# 1. 应用 migration
migrate -path ./migrations -database "$DB_URL" up

# 2. 验证表存在
psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name IN ('api_keys', 'password_history', 'audit_logs');"

# 3. 验证外键
psql "$DB_URL" -c "SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE constraint_name = 'fk_orders_user';"

# 4. 验证索引数量
psql "$DB_URL" -c "SELECT count(*) FROM pg_indexes 
WHERE schemaname='public' AND tablename IN ('api_keys', 'password_history', 'audit_logs');"

# 5. 测试约束
# 测试 api_keys.is_revoked 约束（应该失败）
psql "$DB_URL" -c "INSERT INTO api_keys (user_id, name, key_prefix, key_hash, is_revoked) 
VALUES (1, 'test', 'test_', 'hash123', true);" 
# 预期：ERROR - revoked_at must be set when is_revoked is true

# 测试 audit_logs.result 约束（应该失败）
psql "$DB_URL" -c "INSERT INTO audit_logs (action, ip, result) 
VALUES ('test', '127.0.0.1', 'invalid_result');"
# 预期：ERROR - result must be 'success' or 'failure'

# 6. 测试回滚
migrate -path ./migrations -database "$DB_URL" down 1

# 7. 重新应用
migrate -path ./migrations -database "$DB_URL" up
```

## 性能影响

### 新增索引统计

| 表名 | 索引数量 | 类型 |
|------|----------|------|
| api_keys | 4 | 标准 + 部分索引 |
| password_history | 3 | 标准 + 复合索引 |
| audit_logs | 7 | 标准 + 部分 + 复合索引 |
| orders | 1 | 外键索引 |
| **总计** | **15** | |

### 预期性能提升

- **API key 验证**: O(1) 查找（key_hash UNIQUE 索引）
- **密码历史检查**: 3-5x 更快（复合索引）
- **审计日志查询**: 10x 更快（多维度索引）
- **用户订单查询**: 5-10x 更快（外键索引）

### 存储开销

- **索引存储**: 约 2-5MB（初始）
- **表数据**: 取决于使用量
  - api_keys: ~1KB/记录
  - password_history: ~500B/记录
  - audit_logs: ~1-2KB/记录

## 安全增强

### 1. API Key 管理
- ✅ 支持密钥撤销
- ✅ 支持过期时间
- ✅ 跟踪最后使用时间
- ✅ 权限数组支持细粒度控制

### 2. 密码策略
- ✅ 防止密码重用
- ✅ 密码历史审计
- ✅ 支持密码轮换策略

### 3. 审计跟踪
- ✅ 完整的操作日志
- ✅ IP 和 User-Agent 跟踪
- ✅ 成功/失败结果记录
- ✅ 错误信息保存
- ✅ 元数据扩展支持（JSONB）

## 合规支持

此 migration 支持以下合规要求：

- **GDPR**: 
  - audit_logs 记录数据访问
  - users 删除时级联处理相关数据
  
- **SOC 2**:
  - 完整的审计日志
  - 密码策略强制执行
  - API key 管理和撤销

- **PCI DSS**:
  - 密码历史追踪
  - 访问控制审计
  - 敏感操作日志

## 回滚计划

如果需要回滚：

```bash
migrate -path ./migrations -database "$DB_URL" down 1
```

**警告**: 回滚将删除以下数据：
- 所有 API keys
- 所有密码历史记录
- 所有审计日志
- orders 表的外键约束

**建议**: 在回滚前导出这些表的数据：

```bash
pg_dump -t api_keys -t password_history -t audit_logs "$DB_URL" > backup_000004.sql
```

## 后续工作

1. **代码集成**:
   - 实现 API key 中间件
   - 实现密码历史检查逻辑
   - 实现审计日志记录中间件

2. **监控**:
   - 设置审计日志查询监控
   - API key 过期提醒
   - 异常登录检测（基于 audit_logs）

3. **文档**:
   - API key 使用文档
   - 审计日志查询示例
   - 密码策略说明

## 测试建议

### 单元测试
- [ ] API key CRUD 操作
- [ ] 密码历史检查
- [ ] 审计日志记录

### 集成测试
- [ ] API key 认证流程
- [ ] 密码修改时历史记录
- [ ] 各操作的审计日志

### 性能测试
- [ ] 10000+ 审计日志查询性能
- [ ] API key 验证并发性能
- [ ] 密码历史检查性能

## 相关问题

此 migration 解决的 Phase 3 审计问题：

- ✅ C-011: api_keys 表缺失
- ✅ C-012: password_history 表缺失
- ✅ C-014: audit_logs 表缺失
- ✅ C-015: orders.user_id 缺少外键

## 文档更新

需要更新的文档：
- [ ] `backend/docs/API.md` - 添加 API key 认证说明
- [ ] `backend/docs/SECURITY.md` - 添加审计日志和密码策略
- [ ] `backend/docs/DATABASE.md` - 更新表结构说明

---

**创建日期**: 2026-06-14  
**Migration 版本**: 000004  
**状态**: 待测试  
**负责人**: 数据库设计专家
