# Tasks — creative-blog-notion-editor

> 严格按 test-map micro-cycle 执行。每个 `[TEST-RED]` 后必须有真实 FAIL/FAILED 输出；每个 `[IMPL-GREEN]` 后必须有真实 PASS 输出。

## 1. Editor POC and replacement

1.1.a [TEST-RED] write failing adapter gate test for `notion-editor-001`  
1.1.b [IMPL-GREEN] implement minimal editor adapter decision harness

1.2.a [TEST-RED] write failing complex fixture round-trip test for `notion-editor-002`  
1.2.b [IMPL-GREEN] wire selected candidate adapter until fixture semantics pass

1.3.a [TEST-RED] write failing slash command test for `notion-editor-003`  
1.3.b [IMPL-GREEN] implement slash command insertion for supported blocks

1.4.a [TEST-RED] write failing bubble menu formatting test for `notion-editor-004`  
1.4.b [IMPL-GREEN] implement bubble menu Markdown formatting semantics

1.5.a [TEST-RED] write failing media image insertion test for `notion-editor-005`  
1.5.b [IMPL-GREEN] connect image command to existing media library URL flow

1.6.a [TEST-RED] write failing PostEditor save/publish integration test for `notion-editor-006`  
1.6.b [IMPL-GREEN] replace CodeMirror editor in admin post flow while preserving Markdown publishing

## 2. Creative homepage

2.1.a [TEST-RED] write failing page test for `home-garden-001`  
2.1.b [IMPL-GREEN] implement identity rail + content stream homepage shell

2.2.a [TEST-RED] write failing state coverage test for `home-garden-002`  
2.2.b [IMPL-GREEN] implement loading/empty/error states for homepage modules

2.3.a [TEST-RED] write failing responsive test for `home-garden-003`  
2.3.b [IMPL-GREEN] collapse identity rail and verify mobile text fit

2.4.a [TEST-RED] write failing motion contract test for `home-garden-004`  
2.4.b [IMPL-GREEN] apply motion tokens and reduced-motion fallback

## 3. Article discovery

3.1.a [TEST-RED] write failing dense metadata test for `post-index-001`  
3.1.b [IMPL-GREEN] redesign `/posts` index cards and metadata

3.2.a [TEST-RED] write failing URL filter sync test for `post-index-002`  
3.2.b [IMPL-GREEN] implement discovery filters and query state restoration

3.3.a [TEST-RED] write failing card stability test for `post-index-003`  
3.3.b [IMPL-GREEN] stabilize cover/null/long-title article card layout

3.4.a [TEST-RED] write failing keyboard focus parity test for `post-index-004`  
3.4.b [IMPL-GREEN] implement visible focus and hover-equivalent card states

## 4. Article experience

4.1.a [TEST-RED] write failing article shell test for `article-experience-001`  
4.1.b [IMPL-GREEN] implement editorial article shell with right rail

4.2.a [TEST-RED] write failing markdown continuity test for `article-experience-002`  
4.2.b [IMPL-GREEN] adapt article shell without regressing renderMarkdown output

4.3.a [TEST-RED] write failing interactive fallback test for `article-experience-003`  
4.3.b [IMPL-GREEN] implement first reusable InteractiveExplainer block

4.4.a [TEST-RED] write failing TOC/progress test for `article-experience-004`  
4.4.b [IMPL-GREEN] add motion-safe TOC/progress behavior

## 5. Motion system

5.1.a [TEST-RED] write failing shared token test for `motion-system-001`  
5.1.b [IMPL-GREEN] add shared motion tokens/classes/hooks

5.2.a [TEST-RED] write failing reduced-motion test for `motion-system-002`  
5.2.b [IMPL-GREEN] disable/degrade large motion under reduced motion

5.3.a [TEST-RED] write failing focus-state test for `motion-system-003`  
5.3.b [IMPL-GREEN] normalize focus-visible states across interactive surfaces

5.4.a [TEST-RED] write failing SSR visibility test for `motion-system-004`  
5.4.b [IMPL-GREEN] ensure animated content renders visible before hydration

## 6. Finish

6.1 [NO-TDD] update `memory-bank/systemPatterns.md` editor contract after implementation is complete  
6.2 [NO-TDD] update `memory-bank/progress.md` with completed feature status  
6.3 run quality gate: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`  
6.4 browser smoke: desktop/mobile + light/dark screenshots for home, posts, post detail, admin new/edit editor

