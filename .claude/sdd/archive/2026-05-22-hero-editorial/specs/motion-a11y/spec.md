# specs/motion-a11y — 初始 reveal 与 reduced-motion

> spec-id 前缀：`SPEC-HE-M`

## SPEC-HE-M-1 — 初始 reveal 动画（CSS-only）

```gherkin
GIVEN HeroEditorial renders for first time
  AND user agent reports prefers-reduced-motion: no-preference

WHEN component mounts (page load)

THEN hero h1, dateline, hairline label, CTAs each:
  - start at opacity: 0 + transform: translateY(8px)
  - animate to opacity: 1 + transform: translateY(0)
  - duration ≈ 800ms (--duration-slow)
  - easing: cubic-bezier(0.16, 1, 0.3, 1) (--ease-out-expo)
  - stagger via animation-delay: 0ms, 60ms, 120ms, 180ms across children

AND animation uses pure CSS @keyframes + animation-delay (no JS / no Framer Motion)

Implementation approach (design-notes for receiving AI):
  - global keyframe `@keyframes editorial-reveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`
  - data-reveal attribute on each animated child
  - CSS rule [data-reveal] { animation: editorial-reveal 800ms var(--ease-out-expo) backwards; }
  - per-child --reveal-delay via inline style or sequential CSS selectors

Test:
  - render(<HeroEditorial />)
  - hero h1 has style or className referencing animation property OR data-reveal attribute
```

## SPEC-HE-M-2 — prefers-reduced-motion 完全禁用动画

```gherkin
GIVEN user agent reports prefers-reduced-motion: reduce

WHEN HeroEditorial renders

THEN all reveal animations are disabled:
  - hero h1 opacity: 1, transform: none (no fade-in, no slide)
  - same for dateline, hairline, CTAs

AND CSS uses @media query:
  @media (prefers-reduced-motion: reduce) {
    [data-reveal] {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }

Test (jsdom mocks matchMedia):
  - mock matchMedia to return matches: true for "(prefers-reduced-motion: reduce)"
  - render(<HeroEditorial />)
  - inspect computed styles (or class application) confirming animation disabled

  OR (simpler): just verify CSS rules exist in globals.css containing the @media query
  via a separate test that reads the file content via fs.readFile
```

## Acceptance (both M specs)

- All animations are CSS-driven (no JS animation libs)
- prefers-reduced-motion respected (CSS @media)
- No layout shift caused by reveal animation (only opacity + small translateY)
- LCP not delayed (animation only changes visual presence, not layout / not block render)

## Implementation hint

For implementing AI, recommended file structure:

```css
/* in src/app/globals.css under @theme block or in a new section */
@keyframes editorial-reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

[data-reveal] {
  animation: editorial-reveal var(--duration-slow, 800ms) var(--ease-out-expo) backwards;
  animation-delay: var(--reveal-delay, 0ms);
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

In HeroEditorial.tsx:

```tsx
<h1 data-reveal style={{ "--reveal-delay": "0ms" } as React.CSSProperties}>...</h1>
<p data-reveal style={{ "--reveal-delay": "60ms" } as React.CSSProperties}>...</p>
<a data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties} href="/posts">Read Blog</a>
<a data-reveal style={{ "--reveal-delay": "180ms" } as React.CSSProperties} href="/about">About</a>
```

## Notes for jsdom testing

jsdom doesn't process @keyframes or @media animations. Test approach:

- Assert `data-reveal` attribute is set on expected elements
- Assert inline style contains `--reveal-delay`
- For reduced-motion: read globals.css content + verify @media query exists (file-level test)
- Real visual animation must be verified manually via dev server
