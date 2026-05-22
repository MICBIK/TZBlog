# admin-contrast spec

## SCENARIO: admin-contrast-001

**GIVEN** the admin shell is rendered in light mode
**WHEN** sidebar navigation links and header metadata are displayed
**THEN** text uses readable foreground tokens (`muted-fg`/`fg`) rather than the light muted background token

## SCENARIO: admin-contrast-002

**GIVEN** the admin shell is rendered in light or dark mode
**WHEN** navigation links are hovered or focused
**THEN** interactive states preserve contrast and use semantic background/foreground tokens

