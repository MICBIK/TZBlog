# test-map.md — prelaunch-readiness

| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|------------|-----------|---------------|-------|
| prelaunch-platform-001 | unit | tests/prelaunch-readiness.test.ts | proxyEntrypointReplacesMiddleware | node fs guard |
| prelaunch-platform-002 | unit | tests/prelaunch-readiness.test.ts | prismaSchemaDoesNotUseDeprecatedDriverAdaptersPreview | node fs guard |
| prelaunch-content-001 | unit | src/lib/content/about.test.ts | aboutContentHasNoPreLaunchPlaceholders | existing test update |
| prelaunch-content-002 | component | src/components/site/TechStack.test.tsx | TechStack renders current launch stack | existing test update |
| prelaunch-docs-001 | unit | tests/docs-sanity.test.ts | docsDoNotContainStaleCurrentStackMarkers | scan active docs |
| prelaunch-docs-001 | unit | tests/docs-sanity.test.ts | developerGuidanceDoesNotContainStaleEntrypoints | scan current guidance docs and source comments |
| prelaunch-docs-002 | unit | tests/docs-sanity.test.ts | progressReflectsResolvedDebtsAndCurrentBacklog | scan progress.md |
| prelaunch-roadmap-001 | unit | tests/docs-sanity.test.ts | roadmapContainsExplicitV2V3BacklogBoundaries | scan progress/projectBrief |
