# Test Map — spec-id → 测试函数

> 每个 spec-id 对应的测试函数名 + 文件路径 + 层级。**无 test-map 禁生成 tasks**（CLAUDE.md SDD 强约束）。
>
> 整合所有 16 capability 的 spec-id；每行就是一个 [TEST-RED] / [IMPL-GREEN] 微循环的依据。

---

## 总览

总计 spec ≈ **180+**，覆盖 16 capability。下面按 capability 分组。

| Capability | Spec count |
|-----------|-----------|
| 01-schema | 10 |
| 02-editor | 18 |
| 03-theme-tokens | 14 |
| 04-public-shell | 10 |
| 05-home-composition | 10 |
| 06-channel-pages | 15 |
| 07-entry-detail | 20 |
| 08-reading-mode | 12 |
| 09-terminal-stream | 10 |
| 10-admin-channel-crud | 15 |
| 11-admin-entry-editor | 15 |
| 12-auth-magic-link | 13 |
| 13-guestbook | 11 |
| 14-recommendation | 18 |
| 15-migration | 10 |
| 16-cleanup | 14 |
| **Total** | **215** |

---

## 01-schema

| Spec-ID | Test Layer | Test File | Test Function | Notes |
|---------|-----------|-----------|---------------|-------|
| schema-001 | integration | prisma/__tests__/schema.test.ts | generatesPrismaClientWithNewTypes | needs `pnpm prisma generate` |
| schema-002 | integration | prisma/__tests__/schema.test.ts | typecheckPassesWithNoLegacyPostColumnReferences | runs `pnpm typecheck` |
| schema-003 | integration | prisma/__tests__/schema.test.ts | entryFindFirstReturnsNestedChannelTagsTranslations | jsdom skip; use test db |
| schema-004 | integration | prisma/__tests__/schema.test.ts | insertArticleMetadataStoresJsonbCorrectly | |
| schema-005 | integration | prisma/__tests__/schema.test.ts | insertGuestbookChannelAllowsGuestbookThreadEntry | |
| schema-006 | integration | prisma/__tests__/schema.test.ts | deleteChannelCascadesToEntriesTranslationsSeries | |
| schema-007 | integration | prisma/__tests__/schema.test.ts | seriesIndexAllowsSeriesOrderQuery | |
| schema-008 | integration | prisma/__tests__/schema.test.ts | trendingScoreIndexSortsDesc | |
| schema-009 | integration | prisma/__tests__/schema.test.ts | duplicateEntryViewTriggersUniqueConstraint | |
| schema-010 | integration | prisma/__tests__/schema.test.ts | insertCommentWithPrivateVisibilityAndAuthorUserId | |

## 02-editor

| Spec-ID | Test Layer | Test File | Test Function |
|---------|-----------|-----------|---------------|
| editor-001 | unit | src/components/editor/round-trip.test.ts | preservesBasicMdVerbatim |
| editor-002 | unit | src/components/editor/round-trip.test.ts | preservesListMdVerbatim |
| editor-003 | unit | src/components/editor/round-trip.test.ts | preservesCodeMdWithLanguageHints |
| editor-004 | unit | src/components/editor/round-trip.test.ts | preservesTableMdWithCjkAndEscapedPipes |
| editor-005 | unit | src/components/editor/round-trip.test.ts | preservesAllFiveGithubAlerts |
| editor-006 | unit | src/components/editor/round-trip.test.ts | preservesImageAndLinkWithTitle |
| editor-007 | unit | src/components/editor/round-trip.test.ts | preservesBlockquoteWithoutBackslashHardBreaks |
| editor-008 | unit | src/components/editor/round-trip.test.ts | preservesInlineHtmlOrDocumentsDegradation |
| editor-009 | unit | src/components/editor/round-trip.test.ts | renderMarkdownHtmlParityAcrossAllFixtures |
| editor-010 | component | src/components/editor/MilkdownEditor.test.tsx | slashMenuAppearsAtCaret |
| editor-011 | component | src/components/editor/MilkdownEditor.test.tsx | bubbleMenuAppearsOnSelection |
| editor-012 | component | src/components/editor/MilkdownEditor.test.tsx | imageDropTriggersMediaUpload |
| editor-013 | component | src/components/editor/MilkdownEditor.test.tsx | modSTriggersOnSavePrevented |
| editor-014 | component | src/components/editor/MilkdownEditor.test.tsx | darkThemePropPropagatesToContainer |
| editor-015 | component | src/components/editor/MilkdownEditor.test.tsx | debouncedOnChangeEmitsOnceAfter300ms |
| editor-016 | component | src/components/editor/MilkdownEditor.test.tsx | unsafeMediaUrlBlockedFromInsertion |
| editor-017 | e2e | e2e/editor-mobile.spec.ts | editorDoesNotOverflowAt375px |
| editor-018 | component | src/components/editor/MilkdownEditor.test.tsx | reducedMotionDisablesAnimations |

## 03-theme-tokens

| Spec-ID | Test Layer | Test File | Test Function |
|---------|-----------|-----------|---------------|
| theme-001 | component | src/components/theme/ThemeProvider.test.tsx | rootHasAuroraThemeByDefault |
| theme-002 | component | src/components/theme/ThemeProvider.test.tsx | postSlugRouteResolvesToInkTheme |
| theme-003 | unit | src/lib/theme/resolveTheme.test.ts | channelStreamKindResolvesToTerminal |
| theme-004 | unit | src/lib/theme/resolveTheme.test.ts | channelArticleKindWithChronicleLayoutResolvesToAurora |
| theme-005 | unit | src/lib/theme/resolveTheme.test.ts | entryArticleKindOverridesParentChannelTheme |
| theme-006 | component | src/components/theme/shadcn-integration.test.tsx | shadcnButtonInheritsBgInAllThreeThemes |
| theme-007 | component | src/components/theme/shadcn-integration.test.tsx | terminalForcesZeroBorderRadius |
| theme-008 | component | src/components/theme/ThemeProvider.test.tsx | reducedMotionDisablesAuroraDrift |
| theme-009 | unit | src/lib/theme/font.test.ts | fontProseResolvesToInterInAurora |
| theme-010 | unit | src/lib/theme/font.test.ts | fontProseResolvesToNotoSerifInInk |
| theme-011 | unit | src/lib/theme/font.test.ts | fontMonoResolvesToJetbrainsInTerminal |
| theme-012 | e2e | e2e/theme-contrast.spec.ts | allThemesPassAaContrast |
| theme-013 | unit | src/__tests__/theme-guards.test.ts | noChannelThemeFieldInPrismaSchema |
| theme-014 | unit | src/__tests__/theme-guards.test.ts | noThemeSwitcherComponentInSrc |

## 04-public-shell

| Spec-ID | Test Layer | Test File | Test Function |
|---------|-----------|-----------|---------------|
| shell-001 | component | src/components/site/SiteHeader.test.tsx | rendersBrandAndNavAndAdminLink |
| shell-002 | component | src/components/site/SiteHeader.test.tsx | navListsEnabledChannelsByOrder |
| shell-003 | component | src/components/site/SiteHeader.test.tsx | navIncludesGuestbookLinkWhenEnabled |
| shell-004 | component | src/components/site/SiteHeader.test.tsx | navAlwaysHasAboutLink |
| shell-005 | component | src/components/site/SiteFooter.test.tsx | rendersColophonWithAuthorRssLink |
| shell-006 | component | src/app/(site)/layout.test.tsx | renders3PartShellHeaderMainFooter |
| shell-007 | component | src/components/theme/ThemeProvider.test.tsx | auroraHeroAttributeEnablesGlowLayer |
| shell-008 | component | src/components/theme/ThemeProvider.test.tsx | postPageHasNoAuroraLayer |
| shell-009 | e2e | e2e/responsive-header.spec.ts | mobile375CollapsesToHamburgerMenu |
| shell-010 | component | src/components/theme/ThemeProvider.test.tsx | reducedMotionStopsAuroraDriftHero |

## 05-home-composition

| Spec-ID | Test Layer | Test File | Test Function |
|---------|-----------|-----------|---------------|
| home-001 | component | src/app/(site)/page.test.tsx | rendersHeroAndChannelPreviewsAndTrending |
| home-002 | component | src/app/(site)/page.test.tsx | disabledChannelsAreNotShown |
| home-003 | component | src/components/site/ChannelPreviewBlock.test.tsx | articlesChannelShowsTop3Entries |
| home-004 | component | src/components/site/ChannelPreviewBlock.test.tsx | streamChannelShowsTop5Entries |
| home-005 | component | src/components/site/HomeTrending.test.tsx | trendingReadsByScoreDesc |
| home-006 | component | src/components/site/HomeTrending.test.tsx | trendingFallsBackToPublishedAtDesc |
| home-007 | component | src/app/(site)/page.test.tsx | heroRendersAvatarFromSiteConfig |
| home-008 | e2e | e2e/lighthouse-home.spec.ts | lighthouseMobilePerfAtLeast85 |
| home-009 | unit | src/__tests__/bundle-size.test.ts | homeBundleUnder250kbGzip |
| home-010 | e2e | e2e/home-dynamic-channel.spec.ts | newChannelAppearsWithoutCodeChange |

## 06-channel-pages

| Spec-ID | Test File | Test Function |
|---------|-----------|---------------|
| chl-001 | src/components/channel-layouts/ChronicleLayout.test.tsx | rendersSingleColumnLongFormStream |
| chl-002 | src/components/channel-layouts/ChronicleLayout.test.tsx | rendersPlaceholderWhenCoverMissing |
| chl-003 | src/components/channel-layouts/ChronicleLayout.test.tsx | rendersEmptyStateWhenNoPublishedEntries |
| chl-004 | src/components/channel-layouts/CardsLayout.test.tsx | rendersResponsiveGridDesktop3Mobile1 |
| chl-005 | src/components/channel-layouts/CardsLayout.test.tsx | cardHoverShowsAccentBorder |
| chl-006 | src/components/channel-layouts/TimelineLayout.test.tsx | rendersVerticalTimelineWithDayHeaders |
| chl-007 | src/components/channel-layouts/TimelineLayout.test.tsx | noteWithMoodShowsMoodIcon |
| chl-008 | src/components/channel-layouts/GrepLayout.test.tsx | rendersMonospaceTableWithSearchInput |
| chl-009 | src/components/channel-layouts/GrepLayout.test.tsx | searchInputFiltersRowsLive |
| chl-010 | e2e/grep-mobile.spec.ts | grepLayoutMobileHorizontalScroll |
| chl-011 | src/components/channel-layouts/FeedLayout.test.tsx | rendersMasonryFlow |
| chl-012 | src/components/channel-layouts/FeedLayout.test.tsx | infiniteScrollLoadsNextBatch |
| chl-013 | src/app/(site)/c/[slug]/page.test.tsx | incompatibleKindLayoutStillRenders |
| chl-014 | src/app/(site)/c/[slug]/page.test.tsx | metadataAndOgTagsCorrect |
| chl-015 | src/components/channel-layouts/_shared.test.tsx | reducedMotionDisablesAllLayoutAnimations |

## 07-entry-detail

详见 `specs/07-entry-detail/capability.md` 表，全部映射到：

- `src/app/(site)/posts/[slug]/page.test.tsx`
- `src/app/(site)/c/[slug]/[entry-slug]/page.test.tsx`
- `src/components/site/EntryDetail.test.tsx`
- `src/components/site/NextEntry.test.tsx`
- `src/app/api/entries/[id]/view/route.test.ts`
- `src/app/api/entries/[id]/like/route.test.ts`

## 08-reading-mode

| Spec-ID | Test File | Test Function |
|---------|-----------|---------------|
| read-001 | src/components/reading/ArticleReader.test.tsx | rendersInkThemeWithSerifFontAnd52chWidth |
| read-002 | src/components/reading/Toc.test.tsx | tocAppearsForLongArticles |
| read-003 | src/components/reading/Toc.test.tsx | tocItemClickScrollsToHeading |
| read-004 | src/components/reading/ReadingProgress.test.tsx | progressBarTracksScroll |
| read-005 | src/components/reading/ArticleReader.test.tsx | footerShowsVermilionSeal |
| read-006 | src/components/reading/ArticleReader.test.tsx | chineseParagraphsHaveNoFirstLineIndent |
| read-007 | src/components/reading/ArticleReader.test.tsx | h2HasFourEmTopMargin |
| read-008 | src/components/reading/ArticleReader.test.tsx | blockquoteShowsVermilionQuoteMark |
| read-009 | src/components/reading/ArticleReader.test.tsx | codeFenceShowsShikiHighlightAndCopyButton |
| read-010 | src/components/reading/ArticleReader.test.tsx | ghAlertRendersWithIconAndColor |
| read-011 | e2e/reading-mobile.spec.ts | mobile375CollapsesTocAndScalesText |
| read-012 | src/components/reading/ArticleReader.test.tsx | reducedMotionDisablesParagraphFade |

## 09-terminal-stream

| Spec-ID | Test File | Test Function |
|---------|-----------|---------------|
| term-001 | src/components/terminal/TerminalShell.test.tsx | rendersTerminalThemeWithMonoFont |
| term-002 | src/components/terminal/TerminalShell.test.tsx | rendersPromptWithBlinkingCursor |
| term-003 | src/components/channel-layouts/GrepLayout.test.tsx | grepFilterMatchesHighlight |
| term-004 | src/components/channel-layouts/GrepLayout.test.tsx | rendersFixedWidthColumns |
| term-005 | src/components/terminal/TerminalShell.test.tsx | linkHoverShowsArrowPrefix |
| term-006 | src/components/terminal/TerminalEntryDetail.test.tsx | rendersVimLikeHeaderAndLineNumbers |
| term-007 | src/components/terminal/TerminalEntryDetail.test.tsx | codeBlockShowsShikiAndPath |
| term-008 | e2e/terminal-mobile.spec.ts | mobile375HidesLineNumbers |
| term-009 | src/components/terminal/TerminalShell.test.tsx | reducedMotionStopsCursorBlinkAndBoot |
| term-010 | src/components/terminal/BootSequence.test.tsx | bootSequenceCompletesWithin1500msAndCanSkip |

## 10-admin-channel-crud

| Spec-ID | Test File | Test Function |
|---------|-----------|---------------|
| ach-001 | src/app/(admin)/admin/channels/page.test.tsx | listShowsAllChannelsByOrder |
| ach-002 | src/app/(admin)/admin/channels/page.test.tsx | upArrowSwapsOrder |
| ach-003 | src/app/(admin)/admin/channels/page.test.tsx | enabledToggleUpdates |
| ach-004 | src/app/(admin)/admin/channels/page.test.tsx | rowClickNavigatesToEdit |
| ach-005 | src/app/(admin)/admin/channels/new/page.test.tsx | renders5StepForm |
| ach-006 | src/app/(admin)/admin/channels/new/page.test.tsx | notesKindFiltersLayoutsToTimelineFeed |
| ach-007 | src/app/(admin)/admin/channels/new/page.test.tsx | linksKindFiltersLayoutsToGrepCards |
| ach-008 | src/app/(admin)/admin/channels/new/page.test.tsx | guestbookKindRejectedFromManualCreation |
| ach-009 | src/app/api/admin/channels/route.test.ts | conflictSlugReturns409 |
| ach-010 | src/lib/schemas/channel.test.ts | invalidSlugFailsZodValidation |
| ach-011 | src/app/(admin)/admin/channels/new/page.test.tsx | submitValidFormCreatesAndRedirects |
| ach-012 | src/app/(admin)/admin/channels/[id]/edit/page.test.tsx | editFormPrefillsValues |
| ach-013 | src/app/(admin)/admin/channels/[id]/edit/page.test.tsx | layoutChangeUpdatesFrontend |
| ach-014 | src/app/api/admin/channels/[id]/route.test.ts | deleteCascadesToEntries |
| ach-015 | src/app/api/admin/channels/[id]/route.test.ts | guestbookDeleteForbidden |

## 11-admin-entry-editor

详见 `specs/11-admin-entry-editor/capability.md`，全部映射到：

- `src/components/admin/entries/EntryEditor.test.tsx`
- `src/app/api/admin/entries/route.test.ts`
- `src/app/api/admin/entries/[id]/route.test.ts`
- `src/lib/schemas/entryMetadata.test.ts`

## 12-auth-magic-link

详见 `magic-link-auth.md` §9 + `specs/12-auth-magic-link/capability.md`，映射到：

- `src/lib/email/sendMagicLink.test.ts`
- `src/lib/security/rateLimit.test.ts`
- `src/lib/auth.test.ts`
- `src/proxy.test.ts`
- `src/app/(site)/login/page.test.tsx`

## 13-guestbook

| Spec-ID | Test File | Test Function |
|---------|-----------|---------------|
| gb-001 | src/app/(site)/guestbook/page.test.tsx | unauthedSeesLoginForm |
| gb-002 | src/app/(site)/guestbook/page.test.tsx | authedVisitorWithoutThreadSeesStartForm |
| gb-003 | src/app/(site)/guestbook/page.test.tsx | authedVisitorWithThreadSeesMessages |
| gb-004 | src/app/(site)/guestbook/page.test.tsx | adminSeesAllVisitorThreads |
| gb-005 | src/app/api/guestbook/threads/route.test.ts | postCreatesGuestbookThreadEntry |
| gb-006 | src/app/api/guestbook/comments/route.test.ts | visitorReplyCreatesPrivateComment |
| gb-007 | src/app/api/guestbook/comments/route.test.ts | adminReplyCreatesPrivateComment |
| gb-008 | src/app/(site)/guestbook/[threadId]/page.test.tsx | thirdPartyVisitorReceives404 |
| gb-009 | src/app/api/guestbook/threads/[id]/route.test.ts | adminCanMarkResolved |
| gb-010 | src/lib/security/rateLimit.test.ts | guestbookCommentRateLimit3In5min |
| gb-011 | src/lib/schemas/guestbookMessage.test.ts | rejectsMessageOver2000Chars |

## 14-recommendation

详见 `recommendation-algorithm.md` §12 + `specs/14-recommendation/capability.md`，映射到：

- `src/lib/services/trending.test.ts`
- `src/lib/services/similarEntries.test.ts`
- `src/lib/services/nextEntry.test.ts`
- `src/lib/jobs/cron-runner.test.ts`
- `src/lib/jobs/recomputeTrending.test.ts`
- `src/lib/security/rateLimit.test.ts`

## 15-migration / 16-cleanup

详见各 capability.md（每个 spec 含 Test File 行）。

---

## Vitest setup 配置

`vitest.config.ts` 增加 integration test pattern：

```typescript
test: {
  include: [
    'src/**/*.test.{ts,tsx}',
    'prisma/__tests__/*.test.ts',
  ],
  environment: 'jsdom',
  setupFiles: ['./vitest.setup.ts'],
  pool: 'forks',  // integration test 需要隔离 db
}
```

E2E test 走 Playwright，独立 `playwright.config.ts`。

---

<!-- 此文件由 explore 自动生成草稿，请审阅。生成时间：2026-05-25T14:00:00Z -->
