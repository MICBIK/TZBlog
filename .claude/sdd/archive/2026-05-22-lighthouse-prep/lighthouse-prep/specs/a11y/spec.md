# specs/a11y — accessibility audit

> spec-id 前缀：`SPEC-LH-A`

## SPEC-LH-A-1 — homepage has no critical/serious axe violations

```gherkin
GIVEN homepage rendered (mocked services for deterministic test)

WHEN @axe-core or jest-axe runs

THEN no violations of impact: "critical" or "serious"

Test (preferred — with jest-axe):
  import { axe, toHaveNoViolations } from "jest-axe"
  expect.extend(toHaveNoViolations)

  it("homepage is accessible", async () => {
    const { container } = render(await HomePage())
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: true } }
    })
    expect(results).toHaveNoViolations()
  })
```

**Fallback if jest-axe not installed**:
- 手动断言：
  - `expect(screen.getAllByRole("heading")).toHaveLength(...)` 验有 heading
  - `expect(screen.getByRole("main")).toBeInTheDocument()`
  - 每个 `<a>` 检 accessible name
  - skip color-contrast (need real CSS rendering)
- 在 completion-report 标注 "axe deferred — install jest-axe post-launch"

## SPEC-LH-A-2 — admin login page accessible

```gherkin
GIVEN admin login page rendered
WHEN axe runs
THEN no critical/serious violations
AND form inputs have associated <label>
AND form has aria-describedby for errors
```

## 检查清单（手工）

完成 spec 后跑：
- [ ] 所有按钮有可见 focus ring (`:focus-visible`)
- [ ] 颜色对比 ≥ 4.5:1 for normal text（CSS vars 已是 hsl，可手验）
- [ ] 键盘 Tab 顺序合理
- [ ] form 字段有 `<label>` 关联
- [ ] alt text 在所有 `<img>`（与 SPEC-LH-P-1 交叉）
- [ ] 没有 `outline: none` 不带替代 focus 样式

## jest-axe 装包风险

CLAUDE.md 禁止"安装未说明的依赖"。
- **handoff 必须 ask ha1den**: 是否同意 `pnpm add -D jest-axe @types/jest-axe` (~50KB devDep)
- 如不同意：走 fallback 路径（手动断言 + completion-report 标注 deferred）
