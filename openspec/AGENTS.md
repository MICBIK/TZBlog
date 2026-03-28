# OpenSpec Agent Rules

Use this file together with the root `AGENTS.md`.

## Default Behavior

- Start by running `npx -y @fission-ai/openspec@1.2.0 list`
- Read `openspec/project.md`
- Read the relevant main specs in `openspec/specs/`
- If a related active change exists, continue it
- If no related active change exists, create one before implementation

## Implementation Rule

Do not start non-trivial implementation without:

- `proposal.md`
- relevant spec delta files
- `tasks.md`

Add `design.md` when the change is architectural, cross-cutting, risky, or ambiguous.

## Progress Rule

- Keep `tasks.md` synchronized with actual progress
- If scope changes, update proposal first
- If requirements change, update spec delta files first
- If implementation changes approach, update design first

## Completion Rule

Before final git commit:

1. Validate specs and change artifacts
2. Confirm tasks reflect reality
3. Archive the completed change when appropriate
4. Then create an atomic commit
