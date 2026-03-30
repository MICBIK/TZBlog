# Spec Delta: platform-foundation

## Change: enhance-hero-planet-rendering

## MODIFIED Requirements

### Requirement: Hero 3D Planet Surface Quality

The hero planet sphere MUST display procedural crater bump mapping to convey a textured, moon-like surface consistent with the cosmic observatory theme.

#### Scenario: Crater bump map is applied

- Given the SiteLayout Three.js scene is initialized
- When the planet mesh is created
- Then a `bumpMap` generated via Canvas 2D (180 random radial-gradient craters on 1024×512 canvas) is assigned to `MeshStandardMaterial`
- And `bumpScale` is set between 2.0 and 5.0
- And the diffuse color remains in the warm brown-yellow Saturn palette

### Requirement: Hero 3D Planet Ring System

The hero planet ring system MUST be rendered exclusively with particles (no RingGeometry mesh), and MUST have visible volumetric thickness.

#### Scenario: RingGeometry is removed

- Given the SiteLayout Three.js scene is initialized
- When the ring system is built
- Then no `THREE.RingGeometry` mesh exists in the scene
- And no `generateRingTexture` function is called

#### Scenario: Thick particle ring is rendered

- Given the ring particle system is constructed
- When particles are distributed
- Then total particle count is ≥ 60000
- And particles span radial range r = 24 to 52
- And y-axis spread ranges from ±0.6 (inner) to ±2.0 (mid ring), giving visible thickness
- And particle sizes vary randomly between 0.04 and 0.18
- And particle colors use warm sand tones matching the planet palette

### Requirement: Hero 3D Planet Drag Rotation

The hero planet MUST support smooth 360° drag rotation in any direction without gimbal lock or axis flip artifacts.

#### Scenario: Quaternion-based drag accumulation

- Given the user clicks and drags on the viewport
- When horizontal or vertical drag delta is applied
- Then rotation is accumulated via `THREE.Quaternion` multiplication (not Euler angle assignment)
- And horizontal drag rotates around the world Y axis
- And vertical drag rotates around the local X axis
- And rotating past ±90° on any axis produces no direction reversal or lock

#### Scenario: Auto-rotation and mouse parallax coexist with drag quaternion

- Given the planet has a drag quaternion state
- When the animation loop runs
- Then auto Y-rotation is composed with the drag quaternion each frame
- And mouse parallax camera offset continues to function independently
