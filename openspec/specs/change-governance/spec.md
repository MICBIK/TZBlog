# change-governance Specification

## Purpose

Define the repository-level governance rules that make every substantive TZBlog change traceable through OpenSpec artifacts from proposal to archive.
## Requirements
### Requirement: Substantive changes MUST have an OpenSpec change record
Any non-trivial feature, bug fix, architectural adjustment, deployment change, workflow change, or requirement-level documentation change MUST have an OpenSpec change record before implementation starts.

#### Scenario: New formal work enters the repository
- **WHEN** a contributor starts a non-trivial change
- **THEN** an OpenSpec change with proposal, relevant specs, and tasks exists before formal implementation proceeds

### Requirement: Task tracking MUST reflect real execution progress
Each active change MUST maintain a `tasks.md` file that reflects actual implementation progress using checkbox-based status updates.

#### Scenario: Implementation work is completed for a task
- **WHEN** a task in an active change is finished
- **THEN** the corresponding checkbox state is updated in `tasks.md` during the same work cycle

### Requirement: Completed changes MUST be validated and archived
When an OpenSpec change has completed its implementation and verification, it MUST be validated and archived so the repository retains a durable trace of the change.

#### Scenario: A change is ready to close
- **WHEN** all relevant tasks are complete and verification has passed
- **THEN** the change is validated, archived, and its resulting requirements are reflected in the main specs

### Requirement: Emergency fixes MUST be backfilled into OpenSpec
An emergency production or deployment fix MAY be implemented immediately to stop impact, but it MUST be backfilled into an OpenSpec change record on the same day.

#### Scenario: Emergency fix is applied first
- **WHEN** a hotfix bypasses the normal proposal-first path
- **THEN** a corresponding change record is created and completed the same day for traceability

### Requirement: Constrained environments SHALL avoid heavy runtime validation by default
When TZBlog is being developed on a constrained or shared machine, contributors SHALL avoid Docker image pulls, database container startup, and long-running local service validation by default unless the user explicitly requests them.

#### Scenario: AI validates work on a constrained machine
- **WHEN** an AI collaborator validates implementation work
- **THEN** it defaults to lightweight checks such as lint, type generation, static build, and OpenSpec validation, and asks the user to perform runtime verification on their own machine

