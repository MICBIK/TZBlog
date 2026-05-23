# Test Map — creative-blog-notion-editor

| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|-----------|-----------|---------------|-------|
| notion-editor-001 | unit | src/components/editor/notionEditorAdapter.test.ts | selectsCandidateOnlyAfterRoundTripEvidence | POC gate; first RED should fail before adapter exists |
| notion-editor-002 | unit | src/components/editor/notionEditorAdapter.test.ts | preservesMarkdownFixtureSemantics | Uses complex fixture and renderMarkdown equivalence |
| notion-editor-003 | component | src/components/editor/NotionMarkdownEditor.test.tsx | slashMenuInsertsSupportedBlocks | Keyboard-first slash command coverage |
| notion-editor-004 | component | src/components/editor/NotionMarkdownEditor.test.tsx | bubbleMenuFormatsSelectionAsMarkdown | Selection formatting contract |
| notion-editor-005 | component | src/components/editor/NotionMarkdownEditor.test.tsx | imageCommandUsesMediaLibraryUrl | No base64/blob payload |
| notion-editor-006 | integration | src/components/admin/posts/PostEditor.test.tsx | savedNotionEditorContentPublishesThroughRenderMarkdown | Existing save flow + markdown output |
| home-garden-001 | page | src/app/(site)/page.test.tsx | rendersIdentityRailAndContentStream | Replaces traditional hero-only shape |
| home-garden-002 | component | src/components/site/HomeGarden.test.tsx | handlesLoadingEmptyAndErrorStates | GitHub/stats/posts/project states |
| home-garden-003 | component | src/components/site/HomeGarden.test.tsx | collapsesIdentityRailOnMobile | Responsive no overflow |
| home-garden-004 | component | src/components/site/HomeGarden.test.tsx | usesMotionTokensAndReducedMotionFallback | Motion contract |
| post-index-001 | page | src/app/(site)/posts/page.test.tsx | rendersDenseArticleMetadata | Title/meta/tags/stats/read time |
| post-index-002 | page | src/app/(site)/posts/page.test.tsx | syncsDiscoveryFiltersWithUrl | Query state restoration |
| post-index-003 | component | src/components/site/PostCard.test.tsx | keepsCardLayoutStableAcrossCoverStates | Cover/null/long title |
| post-index-004 | component | src/components/site/PostCard.test.tsx | exposesKeyboardFocusEquivalentToHover | A11y interaction |
| article-experience-001 | page | src/app/(site)/posts/[slug]/page.test.tsx | rendersEditorialArticleShellWithRail | Header/body/rail/comments/related |
| article-experience-002 | unit | src/lib/markdown.test.ts | keepsMarkdownElementsCompatibleWithArticleShell | renderMarkdown continuity |
| article-experience-003 | component | src/components/site/InteractiveExplainer.test.tsx | providesStaticFallbackForInteractiveBlock | No-JS/reduced-motion fallback |
| article-experience-004 | component | src/components/site/PostToc.test.tsx | updatesTocAndProgressWithoutLayoutShift | TOC + progress behavior |
| motion-system-001 | unit | src/lib/motionTokens.test.ts | exposesSharedMotionTokens | No scattered magic values |
| motion-system-002 | component | src/components/site/site-motion-reduced.test.tsx | disablesLargeMotionWhenReducedMotionIsPreferred | Reduced motion |
| motion-system-003 | component | src/components/site/site-focus-states.test.tsx | exposesVisibleFocusForInteractiveSurfaces | Keyboard parity |
| motion-system-004 | integration | src/app/(site)/layout.test.tsx | rendersMotionEnhancedContentWithoutHydrationOnlyVisibility | SSR-safe initial visibility |

