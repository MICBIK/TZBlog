#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STATE_DIR="${TMPDIR:-/tmp}/tzblog-local-dev"
WEB_PID_FILE="$STATE_DIR/web.pid"
CMS_PID_FILE="$STATE_DIR/cms.pid"
WEB_LOG_FILE="$STATE_DIR/web.log"
CMS_LOG_FILE="$STATE_DIR/cms.log"

COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
WEB_PORT=4321
CMS_PORT=3000
DB_PORT=5432

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
  printf "%b[TZBlog]%b %s\n" "$CYAN" "$NC" "$1"
}

ok() {
  printf "%b[OK]%b %s\n" "$GREEN" "$NC" "$1"
}

warn() {
  printf "%b[WARN]%b %s\n" "$YELLOW" "$NC" "$1"
}

err() {
  printf "%b[ERR]%b %s\n" "$RED" "$NC" "$1" >&2
}

ensure_state_dir() {
  mkdir -p "$STATE_DIR"
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "缺少命令: $cmd"
    exit 1
  fi
}

ensure_basic_deps() {
  require_command node
  require_command pnpm
}

ensure_docker() {
  require_command docker
  if ! docker info >/dev/null 2>&1; then
    err "Docker 未启动，请先打开 Docker Desktop。"
    exit 1
  fi
}

ensure_env_files() {
  if [ ! -f "$ROOT_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.example" ]; then
      cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
      ok "已从 .env.example 生成 .env"
    else
      err "缺少 .env.example，无法生成根环境变量文件。"
      exit 1
    fi
  fi

  if [ ! -f "$ROOT_DIR/apps/cms/.env" ]; then
    if [ -f "$ROOT_DIR/apps/cms/.env.example" ]; then
      cp "$ROOT_DIR/apps/cms/.env.example" "$ROOT_DIR/apps/cms/.env"
      ok "已从 apps/cms/.env.example 生成 apps/cms/.env"
    else
      err "缺少 apps/cms/.env.example，无法生成 CMS 环境变量文件。"
      exit 1
    fi
  fi

  if [ ! -f "$ROOT_DIR/apps/web/.env" ] && [ -f "$ROOT_DIR/apps/web/.env.example" ]; then
    cp "$ROOT_DIR/apps/web/.env.example" "$ROOT_DIR/apps/web/.env"
    ok "已从 apps/web/.env.example 生成 apps/web/.env"
  fi
}

ensure_install() {
  if [ ! -d "$ROOT_DIR/node_modules" ]; then
    log "检测到依赖尚未安装，执行 pnpm install ..."
    pnpm install
  fi
}

load_root_env_defaults() {
  if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "$ROOT_DIR/.env"
    set +a
  fi

  POSTGRES_USER="${POSTGRES_USER:-postgres}"
  POSTGRES_DB="${POSTGRES_DB:-tzblog}"
}

is_pid_running() {
  local pid_file="$1"

  if [ ! -f "$pid_file" ]; then
    return 1
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [ -z "$pid" ]; then
    return 1
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    return 0
  fi

  rm -f "$pid_file"
  return 1
}

is_port_listening() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

describe_port_owner() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN | sed -n '1,3p'
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local retries="$3"
  local log_file="$4"
  local pid="$5"

  local i
  for ((i = 1; i <= retries; i += 1)); do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      err "$name 在监听端口前就退出了。日志位置: $log_file"
      if [ -f "$log_file" ]; then
        tail -n 40 "$log_file" || true
      fi
      exit 1
    fi

    if is_port_listening "$port"; then
      ok "$name 已就绪: localhost:$port"
      return 0
    fi
    sleep 1
  done

  err "$name 启动超时。日志位置: $log_file"
  if [ -f "$log_file" ]; then
    tail -n 40 "$log_file" || true
  fi
  exit 1
}

spawn_detached() {
  local log_file="$1"
  shift
  local command="$1"
  shift

  : >"$log_file"

  node -e "
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const command = process.argv[1];
const logFile = process.argv[2];
const cwd = process.argv[3];
const args = process.argv.slice(4);
const out = fs.openSync(logFile, 'a');

const child = spawn(command, args, {
  cwd,
  detached: true,
  stdio: ['ignore', out, out],
});

console.log(child.pid);
child.unref();
" "$command" "$log_file" "$ROOT_DIR" "$@"
}

start_db() {
  ensure_docker
  load_root_env_defaults

  log "启动 PostgreSQL ..."
  pnpm db:up >/dev/null

  local i
  for ((i = 1; i <= 30; i += 1)); do
    if docker compose -f "$COMPOSE_FILE" exec -T postgres \
      pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      ok "PostgreSQL 已就绪: localhost:$DB_PORT"
      return 0
    fi
    sleep 1
  done

  err "PostgreSQL 启动超时。"
  docker compose -f "$COMPOSE_FILE" logs --tail=50 postgres || true
  exit 1
}

start_managed_process() {
  local name="$1"
  local port="$2"
  local pid_file="$3"
  local log_file="$4"
  local retries="$5"
  shift 5
  local command="$1"
  shift

  if is_pid_running "$pid_file"; then
    ok "$name 已在运行。"
    return 0
  fi

  if is_port_listening "$port"; then
    err "$name 需要的端口 $port 已被其他进程占用。"
    describe_port_owner "$port" || true
    exit 1
  fi

  log "启动 $name ..."
  local pid
  pid="$(spawn_detached "$log_file" "$command" "$@")"
  echo "$pid" >"$pid_file"

  wait_for_port "$port" "$name" "$retries" "$log_file" "$pid"
}

start_web() {
  start_managed_process "Astro Web" "$WEB_PORT" "$WEB_PID_FILE" "$WEB_LOG_FILE" 30 pnpm dev:web
}

start_cms() {
  start_managed_process "Payload CMS" "$CMS_PORT" "$CMS_PID_FILE" "$CMS_LOG_FILE" 45 pnpm dev:cms
}

stop_pid_file() {
  local name="$1"
  local pid_file="$2"

  if is_pid_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    kill -TERM "-$pid" >/dev/null 2>&1 || kill "$pid" >/dev/null 2>&1 || true

    local i
    for ((i = 1; i <= 10; i += 1)); do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done

    if kill -0 "$pid" >/dev/null 2>&1; then
      kill -KILL "-$pid" >/dev/null 2>&1 || kill -9 "$pid" >/dev/null 2>&1 || true
    fi

    rm -f "$pid_file"
    ok "$name 已停止。"
  else
    rm -f "$pid_file"
    warn "$name 当前未由脚本管理。"
  fi
}

stop_db() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    pnpm db:down >/dev/null || true
    ok "PostgreSQL 已停止。"
  else
    warn "Docker 当前不可用，跳过数据库停止。"
  fi
}

show_status() {
  ensure_state_dir
  echo ""
  log "当前本地服务状态"

  load_root_env_defaults

  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 \
    && docker compose -f "$COMPOSE_FILE" exec -T postgres \
      pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    ok "PostgreSQL 运行中 -> localhost:$DB_PORT"
  else
    warn "PostgreSQL 未运行"
  fi

  if is_pid_running "$CMS_PID_FILE" && is_port_listening "$CMS_PORT"; then
    ok "Payload CMS 运行中 -> http://localhost:$CMS_PORT"
  elif is_port_listening "$CMS_PORT"; then
    warn "Payload CMS 端口被外部进程占用 -> localhost:$CMS_PORT"
  else
    warn "Payload CMS 未运行"
  fi

  if is_pid_running "$WEB_PID_FILE" && is_port_listening "$WEB_PORT"; then
    ok "Astro Web 运行中 -> http://localhost:$WEB_PORT"
  elif is_port_listening "$WEB_PORT"; then
    warn "Astro Web 端口被外部进程占用 -> localhost:$WEB_PORT"
  else
    warn "Astro Web 未运行"
  fi

  echo ""
  printf "日志文件:\n- Web: %s\n- CMS: %s\n" "$WEB_LOG_FILE" "$CMS_LOG_FILE"
  echo ""
}

print_urls() {
  echo ""
  printf "访问地址:\n- Web: http://localhost:%s\n- CMS: http://localhost:%s\n- Admin: http://localhost:%s/admin\n" "$WEB_PORT" "$CMS_PORT" "$CMS_PORT"
  echo ""
}

start_full() {
  ensure_basic_deps
  ensure_state_dir
  ensure_env_files
  ensure_install
  start_db
  start_cms
  start_web
  show_status
  print_urls
}

start_web_only() {
  ensure_basic_deps
  ensure_state_dir
  ensure_env_files
  ensure_install
  start_web
  show_status
  print_urls
}

start_cms_stack() {
  ensure_basic_deps
  ensure_state_dir
  ensure_env_files
  ensure_install
  start_db
  start_cms
  show_status
  print_urls
}

stop_all() {
  ensure_state_dir
  stop_pid_file "Astro Web" "$WEB_PID_FILE"
  stop_pid_file "Payload CMS" "$CMS_PID_FILE"
  stop_db
  show_status
}

restart_all() {
  stop_all
  start_full
}

usage() {
  cat <<'EOF'
TZBlog 本地启动脚本

用法:
  bash scripts/local-dev.sh start    启动完整栈 (DB + CMS + Web)
  bash scripts/local-dev.sh web      只启动前台
  bash scripts/local-dev.sh cms      启动 DB + CMS
  bash scripts/local-dev.sh stop     停止脚本管理的本地服务
  bash scripts/local-dev.sh restart  重启完整栈
  bash scripts/local-dev.sh status   查看当前服务状态
EOF
}

MODE="${1:-start}"

case "$MODE" in
  start|full)
    start_full
    ;;
  web)
    start_web_only
    ;;
  cms)
    start_cms_stack
    ;;
  stop)
    stop_all
    ;;
  restart)
    restart_all
    ;;
  status)
    show_status
    ;;
  *)
    usage
    exit 1
    ;;
esac
