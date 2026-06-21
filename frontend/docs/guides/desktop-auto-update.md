# TZBlog 桌面端自动更新

## 技术路线

当前实现使用 `Electron + electron-builder + electron-updater`：

- Electron 主进程在 packaged 模式启动本地 Next.js standalone server。
- Renderer 仍复用现有 Next.js App Router 页面。
- `preload` 通过 `window.tzDesktopUpdater` 暴露最小更新 API。
- `electron-updater` 使用 GitHub Releases 作为 provider。
- 自动更新只在 packaged app 中启用；浏览器和 `pnpm desktop:dev` 环境不会触发真实更新。

## 本地开发

```bash
cd frontend
pnpm install
pnpm desktop:dev
```

仓库已在 `pnpm-workspace.yaml` 中批准 `electron` 与 `electron-winstaller`
的 build scripts。若 pnpm 提示 `ERR_PNPM_IGNORED_BUILDS`，先确认该文件中
`allowBuilds` 与 `onlyBuiltDependencies` 没有被交互式命令写成占位值。

若 `electron-builder` 报错：

```text
Cannot read properties of undefined (reading 'ReadWrite')
```

这是 `electron-builder 26.15.x` / `app-builder-lib 26.15.x` 与
`@electron/get` 的下载缓存 API 不兼容导致。仓库固定使用
`electron-builder 24.13.3`，不要把它改回 `^26.x` 浮动版本。

若报错：

```text
corrupted Electron dist
```

通常是 `electron` 包的 postinstall 被中断，导致
`node_modules/electron/dist` 里没有完整的 `Electron.app`。先执行
`pnpm rebuild electron`，再重新打包。

`desktop:dev` 会执行：

1. 启动 `next dev`
2. 等待 `http://localhost:3000` 可访问
3. 编译 Electron main/preload 到 `desktop-dist/`
4. 启动 Electron 并加载本地 Next dev server

## 本地打包

```bash
cd frontend
pnpm desktop:pack
```

该命令会：

1. 执行 `pnpm build` 生成 `.next/standalone`
2. 执行 `pnpm desktop:build-main`
3. 执行 `electron-builder --dir`

生成目录为 `frontend/release/desktop/`，该目录不提交。

## 正式发布

GitHub Actions 提供手动工作流：

```text
.github/workflows/desktop-release.yml
```

触发时需要输入：

- `version`: 发布版本，例如 `0.1.1`
- `publish`: 是否发布到 draft GitHub Release

发布时 `electron-builder` 会生成安装包和更新 metadata，例如：

- macOS: `dmg` / `zip`
- Windows: `nsis`
- Linux: `AppImage` / `deb`
- updater metadata: `latest.yml` / platform-specific metadata

## 自动更新状态

后台设置页新增 `桌面更新` tab，支持以下状态：

- `checking`
- `available`
- `not-available`
- `downloading`
- `downloaded`
- `error`
- `disabled`

可用动作：

- 检查更新
- 下载更新
- 重启安装

## 环境变量与 secrets

本地可选：

- `ELECTRON_DEV_URL`: Electron dev 模式加载的前端地址，默认 `http://localhost:3000`
- `TZBLOG_DESKTOP_PORT`: packaged 模式中本地 Next server 的固定端口；未设置时自动分配
- `TZBLOG_DESKTOP_UPDATES_DISABLED=1`: packaged 模式禁用更新检查

CI / 发布：

- `GITHUB_TOKEN`: GitHub Actions 内置 token，用于 draft release 发布
- macOS code signing certificate: 生产分发需要，当前 workflow 使用 `CSC_IDENTITY_AUTO_DISCOVERY=false` 跳过本地签名发现
- Windows signing certificate: 生产分发建议配置 `[unverified]`

## 当前限制

- macOS notarization 尚未接入；生产分发前需要补齐 Apple Developer 证书、notarization secrets 和 entitlements。
- Windows 代码签名尚未接入；未签名安装包可能触发系统信誉提示。
- 自动更新闭环需要 GitHub Releases 上存在上一版本安装包和 metadata，本地无法伪造完整生产验证。
- 当前桌面壳复用完整 Web 应用，不是单独的写作工具客户端；如产品目标变化，需要重新评估 UI 范围。
