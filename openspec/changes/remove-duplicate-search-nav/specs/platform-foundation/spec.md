# Spec Delta: platform-foundation

## Change: remove-duplicate-search-nav

## MODIFIED Requirements

### Requirement: Primary Navigation Structure

The site primary navigation MUST NOT contain a redundant search entry when a dedicated Search Relay CTA already exists in the header.

#### Scenario: Search entry is removed from navItems

- Given the site header is rendered
- When `navItems` is iterated to build the `<nav>` element
- Then no nav link with href `/search` appears inside the `<nav>` element
- And the Search Relay CTA button remains present in the header outside the `<nav>`
- And navigating to `/search` continues to work via the Search Relay button

#### Scenario: Downstream nav filters are unaffected

- Given `footerNavItems` filters out `/search` from `navItems`
- And `mainContentNavItems` filters out `/search` from `navItems`
- When the search entry is removed from `navItems`
- Then `footerNavItems` and `mainContentNavItems` produce identical output as before
- And no footer or content nav link is lost
