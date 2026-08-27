# SNOW REMOVAL — Build Preparation

## Prioritized prototype backlog

### P0 — First playable

- [x] No-build HTML/CSS/Canvas shell.
- [x] Arcade truck steering, forward/reverse, road containment, obstacle collision.
- [x] Lowerable blade that transfers snow to one side.
- [x] Continuous snowfall with gust/visibility variation.
- [x] Fuel and salt resources; depot resupply.
- [x] Parked-car obstacles.
- [x] Three destination approach zones and civic-access score.
- [x] Driveway/hydrant sensitive zones and harmful-placement penalty.
- [x] Shift timer, event log, end-state debrief, restart.
- [x] Living GDD and decision log.

### P1 — Legibility and tuning

- [x] Cohesive v0.3 environment pass: continuous roads, curb blocks, lit/snow-capped landmarks, roadside scenery, dimensional vehicles, and storm vignette.
- [x] Bilinearly smoothed snow surface with shaped high-depth banks; simulation tiles are no longer directly visible.
- [x] First-shift briefing with paused clock and scenario-specific dispatch context.
- [x] Volume-driven blade-right spray trail tied to actual snow transfer.
- [x] Depot-to-destination connectivity through passable snow cells.
- [x] World-map visualization of the connected access network.
- [x] Gamepad API support matching the planned Unity action map.
- [ ] Keyboard remapping and configurable gamepad bindings.
- [x] Dependency-free synthesized cues for blade, impact, low resource, NPC, destination, and outcome status.
- [x] Seeded scenario selection, shareable query parameter, parked-car patterns, and deterministic reset.
- [x] Dependency-free tests for seed stability, connectivity, access hysteresis, and score thresholds.
- [x] Static project-integrity tests for local assets, script order, runtime dependencies, and DOM contracts.
- [x] Explicit `qa=1` short-shift hook for browser-testing end-state flows.
- [x] Downloadable versioned JSON debrief for seeded playtest comparison.
- [x] Persistent repeat-briefing and reduced-weather presentation preferences.

### P2 — Systems proof

- [ ] Packed snow/ice state and temperature-driven refreeze.
- [x] One NPC delivery van that can become stuck in deep snow and recover when cleared.
- [ ] Tow interaction and recoverable obstruction.
- [ ] Second vehicle/AI helper interface.
- [x] Optional two-plus-shift snow-field aftermath with slight between-shift settling.
- [ ] Repair cost and simple seasonal budget mock.

### P3 — Unity migration spikes

- [ ] Import map/zone JSON into ScriptableObjects.
- [ ] 3D surface-chunk snow transfer benchmark.
- [ ] Two-player host-authoritative vehicle and snow delta test.
- [ ] Controller-first cab/exterior camera test.

## Milestone plan

| Milestone | Deliverable | Exit signal |
|---|---|---|
| M0 Design-ready | Documents, scope, architecture, scaffold | Another developer can implement without unresolved fundamentals |
| M1 Functional loop | Current browser v0.1 | One complete shift is playable from file open to debrief |
| M2 Readable slice | Current browser v0.3: cohesive art pass, onboarding, scenarios, feedback, sound, controller | 4/5 new players explain access versus placement tradeoff |
| M3 Durable systems | Seeds, NPC incident, persistence mock | Two shifts produce distinct, recoverable aftermath stories |
| M4 Unity proof | 3D/network spikes | Two clients observe consistent useful snow state |

## Vertical-slice acceptance criteria

### Required behavior

1. `index.html` opens directly in current Chrome, Edge, and Firefox without a server.
2. Player can drive, reverse, steer, toggle blade, spread salt, and restart.
3. Snow accumulates during the shift and visibly reduces under a lowered moving blade.
4. Most cleared snow reappears beside the truck's pass.
5. At least three marked destinations report changing access values.
6. Placing snow on a marked driveway/hydrant produces an amber warning and score harm.
7. Parked cars block the truck and impose a small collision penalty.
8. Fuel and salt decrease from relevant actions; depot restores both.
9. A 4-minute-or-shorter shift ends in a debrief with access, harm, and resource components.
10. Reset returns all mutable state to a fresh, playable shift.

### Quality thresholds

- Controls are discoverable without opening documentation.
- Critical state never depends on color alone.
- No uncaught console errors during two full shifts.
- Update loop survives a background-tab pause without a simulation jump.
- A player can earn both a passing and failing result through understandable choices.
- Average frame time remains under 33 ms on a typical integrated-GPU laptop.

## Initial controls specification

| Action | Keyboard | State/behavior |
|---|---|---|
| Throttle | W / Up | Accelerates along heading while held |
| Brake/reverse | S / Down | Brakes forward motion, then reverses |
| Steer left/right | A/D or Left/Right | Steering authority scales with speed; reduced in deep snow |
| Toggle plow | Space | Edge-triggered; switches raised/lowered |
| Spread salt | E | Hold; consumes salt and treats cells behind truck |
| Reset shift | R | Edge-triggered; restores initial state |
| Next scenario | N | Edge-triggered; advances the deterministic scenario and returns to READY |
| Pause/resume | P / Escape | Freezes weather, vehicle, incidents, and shift time; focus loss pauses automatically |

Implemented controller mapping: RT throttle, LT brake/reverse, left stick steering, A blade toggle, X salt, Menu starts/pauses/resumes the shift.

## State-machine specifications

### Shift

`READY → ACTIVE ↔ PAUSED → DEBRIEF`

- READY: static instructions; first movement or tool input enters ACTIVE.
- ACTIVE: timer, weather, resources, scoring, and vehicle simulate.
- PAUSED: simulation and shift time freeze; focus loss enters this state automatically.
- DEBRIEF: simulation freezes; final metrics shown; reset returns READY.

The current slice enters READY behind a concise briefing. The shift clock remains paused until the player presses Enter, clicks Begin Shift, or provides a driving/tool input.

### Truck

`OPERABLE ↔ COLLISION_STUN`, with orthogonal blade state `RAISED | LOWERED`.

- OPERABLE accepts motion/tool input.
- COLLISION_STUN applies bounce and suppresses repeat penalties for 0.6 seconds.
- Fuel at zero keeps steering/braking but removes positive drive torque.
- Entering depot triggers resupply with a short message cooldown.

### Destination access

`BLOCKED (<45%) → STRAINED (45–69%) → OPEN (≥70%)`

Access is the proportion of sampled approach cells at or below the clear-depth threshold and connected to the yard. Hysteresis suppresses dispatch chatter around status thresholds.

### Sensitive zone

`CLEAR (<risk depth) → AT_RISK → BURIED (≥buried depth)`

Penalty is derived continuously from excess depth, while events fire only on state transitions to avoid message spam.

## Suggested production module structure

```text
snow-removal/
  index.html
  styles.css
  src/
    main.js
    config.js
    input.js
    simulation/
      shift.js
      vehicle.js
      snow-field.js
      weather.js
      access.js
      scoring.js
    world/
      bellwether-map.js
      collision.js
    presentation/
      renderer.js
      hud.js
      audio.js
    data/
      scenarios.js
      vehicles.js
  tests/
    snow-field.test.js
    access.test.js
    scoring.test.js
  docs/
    GDD.md
    BUILD_PREP.md
```

The v0.1 code stays in one `app.js` so it can launch via `file://` without module/CORS inconsistencies. Split it when automated tests or a local dev server are introduced.

## Test and QA checklist

### Smoke

- [x] Open from disk; canvas and HUD render.
- [ ] Complete a shift using WASD only plus Space/E.
- [x] Reset during play and after debrief.
- [ ] Resize window below and above canvas width.

### Vehicle and tools

- [ ] Forward, reverse, and steering directions feel consistent.
- [ ] Truck cannot leave map or pass through parked cars/buildings.
- [ ] Blade raised leaves snow unchanged except weather.
- [x] Blade transfer conserves explicitly reported moved/lost mass and protects same-cell map edges.
- [ ] Salt does nothing at zero inventory and never becomes negative.
- [ ] Fuel does not become negative; depot restores resources.

### Snow and scoring

- [ ] Snow accumulates across all exposed cells.
- [ ] Priority access improves after a clean pass.
- [ ] A right-side bank can bury a marked sensitive zone.
- [ ] Clearing a buried zone reduces its live penalty.
- [ ] Score components reconcile with displayed final score.
- [ ] Deep snow creates more drag than a clear road.

### Robustness and accessibility

- [x] No console errors during scenario/reset/onboarding browser smoke test.
- [x] Inputs clear when window loses focus.
- [ ] Labels/icons distinguish route, depot, destination, and hazard without color.
- [ ] HUD remains readable at 200% browser zoom.
- [x] Reduced-weather visual assist leaves simulation difficulty unchanged.

## File-level next implementation tasks

1. `core.js`: tune transfer retention/capacity using exported playtest mass totals.
2. `app.js`: tune the visible connected-network overlay and passable-depth threshold from playtests.
3. `app.js`: tune destination hysteresis thresholds and dispatch wording from playtests.
4. `app.js`: add configurable keyboard/gamepad bindings and controller-specific button glyphs.
5. `styles.css` / `index.html`: expand the inline accessibility preferences into remappable settings.
6. `assets/`: add original engine/blade/salt/alert audio after interaction tuning.
7. `tests/`: add browser smoke automation and snow-mass invariants; project-integrity coverage is in place.
