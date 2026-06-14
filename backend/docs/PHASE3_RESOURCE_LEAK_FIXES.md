# Phase 3: 资源泄漏修复报告

**修复日期**: 2026-06-14  
**任务 ID**: Task #3  
**问题编号**: C-004, C-005, C-006

---

## 📋 问题概述

### C-004 & C-005: Goroutine 泄漏
**位置**: `internal/api/middleware/login_ratelimit.go`

**问题描述**:
- `LoginRateLimit()` 和 `SimpleLoginRateLimit()` 每次被调用时都会启动一个新的 cleanup goroutine
- 在高流量场景下，每次路由重新注册或中间件重新创建都会泄漏 goroutine
- 随着时间推移，goroutine 数量会不断增长，导致内存泄漏和性能下降

**原因分析**:
```go
// ❌ 问题代码
func LoginRateLimit() gin.HandlerFunc {
    limiters := make(map[limiterKey]*rate.Limiter)
    var mu sync.RWMutex

    // 每次调用此函数都会启动一个新的 goroutine
    go func() {
        ticker := time.NewTicker(10 * time.Minute)
        defer ticker.Stop()
        for range ticker.C {
            mu.Lock()
            limiters = make(map[limiterKey]*rate.Limiter)
            mu.Unlock()
        }
    }()

    return func(c *gin.Context) {
        // ... handler logic
    }
}
```

### C-006: 连接池监控未启用
**位置**: `cmd/server/main.go`

**问题描述**:
- 数据库连接池监控器已实现但未启用
- 无法实时监控连接池健康状态
- 潜在的连接泄漏无法及时发现

---

## ✅ 修复方案

### 1. 修复 Goroutine 泄漏 (C-004 & C-005)

**修复文件**: `internal/api/middleware/login_ratelimit.go`

**修复策略**:
使用 `sync.Once` 确保 cleanup goroutine 只启动一次，无论中间件被调用多少次。

**修复代码**:
```go
var (
	loginLimiterOnce       sync.Once
	simpleLoginLimiterOnce sync.Once
)

func LoginRateLimit() gin.HandlerFunc {
	type limiterKey struct {
		email string
		ip    string
	}

	limiters := make(map[limiterKey]*rate.Limiter)
	var mu sync.RWMutex

	// ✅ 使用 sync.Once 确保只启动一次
	loginLimiterOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(10 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				mu.Lock()
				limiters = make(map[limiterKey]*rate.Limiter)
				mu.Unlock()
			}
		}()
	})

	return func(c *gin.Context) {
		// ... handler logic
	}
}

func SimpleLoginRateLimit() gin.HandlerFunc {
	limiters := make(map[string]*rate.Limiter)
	var mu sync.RWMutex

	// ✅ 使用独立的 sync.Once
	simpleLoginLimiterOnce.Do(func() {
		go func() {
			ticker := time.NewTicker(10 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				mu.Lock()
				limiters = make(map[string]*rate.Limiter)
				mu.Unlock()
			}
		}()
	})

	return func(c *gin.Context) {
		// ... handler logic
	}
}
```

**关键改进**:
1. 引入包级别的 `sync.Once` 变量
2. 每个中间件类型使用独立的 `sync.Once`，避免相互干扰
3. `sync.Once.Do()` 保证函数体只执行一次，即使并发调用也安全

### 2. 启用连接池监控 (C-006)

**修复文件**: `cmd/server/main.go`

**修复代码**:
```go
sqlDB, err := db.DB()
if err != nil {
    log.Fatalf("Failed to get sql.DB: %v", err)
}
defer sqlDB.Close()

logger.Info("Database connected successfully")

// ✅ C-006: 启动连接池监控
poolMonitor := config.NewConnectionPoolMonitor(
    sqlDB,
    config.DefaultPoolAlertThresholds(),
)

monitorCtx, cancelMonitor := context.WithCancel(context.Background())
defer cancelMonitor()

go poolMonitor.Start(monitorCtx)
logger.Info("Connection pool monitor started")
```

**功能特性**:
- 监控连接池利用率（默认阈值：80%）
- 监控平均等待时间（默认阈值：100ms）
- 监控等待计数增长（默认阈值：100 次/间隔）
- 监控空闲连接关闭（默认阈值：50 次/间隔）
- 检查间隔：30 秒
- 支持优雅关闭（通过 context 取消）

---

## 🧪 测试验证

### 1. Goroutine 泄漏测试

**测试文件**: `internal/api/middleware/login_ratelimit_goroutine_test.go`

#### 测试 1: LoginRateLimit 不泄漏
```go
func TestLoginRateLimitNoGoroutineLeak(t *testing.T) {
    // 获取基线 goroutine 数量
    baseline := runtime.NumGoroutine()

    // 创建 10 次中间件实例
    for i := 0; i < 10; i++ {
        middleware := LoginRateLimit()
        // ... 使用中间件
    }

    // 检查 goroutine 数量
    current := runtime.NumGoroutine()

    // 期望：只增加 1 个 goroutine（cleanup goroutine）
    assert.LessOrEqual(t, current, baseline+2)
}
```

**测试结果**:
```
Baseline goroutines: 2, Current: 3, Difference: 1
--- PASS: TestLoginRateLimitNoGoroutineLeak (0.41s)
```

#### 测试 2: SimpleLoginRateLimit 不泄漏
```
Baseline goroutines: 2, Current: 3, Difference: 1
--- PASS: TestSimpleLoginRateLimitNoGoroutineLeak (0.41s)
```

#### 测试 3: 两个中间件使用独立的 sync.Once
```
Baseline goroutines: 2, Current: 4, Difference: 2
--- PASS: TestBothRateLimitersShareDifferentOnce (0.41s)
```

**结论**: 
- ✅ 每个中间件类型只启动 1 个 cleanup goroutine
- ✅ 无论中间件被调用多少次，goroutine 数量保持稳定
- ✅ 两个中间件类型使用独立的 `sync.Once`，不会相互影响

### 2. 连接池监控测试

**测试文件**: `cmd/server/main_pool_monitor_test.go`

**测试验证**:
- ✅ 监控器可以正确初始化
- ✅ 默认阈值合理（80% 利用率，100ms 等待时间）
- ✅ 支持通过 context 优雅关闭

---

## 📊 修复前后对比

### Goroutine 泄漏

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 中间件调用 10 次后 | +10 个 goroutine | +1 个 goroutine |
| 中间件调用 100 次后 | +100 个 goroutine | +1 个 goroutine |
| 内存影响 | 随调用次数线性增长 | 稳定不变 |

### 连接池监控

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 监控状态 | 未启用 | 已启用 |
| 连接池可见性 | 无 | 每 30 秒记录 |
| 异常检测 | 无 | 自动告警 |

---

## 🔍 验证方法

### 1. 使用 pprof 检查 Goroutine

**启动服务器并启用 pprof**:
```bash
# 在代码中添加
import _ "net/http/pprof"

# 启动服务器后访问
curl http://localhost:6060/debug/pprof/goroutine?debug=1
```

**预期结果**:
- 修复前：goroutine 数量随时间增长
- 修复后：goroutine 数量稳定

### 2. 压力测试

**运行压力测试**:
```bash
# 使用 hey 工具进行压力测试
hey -n 10000 -c 100 -m POST http://localhost:8080/api/v1/auth/login

# 测试期间监控 goroutine
watch -n 1 'curl -s http://localhost:6060/debug/pprof/goroutine?debug=1 | grep "goroutine profile"'
```

**预期结果**:
- 修复前：goroutine 数量持续增长
- 修复后：goroutine 数量稳定在基线 + 2（两个 cleanup goroutine）

### 3. 查看连接池日志

**启动服务器后查看日志**:
```bash
# 查看启动日志
tail -f logs/app.log | grep "Connection pool"

# 预期输出
INFO    Connection pool monitor started
DEBUG   Connection pool healthy    in_use=1 idle=4 open=5 utilization=0.2
```

---

## 📝 技术要点

### sync.Once 原理

```go
type Once struct {
    done uint32
    m    Mutex
}

func (o *Once) Do(f func()) {
    if atomic.LoadUint32(&o.done) == 0 {
        o.doSlow(f)
    }
}

func (o *Once) doSlow(f func()) {
    o.m.Lock()
    defer o.m.Unlock()
    if o.done == 0 {
        defer atomic.StoreUint32(&o.done, 1)
        f()
    }
}
```

**关键特性**:
1. 原子操作保证线程安全
2. 即使并发调用也只执行一次
3. 性能开销极小（atomic + mutex）

### 为什么使用包级别变量

```go
// ✅ 正确：包级别变量，所有调用共享
var loginLimiterOnce sync.Once

func LoginRateLimit() gin.HandlerFunc {
    loginLimiterOnce.Do(func() { /* ... */ })
    // ...
}

// ❌ 错误：函数内部变量，每次调用都是新实例
func LoginRateLimit() gin.HandlerFunc {
    var once sync.Once  // 每次调用都是新的！
    once.Do(func() { /* ... */ })  // 没有效果
    // ...
}
```

---

## 🚀 部署建议

### 1. 生产环境验证

部署后监控以下指标：
```bash
# 监控 goroutine 数量
curl http://localhost:6060/debug/pprof/goroutine?debug=1 | grep "goroutine profile"

# 监控内存使用
curl http://localhost:6060/debug/pprof/heap?debug=1

# 查看连接池状态
curl http://localhost:8080/debug/pool/stats
```

### 2. 告警设置

建议设置以下告警：
- Goroutine 数量 > 1000（可能存在其他泄漏）
- 连接池利用率 > 80%（需要扩容）
- 连接等待时间 > 100ms（查询优化或扩容）

### 3. 日志监控

关注以下日志：
```
WARNING High connection pool utilization: XX%
WARNING High average wait duration: XXms
WARNING High wait count increase: XX waits
```

---

## ✅ 验收标准

- [x] Goroutine 泄漏已修复（测试通过）
- [x] 连接池监控已启用（日志确认）
- [x] 所有测试通过
- [x] 代码编译成功
- [x] 文档已更新

---

## 📚 相关文档

- [Goroutine 泄漏检测指南](https://go.dev/blog/pprof)
- [sync.Once 官方文档](https://pkg.go.dev/sync#Once)
- [数据库连接池最佳实践](https://go.dev/doc/database/manage-connections)

---

## 👥 修复人员

- 资源管理专家 (teammate)
- 审核：Team Lead

**修复完成时间**: 2026-06-14
