/**
 * 站点设置数据 —— 1:1 还原原型 admin-settings.html 的 9 个设置分组与全部字段。
 * 文案、默认值、开关初始态、tag、危险操作按钮均照搬原型。
 * 纯数据无副作用，供 SettingsWorkspace 渲染。
 */

export type FieldControl =
  | { kind: 'text'; value?: string; placeholder?: string }
  | { kind: 'textarea'; value?: string; rows?: number }
  | { kind: 'select'; options: string[] }
  | { kind: 'switch'; checked?: boolean }
  | { kind: 'pre'; prefix: string; em: string }
  | {
      kind: 'button';
      label: string;
      variant?: 'default' | 'warn' | 'dgr';
      msg: string;
    };

export interface FieldDef {
  /** 标签主文案 */
  k: string;
  /** 标签下方灰色提示 */
  h?: string;
  /** 标签后内联小标签（优先 / 已禁用）*/
  tag?: { text: string; variant: 'pri' | 'off' };
  ctl: FieldControl;
}

export interface SectionDef {
  /** 区块标题前的符号：# 普通 / ! 危险 */
  mark: string;
  title: string;
  desc?: string;
  danger?: boolean;
  fields: FieldDef[];
}

export const SECTIONS: SectionDef[] = [
  {
    mark: '#',
    title: '基本信息',
    fields: [
      {
        k: '站点名称',
        h: '显示在标题栏与 OG 卡片',
        ctl: { kind: 'text', value: 'tzblog' },
      },
      {
        k: '主域名',
        h: '已绑定 HTTPS，含 www 跳转',
        ctl: { kind: 'pre', prefix: 'https://', em: 'tzcode.top' },
      },
      { k: '作者署名', ctl: { kind: 'text', value: 'haiden' } },
      {
        k: '站点描述',
        h: '用于首页 meta 与 RSS',
        ctl: {
          kind: 'textarea',
          rows: 2,
          value:
            '中文优先的技术与生活博客 · AI Coding / 全栈工程 / 工具效率 / 随笔 / 作品',
        },
      },
      {
        k: '主语言',
        ctl: { kind: 'select', options: ['简体中文 (zh-CN)', 'English (en)'] },
      },
    ],
  },
  {
    mark: '#',
    title: '登录与认证',
    desc: '仅 OAuth + 邮箱 + 魔法链接，不接短信/微信',
    fields: [
      {
        k: 'GitHub OAuth',
        h: '技术读者主登录方式',
        tag: { text: '优先', variant: 'pri' },
        ctl: { kind: 'switch', checked: true },
      },
      { k: 'Google OAuth', ctl: { kind: 'switch', checked: true } },
      { k: '邮箱 + 密码', ctl: { kind: 'switch', checked: true } },
      {
        k: '邮箱魔法链接',
        h: '免密一次性登录链接',
        ctl: { kind: 'switch', checked: true },
      },
      {
        k: '短信 / 微信 / 微博 / QQ',
        h: '本站不接入',
        tag: { text: '已禁用', variant: 'off' },
        ctl: { kind: 'switch', checked: false },
      },
    ],
  },
  {
    mark: '#',
    title: '内容权限（分级访问）',
    fields: [
      {
        k: '匿名完整阅读',
        h: '保证 SEO 可抓取全文，建议常开',
        ctl: { kind: 'switch', checked: true },
      },
      { k: '点赞 / 收藏需登录', ctl: { kind: 'switch', checked: true } },
      { k: '资源下载需登录', ctl: { kind: 'switch', checked: true } },
      {
        k: '跨设备同步',
        h: '阅读进度 / 收藏夹',
        ctl: { kind: 'switch', checked: true },
      },
    ],
  },
  {
    mark: '#',
    title: '评论',
    fields: [
      { k: '开启评论', ctl: { kind: 'switch', checked: true } },
      {
        k: '先审后发',
        h: '新评论进入待审队列',
        ctl: { kind: 'switch', checked: true },
      },
      { k: '仅登录用户可评论', ctl: { kind: 'switch', checked: true } },
    ],
  },
  {
    mark: '#',
    title: '搜索与渲染',
    fields: [
      {
        k: 'Meilisearch 主机',
        h: '全文检索引擎',
        ctl: { kind: 'text', value: 'http://meili:7700' },
      },
      {
        k: 'Shiki 代码高亮',
        h: '主题 github-dark',
        ctl: { kind: 'switch', checked: true },
      },
      { k: 'KaTeX 公式渲染', ctl: { kind: 'switch', checked: true } },
    ],
  },
  {
    mark: '#',
    title: 'SEO 与备案',
    desc: '搜索引擎收录与中国大陆合规',
    fields: [
      {
        k: 'SEO 标题后缀',
        h: '拼接在每页标题之后',
        ctl: { kind: 'text', value: ' · tzblog' },
      },
      {
        k: 'Meta 关键词',
        ctl: { kind: 'text', value: 'AI Coding, 全栈, Next.js, Go, 技术博客' },
      },
      {
        k: '默认 OG 分享图',
        h: '无封面时的兜底社交卡片图',
        ctl: { kind: 'text', value: '/assets/og-default.png' },
      },
      { k: '生成 sitemap.xml', ctl: { kind: 'switch', checked: true } },
      {
        k: '允许搜索引擎收录',
        h: 'robots.txt allow',
        ctl: { kind: 'switch', checked: true },
      },
      {
        k: 'ICP 备案号',
        h: '显示于前台底栏',
        ctl: { kind: 'text', value: '浙ICP备2026000000号-1' },
      },
      {
        k: '公安备案号',
        h: '选填',
        ctl: {
          kind: 'text',
          value: '',
          placeholder: '浙公网安备 00000000000000 号',
        },
      },
    ],
  },
  {
    mark: '#',
    title: '社交与订阅',
    desc: '前台底栏与文章页展示',
    fields: [
      { k: 'GitHub', ctl: { kind: 'text', value: 'https://github.com/haiden' } },
      {
        k: 'X / Twitter',
        ctl: { kind: 'text', value: 'https://x.com/haiden_dev' },
      },
      { k: '联系邮箱', ctl: { kind: 'text', value: 'hi@tzcode.top' } },
      {
        k: '输出 RSS / Atom',
        h: '/rss.xml',
        ctl: { kind: 'switch', checked: true },
      },
    ],
  },
  {
    mark: '#',
    title: '统计分析',
    desc: '隐私友好的轻量统计',
    fields: [
      {
        k: '统计服务',
        ctl: {
          kind: 'select',
          options: [
            'Umami（自托管）',
            'Plausible',
            'Google Analytics 4',
            '不启用',
          ],
        },
      },
      { k: '站点 ID', ctl: { kind: 'text', value: 'tzblog-prod' } },
      {
        k: '上报 Web Vitals',
        h: 'LCP / INP / CLS',
        ctl: { kind: 'switch', checked: true },
      },
    ],
  },
  {
    mark: '!',
    title: '危险操作',
    desc: '以下操作不可撤销',
    danger: true,
    fields: [
      {
        k: '导出全站数据',
        h: '文章 + 评论 + 媒体清单，JSON 打包',
        ctl: { kind: 'button', label: '↧ 导出', msg: '正在打包导出…' },
      },
      {
        k: '重建搜索索引',
        h: '重新索引全部文章到 Meilisearch',
        ctl: {
          kind: 'button',
          label: '↻ 重建',
          variant: 'warn',
          msg: '已触发索引重建，约 30s',
        },
      },
      {
        k: '清空 CDN 缓存',
        ctl: {
          kind: 'button',
          label: '⌫ 清缓存',
          variant: 'warn',
          msg: 'CDN 缓存已清空',
        },
      },
      {
        k: '删除站点',
        h: '永久删除全部数据，无法恢复',
        ctl: {
          kind: 'button',
          label: '✕ 删除',
          variant: 'dgr',
          msg: '需二次确认，已取消',
        },
      },
    ],
  },
];
