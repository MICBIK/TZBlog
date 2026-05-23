export interface Principle {
  id: string;
  heading: string;
  detail: string;
  isFeatured: boolean;
}

export const principles: Principle[] = [
  {
    id: "source-first-publishing",
    heading: "Source-first publishing",
    detail:
      "写作入口必须保留 Markdown 字面，编辑器只帮助组织文本，不替作者隐藏源格式。",
    isFeatured: true,
  },
  {
    id: "markdown-is-the-source",
    heading: "Markdown is the source",
    detail:
      "预览、发布、RSS、搜索摘要都从同一份 Markdown 字符串派生，避免多份状态漂移。",
    isFeatured: true,
  },
  {
    id: "document-tradeoffs",
    heading: "Document tradeoffs",
    detail:
      "每个重要决策都写清边界、风险和延后项，让后续维护能复原当时的判断。",
    isFeatured: true,
  },
  {
    id: "self-host-the-whole-loop",
    heading: "Self-host the whole loop",
    detail:
      "应用、数据库、对象存储、代理和部署脚本放在可检查的闭环里，减少黑盒依赖。",
    isFeatured: true,
  },
  {
    id: "small-surface-area",
    heading: "Small surface area",
    detail:
      "优先使用项目已经理解的工具和 token，新增依赖必须能解释长期收益。",
    isFeatured: false,
  },
  {
    id: "visible-failure",
    heading: "Visible failure",
    detail:
      "失败必须通过 toast、banner 或明确错误暴露出来，不能用空值和 console 悄悄吞掉。",
    isFeatured: false,
  },
  {
    id: "content-over-chrome",
    heading: "Content over chrome",
    detail:
      "界面表达靠排版、节奏和少量动效完成，不让装饰抢走阅读主体。",
    isFeatured: false,
  },
  {
    id: "ship-with-audit-trails",
    heading: "Ship with audit trails",
    detail:
      "功能完成不等于结束，测试输出、浏览器截图和 memory-bank 记录都要能追溯。",
    isFeatured: false,
  },
];

export function getHomePrinciples(): Principle[] {
  return principles.filter((principle) => principle.isFeatured);
}

export function getAboutPrinciples(): Principle[] {
  return principles;
}
