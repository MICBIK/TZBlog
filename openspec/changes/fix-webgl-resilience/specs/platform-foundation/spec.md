# Spec Delta: platform-foundation

## Change: fix-webgl-resilience

## ADDED Requirements

### Requirement: Three.js background SHALL degrade gracefully when WebGL is unavailable

The Three.js celestial background SHALL be wrapped in error handling so that WebGL initialization failures do not crash the page. When WebGL is unavailable, the canvas SHALL be hidden and the rest of the page SHALL render normally. All window event listeners SHALL be cleaned up on page unload.

#### Scenario: WebGL not supported

- Given the user's browser does not support WebGL
- When the page loads
- Then the 3D canvas is hidden without errors
- And the rest of the page renders normally
