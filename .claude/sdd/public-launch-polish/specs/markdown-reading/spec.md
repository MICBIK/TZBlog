# markdown-reading spec

## SCENARIO: markdown-reading-001

**GIVEN** Markdown content contains GitHub-style alert blockquotes for NOTE, TIP, IMPORTANT, WARNING, and CAUTION
**WHEN** `renderMarkdown` processes the content
**THEN** each alert becomes sanitized semantic callout markup with stable classes, labels, and preserved Markdown body content

## SCENARIO: markdown-reading-002

**GIVEN** Markdown content includes headings, paragraphs, links, inline code, fenced code blocks, blockquotes, lists, and tables
**WHEN** the public Markdown preview component renders it
**THEN** the wrapper uses the project-owned `.markdown-body` reading class instead of relying on unavailable typography plugin defaults

## SCENARIO: markdown-reading-003

**GIVEN** the Markdown CSS is loaded
**WHEN** the reader views generated Markdown HTML
**THEN** headings, paragraphs, links, inline code, code blocks, blockquotes, tables, and all callout variants have explicit visual rules with dark-mode compatible tokens

## SCENARIO: markdown-reading-004

**GIVEN** user-authored Markdown includes dangerous embedded HTML
**WHEN** the callout transform and renderer run
**THEN** sanitize protection remains active and dangerous scripts/handlers are stripped

