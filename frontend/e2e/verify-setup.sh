#!/bin/bash

# E2E 测试快速验证脚本

echo "🚀 开始 E2E 测试环境验证..."
echo ""

# 1. 检查依赖
echo "📦 检查 Playwright 安装..."
if npx playwright --version > /dev/null 2>&1; then
  echo "✅ Playwright 已安装"
else
  echo "❌ Playwright 未安装"
  exit 1
fi

# 2. 检查浏览器
echo ""
echo "🌐 检查浏览器安装..."
if npx playwright list-browsers | grep -q "chromium"; then
  echo "✅ Chromium 已安装"
else
  echo "⚠️  Chromium 未安装，运行: npx playwright install chromium"
fi

if npx playwright list-browsers | grep -q "firefox"; then
  echo "✅ Firefox 已安装"
else
  echo "⚠️  Firefox 未安装，运行: npx playwright install firefox"
fi

if npx playwright list-browsers | grep -q "webkit"; then
  echo "✅ WebKit 已安装"
else
  echo "⚠️  WebKit 未安装，运行: npx playwright install webkit"
fi

# 3. 检查配置文件
echo ""
echo "⚙️  检查配置文件..."
if [ -f "playwright.config.ts" ]; then
  echo "✅ playwright.config.ts 存在"
else
  echo "❌ playwright.config.ts 不存在"
  exit 1
fi

# 4. 检查测试文件
echo ""
echo "📝 检查测试文件..."
test_files=$(find e2e/tests -name "*.spec.ts" 2>/dev/null | wc -l)
if [ "$test_files" -gt 0 ]; then
  echo "✅ 找到 $test_files 个测试文件"
else
  echo "❌ 未找到测试文件"
  exit 1
fi

# 5. 列出所有测试
echo ""
echo "📋 列出所有测试..."
pnpm test:e2e --list 2>&1 | grep "›" | head -10

echo ""
echo "✅ E2E 测试环境验证完成！"
echo ""
echo "运行测试命令："
echo "  pnpm test:e2e          # 运行所有测试"
echo "  pnpm test:e2e:ui       # 使用 UI 模式"
echo "  pnpm test:e2e:debug    # Debug 模式"
echo ""
