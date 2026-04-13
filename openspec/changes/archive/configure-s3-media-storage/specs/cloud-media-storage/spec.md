## ADDED Requirements

### Requirement: Media uploads SHALL be stored in S3-compatible cloud storage

Payload CMS media uploads SHALL use the `@payloadcms/storage-s3` adapter to persist files to an S3-compatible service (AWS S3 or Cloudflare R2).

#### Scenario: Media file upload

- **WHEN** an editor uploads an image via CMS admin
- **THEN** the file is stored in the configured S3/R2 bucket and a public URL is returned

#### Scenario: No S3 configuration

- **WHEN** S3 environment variables are not configured
- **THEN** CMS falls back to local filesystem storage for development
