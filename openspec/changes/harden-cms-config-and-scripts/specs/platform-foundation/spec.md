# Spec Delta: platform-foundation

## Change: harden-cms-config-and-scripts

## MODIFIED Requirements

### Requirement: Payload CMS SHALL fail fast when critical secrets are missing

The CMS SHALL throw an error at startup if `PAYLOAD_SECRET` is not set, rather than falling back to an empty string. This prevents silent security degradation in non-development environments.

#### Scenario: PAYLOAD_SECRET not set

- Given PAYLOAD_SECRET is missing from environment
- When the CMS starts
- Then it throws an error with a clear message
- And the process exits without starting the server

### Requirement: CMS CORS/CSRF origins SHALL be configurable via environment variables

The CMS SHALL read allowed origins from the `PAYLOAD_CORS_ORIGINS` environment variable (comma-separated), defaulting to `http://localhost:4321` for local development. Both `cors` and `csrf` settings SHALL use the same origin list.

#### Scenario: Production deployment with custom domain

- Given PAYLOAD_CORS_ORIGINS is set to "https://blog.example.com"
- When the CMS starts
- Then CORS and CSRF allow requests from that domain
