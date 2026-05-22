# test-map.md — about-page

| spec-id | 测试函数 | 文件 | 层级 |
|---|---|---|---|
| SPEC-AB-D-1 | `aboutContent shape matches type` | `src/lib/content/about.test.ts` | node |
| SPEC-AB-D-2 | `about.ts has TODO[pre-launch] warning` | 同上 | node |
| SPEC-AB-D-3 | `aboutContent fields non-empty` | 同上 | node |
| SPEC-AB-S-1 | `AboutHero renders headline + lead + ABOUT label` | `src/components/site/about/AboutHero.test.tsx` | jsdom |
| SPEC-AB-S-2 | `AboutNow renders intro + items list` | `src/components/site/about/AboutNow.test.tsx` | jsdom |
| SPEC-AB-S-3 | `AboutStory renders prose paragraphs` | `src/components/site/about/AboutStory.test.tsx` | jsdom |
| SPEC-AB-S-4 | `AboutContact renders mailto + external links` | `src/components/site/about/AboutContact.test.tsx` | jsdom |
| SPEC-AB-P-1 | `AboutPage renders 4 sections in order` | `src/app/(site)/about/page.test.tsx` | jsdom |
| SPEC-AB-P-2 | `AboutPage exports metadata with title + description` | 同上 | node-or-jsdom |
| SPEC-AB-P-3 | `AboutPage uses semantic headings (1 h1, 3 h2)` | 同上 | jsdom |
