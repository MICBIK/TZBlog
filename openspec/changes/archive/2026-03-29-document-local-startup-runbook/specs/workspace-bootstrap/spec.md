## ADDED Requirements

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
