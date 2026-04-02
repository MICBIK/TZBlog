# Spec Delta: platform-foundation

## Change: add-ci-pipeline

## ADDED Requirements

### Requirement: TZBlog SHALL have automated CI on every push and PR

Every push to main and every pull request targeting main SHALL trigger an automated CI pipeline that runs lint, tests, and build. A failing step SHALL block the pipeline.

#### Scenario: PR with type error

- Given a PR introduces a TypeScript error
- When CI runs
- Then the lint step fails and the PR shows a red check
