## ADDED Requirements

### Requirement: Constrained environments SHALL avoid heavy runtime validation by default
When TZBlog is being developed on a constrained or shared machine, contributors SHALL avoid Docker image pulls, database container startup, and long-running local service validation by default unless the user explicitly requests them.

#### Scenario: AI validates work on a constrained machine
- **WHEN** an AI collaborator validates implementation work
- **THEN** it defaults to lightweight checks such as lint, type generation, static build, and OpenSpec validation, and asks the user to perform runtime verification on their own machine
