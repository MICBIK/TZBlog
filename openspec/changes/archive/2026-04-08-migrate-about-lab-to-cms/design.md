# Design: migrate-about-lab-to-cms

## CMS 新增

- `globals/SiteProfile.ts`: name, role, avatar, summary, techStack (group with 4 arrays), timeline (array)
- `collections/LabExperiments.ts`: title, summary, status, href, tag

## payload.ts 新增函数

- `getSiteProfile()` → AboutProfile (fallback to content.ts)
- `getTimeline()` → timeline array (fallback to content.ts)
- `getLabExperiments()` → LabEntry[] (fallback to content.ts)

## 页面改造

- about/index.astro: import from payload.ts instead of content.ts
- lab/index.astro: import from payload.ts instead of content.ts
