#!/bin/bash
# TZBlog 测试环境部署脚本
# 复用 deploy.sh 的真实部署流程，以 staging 环境运行（此前为占位脚本，仅打印提示）。
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "   TZBlog 测试环境部署 (staging)"
echo "========================================="

exec bash "$SCRIPT_DIR/deploy.sh" staging
