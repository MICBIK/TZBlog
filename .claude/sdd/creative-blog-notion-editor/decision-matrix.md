# Decision Matrix — creative-blog-notion-editor

## 1. Editor Candidate Matrix

| Criterion | Weight | Novel/Tiptap | MDXEditor | Milkdown |
|-----------|--------|--------------|-----------|----------|
| Notion-like editing | 30 | 5 | 3 | 3 |
| Markdown import/export safety | 30 | 2-3 | 4-5 | 4 |
| Custom block extensibility | 15 | 5 | 3 | 4 |
| Bundle/control cost | 10 | 3 | 3 | 3 |
| Existing ecosystem maturity | 10 | 5 | 4 | 4 |
| Integration risk | 5 | 2 | 4 | 3 |

Initial ranking before POC:

1. Novel/Tiptap if fixture passes.
2. MDXEditor if Markdown fidelity matters more than Notion-like polish.
3. Milkdown only if both above fail important constraints.

Hard gate:

- A candidate cannot be selected if `markdownImportExport !== "pass"` or `renderMarkdownParity !== "pass"`.
- A candidate cannot be selected if any P0 publish-critical feature remains in `unsupportedMarkdownFeatures`.

P0 publish-critical features:

- heading
- paragraph
- bold / italic / inline code
- link
- image
- blockquote
- ordered/unordered list
- code fence with language
- table
- GH alert callout
- Chinese text and blank line preservation

## 2. Public UI Direction Matrix

| Direction | Strength | Weakness | TZBlog use |
|-----------|----------|----------|------------|
| Firefly/Fuwari rich blog | Complete information architecture, high-density discovery, strong blog mechanics | Can become busy/template-like | Use for posts index, rails, search/filter density |
| idealclover personal card | Strong personal identity and external profile aggregation | Too cute if copied directly | Use for homepage identity/content split |
| Rauno interaction minimalism | High-quality micro-interaction, restrained visual system | Not enough content density alone | Use for hover/focus/nav/motion feel |
| Maggie garden | Excellent content taxonomy and personal narrative | Hand-drawn style not aligned | Use for IA and About/home categories |
| Maxime/samwho/Nicky interactive writing | Best article creativity and explanation quality | Too expensive for every article | Use for optional article explainer block |
| Codrops motion library | Rich local motion patterns | Can overpower content | Use as pattern source only |

Recommended blend:

```text
Home = idealclover structure + Maggie IA + Rauno interaction
Posts = Firefly/Fuwari density + inspurer metadata completeness
Article = existing markdown quality + Maxime/samwho interactive affordance
Motion = Rauno restraint + selective Codrops patterns
```

## 3. Phase Decision Gates

### Gate A — before dependency install

Need:

- exact package list
- bundle impact estimate
- POC target fixture
- rollback path

### Gate B — before replacing `MarkdownEditorWithPreview`

Need:

- selected editor candidate
- round-trip evidence
- preview/publish parity evidence
- save payload integration test

### Gate C — before public redesign

Need:

- homepage wireframe accepted
- post index wireframe accepted
- article shell wireframe accepted
- motion token baseline

### Gate D — before feature finish

Need:

- screenshot matrix complete
- light/dark pass
- mobile pass
- reduced motion pass
- quality gate pass

## 4. Explicit Tradeoffs

### If Novel/Tiptap passes fixture

Choose it. It best matches user preference for Notion-like editing.

Expected cost:

- custom Markdown adapter work
- callout/table/code meta edge cases
- more tests around export

### If Novel/Tiptap fails but MDXEditor passes

Choose MDXEditor. Preserve Markdown correctness and add Notion-like affordances around it.

Expected cost:

- slash command may be custom wrapper
- interaction less polished than Novel

### If both fail

Do not force replacement. Keep CodeMirror temporarily and create a new SDD for editor storage/schema strategy.

