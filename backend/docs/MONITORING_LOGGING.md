# 监控和日志系统

本文档描述 TZBlog 后端的监控和日志实现。

## 功能概览

### 1. 结构化日志 (Zap)

使用 `go.uber.org/zap` 提供高性能结构化日志。

**位置**: `pkg/logger/`

**功能**:
- 支持开发和生产环境配置
- 多级别日志: Debug, Info, Warn, Error, Fatal
- 结构化字段输出
- 自动添加调用者信息和堆栈跟踪

**使用示例**:

```go
import (
    "github.com/MICBIK/TZBlog/backend/pkg/logger"
    "go.uber.org/zap"
)

// 初始化
logger.Init("production")
defer logger.Sync()

// 记录日志
logger.Info("User logged in", 
    zap.String("user_id", "123"),
    zap.String("ip", "192.168.1.1"),
)

logger.Error("Failed to save article",
    zap.Error(err),
    zap.String("article_id", "456"),
)
```

### 2. 请求日志中间件

**位置**: `internal/api/middleware/logging.go`

**功能**:
- 自动记录所有 HTTP 请求
- 记录字段:
  - HTTP 方法和路径
  - 响应状态码
  - 请求耗时
  - 客户端 IP
  - User Agent
  - 用户 ID (如果已认证)
- 根据状态码自动选择日志级别
- Panic 恢复和记录

**使用示例**:

```go
r := gin.New()
r.Use(middleware.RecoveryLogger())
r.Use(middleware.RequestLogger())
```

**日志输出示例**:

```json
{
  "level": "info",
  "timestamp": "2026-06-14T13:45:22.820+0800",
  "msg": "Request completed",
  "method": "GET",
  "path": "/api/articles",
  "status": 200,
  "latency": "15ms",
  "client_ip": "192.168.1.1",
  "user_id": "user-123"
}
```

### 3. 慢查询监控

**位置**: `config/database.go`

**功能**:
- 自动检测慢查询 (>100ms)
- 记录 SQL 语句和执行时间
- 记录受影响的行数
- 自动记录数据库错误

**慢查询日志示例**:

```json
{
  "level": "warn",
  "timestamp": "2026-06-14T13:45:22.820+0800",
  "msg": "Slow query detected",
  "duration": "156ms",
  "sql": "SELECT * FROM articles WHERE status = 'published'",
  "rows": 1234
}
```

### 4. Prometheus 指标

**位置**: `internal/api/middleware/metrics.go`

**功能**:
- HTTP 请求总数 (按方法、路径、状态码)
- HTTP 请求响应时间 (直方图)
- HTTP 请求大小 (直方图)
- HTTP 响应大小 (直方图)
- 活跃请求数 (实时)

**指标说明**:

| 指标名称 | 类型 | 说明 |
|---------|------|------|
| `http_requests_total` | Counter | HTTP 请求总数 |
| `http_request_duration_milliseconds` | Histogram | 请求响应时间 (毫秒) |
| `http_request_size_bytes` | Histogram | 请求大小 (字节) |
| `http_response_size_bytes` | Histogram | 响应大小 (字节) |
| `http_requests_in_flight` | Gauge | 当前活跃请求数 |

**使用示例**:

```go
r := gin.New()
r.Use(middleware.Metrics())

// Prometheus 抓取端点
r.GET("/metrics", gin.WrapH(promhttp.Handler()))
```

**Prometheus 配置**:

```yaml
scrape_configs:
  - job_name: 'tzblog-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### 5. 健康检查端点

**位置**: `internal/api/handlers/health_handler.go`

**端点**:

#### `GET /health`
简单健康检查，始终返回 200。

```json
{
  "status": "ok",
  "time": 1718347522
}
```

#### `GET /health/ready`
就绪检查，检查依赖服务 (数据库、Redis)。

```json
{
  "ready": true,
  "time": 1718347522,
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

失败时返回 503:

```json
{
  "ready": false,
  "time": 1718347522,
  "checks": {
    "database": "error: connection refused",
    "redis": "ok"
  }
}
```

#### `GET /health/live`
存活检查 (用于 Kubernetes liveness probe)。

```json
{
  "alive": true,
  "time": 1718347522
}
```

## 集成示例

参考 `examples/monitoring_demo/main.go`:

```go
package main

import (
    "github.com/MICBIK/TZBlog/backend/internal/api/middleware"
    "github.com/MICBIK/TZBlog/backend/pkg/logger"
    "github.com/gin-gonic/gin"
)

func main() {
    // 1. 初始化日志
    logger.Init("production")
    defer logger.Sync()

    // 2. 设置 Gin
    r := gin.New()

    // 3. 注册中间件
    r.Use(middleware.RecoveryLogger())
    r.Use(middleware.RequestLogger())
    r.Use(middleware.Metrics())

    // 4. 注册健康检查
    healthHandler := handlers.NewHealthHandlerWithDeps(db, redis)
    r.GET("/health", healthHandler.HealthCheck)
    r.GET("/health/ready", healthHandler.Readiness)

    // 5. 注册 Prometheus 端点
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))

    // 6. 启动服务
    r.Run(":8080")
}
```

## 环境变量

```bash
# 日志
APP_ENV=production  # development | production

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=tzblog

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=

# 服务器
PORT=8080
```

## Kubernetes 配置示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: tzblog-backend
spec:
  containers:
  - name: backend
    image: tzblog-backend:latest
    ports:
    - containerPort: 8080
    livenessProbe:
      httpGet:
        path: /health/live
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
```

## 监控仪表板

使用 Grafana 可视化 Prometheus 指标:

**常用查询**:

```promql
# 请求速率 (QPS)
rate(http_requests_total[5m])

# 平均响应时间
rate(http_request_duration_milliseconds_sum[5m]) / 
rate(http_request_duration_milliseconds_count[5m])

# P95 响应时间
histogram_quantile(0.95, 
  rate(http_request_duration_milliseconds_bucket[5m]))

# 错误率
sum(rate(http_requests_total{status=~"5.."}[5m])) /
sum(rate(http_requests_total[5m]))

# 活跃请求数
http_requests_in_flight
```

## 测试

运行测试:

```bash
# 测试日志
go test -v ./pkg/logger/...

# 测试中间件
go test -v ./internal/api/middleware/logging_test.go ./internal/api/middleware/logging.go
go test -v ./internal/api/middleware/metrics_test.go ./internal/api/middleware/metrics.go

# 运行示例程序
go run examples/monitoring_demo/main.go
```

## 性能考虑

1. **日志批量刷新**: Zap 自动批量刷新日志，降低 I/O 开销
2. **异步日志**: 生产环境使用异步日志以减少延迟
3. **采样**: 高流量场景可考虑日志采样
4. **指标基数**: 避免在指标标签中使用高基数字段 (如用户 ID)

## 故障排查

### 日志不输出
- 检查日志级别配置
- 确认 `logger.Init()` 已调用
- 检查文件权限

### 慢查询未记录
- 确认阈值设置 (默认 100ms)
- 检查数据库连接是否使用自定义 logger

### Prometheus 指标缺失
- 访问 `/metrics` 端点检查
- 确认 Prometheus 配置正确
- 检查防火墙规则

## 下一步

- [ ] 添加日志聚合 (ELK/Loki)
- [ ] 配置告警规则 (Alertmanager)
- [ ] 实现分布式追踪 (Jaeger)
- [ ] 添加应用性能监控 (APM)
