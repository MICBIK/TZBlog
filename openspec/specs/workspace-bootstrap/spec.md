# workspace-bootstrap Specification

## Purpose

Define the minimum local development foundation required for TZBlog contributors to run the monorepo, the Astro frontend, the Payload CMS backend, and the PostgreSQL development database.
## Requirements
### Requirement: Repository SHALL provide a workspace-based local development foundation
The repository SHALL provide a workspace-based project structure with dedicated `apps/web`, `apps/cms`, and `infra` locations so contributors can work on the frontend, backend, and local services independently.

#### Scenario: Contributor opens the repository for development
- **WHEN** a contributor inspects the repository structure
- **THEN** the repository exposes clear application and infrastructure directories for web, CMS, and local service setup

### Requirement: Repository SHALL provide a runnable Astro web skeleton
The repository SHALL provide an Astro application in `apps/web` with at least a homepage route and an article detail placeholder route that can be used as the starting point for later content integration.

#### Scenario: Frontend baseline is started
- **WHEN** the frontend application is started in development mode
- **THEN** contributors can access a homepage skeleton and an article detail placeholder route from the Astro app

### Requirement: Repository SHALL provide a runnable Payload CMS skeleton
The repository SHALL provide a Payload application in `apps/cms` configured to use PostgreSQL through environment variables, so the CMS can be started against the local database baseline.

#### Scenario: Backend baseline is started
- **WHEN** the CMS application is started with valid environment variables
- **THEN** Payload uses PostgreSQL-based configuration and can enter its normal development startup path

### Requirement: Repository SHALL provide local PostgreSQL development infrastructure
The repository SHALL provide a Docker Compose configuration for local PostgreSQL development, including persistent storage and environment-driven credentials.

#### Scenario: Local database is required
- **WHEN** a contributor starts local infrastructure for development
- **THEN** PostgreSQL can be launched from the repository infrastructure configuration with persistent local data

### Requirement: Repository SHALL provide documented local startup and shutdown instructions
The repository SHALL provide a maintained local runbook describing how to prepare environment files, start PostgreSQL, start Payload CMS, start Astro web, access local URLs, stop all services cleanly, and troubleshoot common local setup failures.

#### Scenario: Contributor starts the full local stack
- **WHEN** a contributor follows the documented local runbook
- **THEN** they can start PostgreSQL, Payload CMS, and Astro web in a correct order and know the expected local access URLs

#### Scenario: Contributor only needs a subset of services
- **WHEN** a contributor only wants to inspect the web UI or CMS admin
- **THEN** the runbook explains which services are required for each local preview mode

#### Scenario: Contributor stops local development
- **WHEN** a contributor finishes a local session
- **THEN** the runbook provides explicit commands for stopping app processes and shutting down the local PostgreSQL container

#### Scenario: Contributor hits a common local startup failure
- **WHEN** Docker is not running, a required env file is missing, a port is occupied, or the CMS cannot connect to PostgreSQL
- **THEN** the runbook provides basic diagnosis steps and the next command to try

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

