## ADDED Requirements

### Requirement: Homepage Hero SHALL display a Three.js deep-space background

The homepage Hero section SHALL render a WebGL canvas behind the identity content, displaying a starfield particle system and a slowly rotating low-poly planet.

#### Scenario: WebGL available

- **WHEN** the homepage loads in a WebGL-capable browser
- **THEN** users see animated star particles and a rotating planet behind the Hero text

#### Scenario: WebGL unavailable

- **WHEN** WebGL is not available
- **THEN** the Hero displays a CSS gradient background as fallback

### Requirement: Hero 3D animation SHALL respect reduced-motion preference

The 3D animation SHALL be disabled when the user's OS has `prefers-reduced-motion: reduce` enabled, showing a static rendered frame instead.

#### Scenario: Reduced motion enabled

- **WHEN** the user has `prefers-reduced-motion: reduce` active
- **THEN** the planet and particles are rendered as a static scene with no animation loop
