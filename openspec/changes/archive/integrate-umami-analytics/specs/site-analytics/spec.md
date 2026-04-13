## ADDED Requirements

### Requirement: TZBlog SHALL collect visitor analytics via Umami tracking script

The site layout SHALL inject the Umami client-side tracking script in `<head>` to collect pageview and visitor data. The script SHALL only be injected when Umami configuration is present.

#### Scenario: Umami is configured

- **WHEN** `UMAMI_TRACKING_SCRIPT_URL` and `UMAMI_WEBSITE_ID` environment variables are set
- **THEN** every page includes the Umami tracking script in its `<head>`

#### Scenario: Umami is not configured

- **WHEN** Umami environment variables are missing
- **THEN** no tracking script is injected and pages render normally

### Requirement: Homepage statistics panel SHALL display live Umami data

The existing site stats bar on the homepage SHALL display real visitor data from the configured Umami instance instead of zeros.

#### Scenario: Umami returns data

- **WHEN** the homepage is built with valid Umami credentials
- **THEN** the stats bar shows actual pageview and visitor counts
