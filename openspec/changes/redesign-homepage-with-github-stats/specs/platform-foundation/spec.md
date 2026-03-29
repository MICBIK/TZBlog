## ADDED Requirements

### Requirement: TZBlog homepage SHALL present a clear personal identity section

The homepage SHALL include a Hero section that displays the site owner's name, role/title, and social links (GitHub, Email, RSS) as the primary identity layer.

#### Scenario: User lands on homepage

- **WHEN** the homepage is rendered
- **THEN** users can immediately identify who owns this blog and how to connect externally

### Requirement: TZBlog homepage SHALL display GitHub activity data

The homepage SHALL include a contribution heatmap showing the last 12 months of GitHub contributions, along with summary metrics.

#### Scenario: User views GitHub activity section

- **WHEN** the GitHub activity section loads
- **THEN** users can see a visual calendar heatmap and key contribution metrics

### Requirement: TZBlog homepage SHALL display open-source project cards with live star counts

The homepage SHALL display curated open-source projects with real-time stargazer counts fetched from GitHub REST API.

#### Scenario: Project stats are displayed

- **WHEN** the projects section renders
- **THEN** each project card shows name, description, language tag, and current star count

### Requirement: TZBlog homepage SHALL display site analytics from Umami

The homepage SHALL show a statistics bar with total pageviews, total visitors, today's pageviews, and today's visitors, fetched from Umami Analytics API.

#### Scenario: Site stats are displayed

- **WHEN** the stats section renders
- **THEN** users can see both cumulative and daily traffic metrics

## MODIFIED Requirements

### Requirement: TZBlog homepage SHALL use a simplified 5-section structure with no duplicate navigation entries

The homepage SHALL present exactly 5 focused sections (Hero Identity, GitHub Activity, Recent Posts, About/Tech Stack, Site Stats) and SHALL NOT duplicate navigation entries that already exist in the site header.

#### Scenario: Homepage sections are rendered

- **WHEN** the homepage is loaded
- **THEN** the page contains exactly 5 content sections and no navigation link appears more than once in the page body
