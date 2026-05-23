# Test Map — final-experience-hardening

| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|-----------|-----------|---------------|-------|
| showcase-seed-001 | integration | tests/seed-showcase.test.ts | seedsDeterministicShowcaseContent | Runs seed script against test DB after reset |
| showcase-seed-002 | integration | tests/seed-showcase.test.ts | seededContentSupportsPublicShowcaseRoutes | Verifies published post, column, tag, comments and Markdown fixture shape |
| route-polish-001 | component | src/app/(admin)/admin/_editor-demo/page.test.tsx | editorDemoRouteReturnsNotFound | Keeps file route but no demo UI |
| public-index-001 | page | src/app/(site)/tags/page.test.tsx | rendersChineseSingleLocaleTagsIndex | Existing tags page test upgraded |
| public-index-002 | component | src/components/site/ColumnCard.test.tsx | rendersStableCoverFrameWhenCoverExists | New cover rendering contract |
| public-index-003 | page | src/app/(site)/tags/[slug]/page.test.tsx | rendersChineseSingleLocaleTagDetail | Tag detail chrome and metadata |
| admin-polish-001 | component | src/components/admin/admin-dashboard-chrome.test.tsx | rendersChineseAnalyticsEmptyStates | Dashboard helper empty states |
| admin-polish-002 | page | src/app/(admin)/admin/page.test.tsx | rendersChineseDashboardChrome | Dashboard page-level labels and fallbacks |

<!-- Draft auto-generated from explore. Review before use. Generated: 2026-05-24T00:00:00+08:00 -->
