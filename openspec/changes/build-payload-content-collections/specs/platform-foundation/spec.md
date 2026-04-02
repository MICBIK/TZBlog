# Spec Delta: platform-foundation

## Change: build-payload-content-collections

## ADDED Requirements

### Requirement: Payload CMS SHALL provide a Posts collection for article content management

The CMS SHALL include a `posts` collection with fields: slug (unique), title, summary, category, orbit, publishedAt (date), readTime, featured (checkbox), tags (array), sections (array of id/title/paragraphs/bullets). The collection SHALL support draft/publish workflow.

#### Scenario: Editor creates and publishes a post

- Given the Payload Admin is accessible at `http://localhost:3000/admin`
- When an editor fills in all required fields and clicks Publish
- Then the post is stored in PostgreSQL with `_status = published`
- And the post is accessible via `GET /api/posts?where[slug][equals]=<slug>&where[_status][equals]=published`

#### Scenario: Draft post is not exposed publicly

- Given a post exists with `_status = draft`
- When the Astro frontend queries `/api/posts?where[_status][equals]=published`
- Then the draft post does NOT appear in the response

### Requirement: Payload CMS SHALL provide a Projects collection for project content management

The CMS SHALL include a `projects` collection with fields: slug (unique), title, summary, stage (select: In Progress/Planned/Concept/Stable/Archived), orbit, updatedAt (date), featured (checkbox), stack (array), tags (array), links (array of label/href), highlights (array), sections (array). The collection SHALL support draft/publish workflow.

#### Scenario: Editor creates and publishes a project

- Given the Payload Admin is accessible
- When an editor fills in all required fields including stage and updatedAt and publishes
- Then the project is accessible via `GET /api/projects?where[_status][equals]=published`
- And the stage field value matches one of the defined select options

### Requirement: Payload CMS SHALL provide a Docs collection for documentation content management

The CMS SHALL include a `docs` collection with fields: slug (unique), title, summary, version, orbit, updatedAt (date), tags (array), sections (array). The collection SHALL support draft/publish workflow.

#### Scenario: Editor creates and publishes a doc

- Given the Payload Admin is accessible
- When an editor fills in all required fields and publishes
- Then the doc is accessible via `GET /api/docs?where[_status][equals]=published`

### Requirement: Payload CMS SHALL provide a Notes collection for short-form content management

The CMS SHALL include a `notes` collection with fields: slug (unique), title, summary, publishedAt (date), mood, tags (array), sections (array). The collection SHALL support draft/publish workflow.

#### Scenario: Editor creates and publishes a note

- Given the Payload Admin is accessible
- When an editor fills in all required fields and publishes
- Then the note is accessible via `GET /api/notes?where[_status][equals]=published`

### Requirement: All content collections SHALL be registered in payload.config.ts

The `payload.config.ts` SHALL import and register Posts, Projects, Docs, and Notes collections alongside the existing Users and Media collections.

#### Scenario: Payload CMS starts with all collections

- Given the CMS is started with `pnpm dev` in `apps/cms`
- When the admin interface loads
- Then the sidebar shows: Users, Media, Posts, Projects, Docs, Notes
- And PostgreSQL contains the corresponding tables after migration

### Requirement: Content collection write operations SHALL require an authenticated CMS user

All content collections introduced by this change SHALL keep public read access, but create/update/delete operations MUST require an authenticated CMS user.

#### Scenario: Anonymous user attempts write access

- Given a request targets create, update, or delete on `posts`, `projects`, `docs`, or `notes`
- When the request does not carry an authenticated CMS user
- Then the write operation is denied
- And public read access remains unaffected
