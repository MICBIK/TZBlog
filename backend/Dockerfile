# Stage 1: Builder
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . ./

# 构建
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o server ./cmd/server/

# Stage 2: Runtime
FROM alpine:3.19

# 创建非 root 用户
RUN addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser && \
    apk add --no-cache ca-certificates tzdata

WORKDIR /app

# 从 builder 复制二进制
COPY --from=builder /build/server ./
COPY --from=builder /build/config.example.yaml ./config.yaml

# 切换到非 root 用户
USER appuser

EXPOSE 8080

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./server"]
