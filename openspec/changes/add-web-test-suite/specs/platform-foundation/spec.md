# Spec Delta: platform-foundation

## Change: add-web-test-suite

## ADDED Requirements

### Requirement: Web app data layer SHALL have unit test coverage

All pure data transformation functions (normalizers, array flatteners, date range calculators) SHALL have unit tests verifying correct input→output mapping, edge cases, and fallback behavior.

#### Scenario: Normalizer receives complete Payload document

- Given a normalizePost function receives a full PayloadPostDoc
- When the function runs
- Then it returns a PostEntry with ISO date truncated, tags flattened, and sections transformed
