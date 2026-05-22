# Handoff — tech-stack-section

> 你（接收 AI）正在执行 TZBlog 的 tech-stack-section SDD。预计 0.5 天。

## 30 秒概览

替换 `src/app/(site)/page.tsx:46-61` 的终端模拟 Tech Stack（`$ whoami` + bullet list）为 Editorial 风的类目化展示。

5 类（Frontend / Content & Editor / Backend & Data / Infra / Tooling），每 item 有 name + 简短 note，3-col grid，sm/lg 响应式。

## 阅读顺序

1. master.md / handoff-guide.md / design-system.md / known-findings.md
2. `.claude/sdd/tech-stack-section/proposal.md`
3. `.claude/sdd/tech-stack-section/specs/*/spec.md`
4. `.claude/sdd/tech-stack-section/test-map.md`
5. `.claude/sdd/tech-stack-section/design-notes.md` — **含 ASCII mockup + 完整组件骨架 + 锁定的 techStack 数据**
6. `.claude/sdd/tech-stack-section/tasks.md`

## 依赖

- hero-editorial 已完成（globals.css 含 @theme block + Editorial token）
- 如未完成，先做 hero-editorial 再回来

## 执行总览

```
§A component (TEST-RED → IMPL-GREEN, scope site-home)
§B integration (TEST-RED → IMPL-GREEN, scope site-home)
§C 验收
```

4 commits。

## 实施关键点

- 数据 inline in TechStack.tsx（不开新文件）
- 用现有 Editorial token（`--text-h2 / --text-base / --text-label / --tracking-label / --font-serif / --font-mono`）
- 不引入新依赖
- aria-labelledby pattern for sections

## 禁止事项

- 不加 link 到 tech 官网
- 不加 icon / logo
- 不抽 sub-component
- 不改 globals.css token
- 不改 hero / Recent Posts / Site Stats
- 不 `--no-verify`

## 完成后输出

`.claude/sdd/tech-stack-section/completion-report.md` 含：commits + test counts + manual smoke checklist

## TL;DR

```
读 SDD 文件 → §A.1.a 测试 RED → commit test(site-home) →
§A.1.b TechStack.tsx GREEN → commit feat(site-home) →
§B.1.a integration test RED → commit test(site-home) →
§B.1.b page.tsx 改 GREEN → commit feat(site-home) →
全套质量门 + manual smoke → 写 completion-report → 停。
```

收工。
