## ADDED Requirements

### Requirement: Repository SHALL provide a script-driven local launcher
The repository SHALL provide a script-driven local launcher for common developer preview flows so contributors can start, stop, restart, and inspect the status of the local web, CMS, and database stack without manually orchestrating each command every time.

#### Scenario: Contributor wants to preview the full local stack quickly
- **WHEN** a contributor runs the repository's local start command
- **THEN** the launcher prepares required env files, ensures dependencies exist, starts PostgreSQL, starts Payload CMS, starts Astro web, and prints the expected local URLs

#### Scenario: Contributor wants to stop local services cleanly
- **WHEN** a contributor runs the repository's local stop command
- **THEN** the launcher stops the managed web and CMS processes and shuts down the local PostgreSQL container

#### Scenario: Contributor checks whether local services are already running
- **WHEN** a contributor runs the repository's local status command
- **THEN** the launcher reports the current state of the database, CMS, and web services, including whether a port is occupied by another process
