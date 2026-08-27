# SNOW REMOVAL — Living Game Design Document

**Status:** Browser vertical slice v0.3 visual pass
**Last updated:** 2026-08-27
**North star:** Every cleared road should leave a new problem somewhere else.

## Premise

A municipal or contracted snow-removal crew keeps the small town of Bellwether functioning through escalating winter storms. Players plow, salt, tow, refuel, and improvise while snow continues to fall. Snow is matter: it moves, piles, blocks access, hides hazards, and later refreezes. The town remembers where it was left.

The long-term game is a 2–5 player co-op 3D Unity title for Steam. The first proof is a standalone, top-down Canvas game focused on the core tradeoff: clear critical access without causing more harm through careless snow placement.

## Player fantasy

Players are competent operators doing a difficult public job with imperfect information and heavy machines. Mastery comes from reading a storm, planning passes, coordinating specialized vehicles, and recovering from understandable mistakes. Comedy emerges when a quick fix cascades: one player walls in a driveway, another reroutes traffic into slush, and a third arrives with the wrong attachment.

## Audience and session shape

- Audience: co-op players who enjoy readable simulation, physical comedy, vehicle games, and task-oriented sandboxes.
- Accessibility target: approachable in under two minutes; skill ceiling from route planning and tool interaction rather than complex inputs.
- Browser slice: 3–6 minute shift, solo, instantly restartable.
- Full game: 20–35 minute jobs, grouped into 60–90 minute town sessions; solo with crew assists or 2–5 players online.
- Tone: grounded, warm, lightly absurd, never contemptuous of the work or residents.

## Design pillars

1. **Snow goes somewhere.** Plowing redistributes volume; it never simply erases it.
2. **Public good, local harm.** Fast route clearance competes with driveways, hydrants, sidewalks, parked cars, and downstream refreeze.
3. **Legible escalation.** Weather and mistakes intensify, but causes and remedies remain visible.
4. **Heavy tools, simple hands.** Controls are compact; depth comes from momentum, attachments, surface state, and teamwork.
5. **A town that remembers.** Aftermath, resident trust, budgets, and recurring places turn isolated jobs into stewardship.

## Core gameplay loop

### During a shift

1. Read forecast, priorities, vehicle state, and town complaints.
2. Choose a route and attachment posture.
3. Drive a pass: lower blade, push snow, manage traction and visibility.
4. Treat surfaces with limited salt and avoid sensitive edges.
5. Reassess access, new snowfall, fuel, hazards, and damage.
6. Refuel/resupply or improvise before the shift clock expires.
7. Return to depot or finish in the field and receive a debrief.

### Between shifts

Review outcomes, pay costs, retain town consequences, repair equipment, choose upgrades, and respond to the next forecast. Persistent snowbanks narrow future roads, buried hydrants increase fire risk, and neglected side streets reduce public trust.

The browser slice validates the first persistence layer: after debrief, players may continue into another shift with the exact snow field carried forward after small between-shift settling. Clean seeded restart remains available for controlled comparisons.

## Moment-to-moment interactions

- Accelerate, steer, brake, and reverse a weighty vehicle.
- Raise/lower the plow and choose pass angle in later versions.
- Watch the blade gather snow and cast it to the truck's right edge.
- Spread salt onto packed or icy surfaces at an ongoing resource cost.
- Thread around parked cars or accept a slower, incomplete pass.
- Read road tint, snowfall, warning markers, gauges, and radio messages.
- Decide whether to fix a harmful pile immediately or preserve fuel for a priority.
- In co-op: spot, tow, block traffic, resupply, or finish adjacent surfaces.

## Systemic simulation

### Snow

The world uses a spatial snow-depth field. Weather adds depth over time. A lowered plow samples cells under the blade, removes a percentage, and deposits most of that volume to a lateral discharge location. A small explicitly measured loss represents compaction, bank-capacity overflow, and visual simplification. Deep snow increases drag and reduces steering authority. Browser debriefs export moved/lost totals for tuning this abstraction.

Browser v0.1 uses a 40 px grid rendered as translucent blue-white cells. The full game should use terrain-aligned snow tiles or a compute-driven height/coverage field, with separate loose, packed, slush, and ice components.

### Surface and salt

Salt reduces local snow/ice and suppresses near-term accumulation. In the full game it has temperature-dependent effectiveness, runoff consequences, budget cost, and a delayed brine window. The prototype uses immediate local treatment plus a short anti-accumulation effect.

### Weather and visibility

Snowfall continuously adds accumulation. Gust intensity oscillates, reducing contrast and increasing accumulation rate. Future weather adds wind-driven redistribution, temperature crossings, freezing rain, and forecast uncertainty.

The browser slice ships three deterministic scenario presets: **Steady Start** teaches the base loop, **Lake-Effect Push** increases depth and resource pressure, and **Event Night** adds a denser parked-car pattern. Scenario IDs are shareable through the URL.

### Traffic and access

Destinations require a connected, sufficiently clear road corridor. Browser scoring flood-fills passable snow cells outward from the Public Works Yard and counts cleared destination-approach samples only when they join that network. The full simulation uses a road graph with lane widths, obstruction weights, traffic agents, and emergency-response reachability.

### Harmful placement

Sensitive roadside zones include hydrants, driveways, crosswalk ramps, drains, mailboxes, and sight lines. Snow deposited above a threshold in these zones produces warnings and score penalties. These are recoverable: subsequent passes or loaders can relocate the bank.

## Tools and vehicles

### Initial fleet

- Single-axle plow truck: agile, moderate blade and hopper, poor in very deep banks.
- Tandem plow/salter: wide routes, high capacity, slow in tight streets.
- Sidewalk tractor: clears pedestrian networks and entrances.
- Front loader: relocates banks and loads dump trucks; essential after repeated storms.
- Tow truck: moves parked or stuck vehicles and assists crew recovery.
- Pickup with V-plow: scouting, spot clearing, brine, and light response.

### Attachments and consumables

Straight blade, V-plow, wing plow, underbody scraper, snowblower, salt, sand, brine, chains, visibility beacons, and temporary braces/barriers. Attachments change geometry and workflow rather than acting as linear power upgrades.

## Job types

- Active-storm priority route maintenance.
- Overnight full-town cleanup.
- School, clinic, transit, and commercial-lot opening deadlines.
- Sidewalk and accessibility-route clearing.
- Hydrant/drain recovery and snowbank relocation.
- Freezing-rain pretreatment and post-storm refreeze response.
- Parked-car emergency/tow coordination.
- Multi-day blizzard recovery with rotating equipment failures.

## Progression, economy, and unlocks

The town allocates a seasonal operating budget. Revenue is fixed by contracts and municipal funding; performance changes trust, optional work, grants, and repair costs rather than paying arcade coins per snowflake. Players unlock attachments, depot improvements, better forecasts, route telemetry, and cosmetic fleet history.

Progression should broaden choices, not erase friction. A larger hopper reduces resupply trips but adds weight. A wing plow clears wider but threatens roadside objects. Persistent consequences include bank locations, damaged signs, resident trust by district, salt inventory, vehicle wear, and deferred complaints.

## Multiplayer roles and coordination

All roles are fluid; nobody is locked into a class.

- Route lead: prioritizes and calls passes from the map.
- Heavy operator: opens arterial roads and moves major volume.
- Detail operator: clears entrances, sidewalks, and sensitive zones.
- Support operator: tows, refuels, repairs, spots hazards, and manages traffic.
- Floater: responds to emergent blockages and NPC incidents.

Coordination tools include map pings, route drawing, proximity voice/radio filters, reversible cones, shared destination status, and concise operator callouts. Snowbanks and vehicle paths must replicate deterministically enough for shared cause-and-effect; exact particle fidelity need not.

## Failure and chaos states

Failure is graded, not binary. The shift ends with a civic outcome and a story.

- Priority access falls below target by deadline.
- Fuel or salt runs out far from depot.
- A driveway, hydrant, drain, or ramp becomes buried.
- Plowed snow traps an NPC car or blocks an intersecting lane.
- Repeated passes pack snow into ice.
- Collision damage bends a blade or disables a vehicle.
- A stranded emergency vehicle creates a new top priority.
- Whiteout causes missed turns and overlapping work.

The browser slice now introduces a Northstar delivery van mid-shift. Deep snow ahead traps it; clearing the lane below a recovery threshold lets it continue. This is the first explicit NPC consequence caused and repaired entirely through the shared snow simulation.

The game explains cause with map history, colored access paths, pile warnings, and a debrief timeline. Recovery should remain possible until the last moments.

## Town and world design

Bellwether is a compact, hilly North American town shared with other municipal-work game concepts. Recurring places include Town Hall, Station 2, Bellwether Clinic, Northstar Market, Public Works Yard, school, diner, rail crossing, creek bridge, and aging hillside neighborhoods.

The full town is assembled from authored districts connected by a road graph. Each district expresses a distinct snow problem: downtown curb scarcity, suburban driveways, rural drifting, industrial truck access, hills, and pedestrian-heavy civic blocks. Named residents and businesses generate priorities and remember outcomes without turning public service into a popularity contest.

## Art direction

Stylized low-poly 3D with chunky vehicle silhouettes, readable attachment geometry, warm window light, sodium streetlamps, and a restrained civic color palette. Snow depth and compaction must read at driving speed. Hazard colors are consistent: blue for priority/access, amber for placement risk, red for immediate obstruction, green for resources/depot.

The browser slice now uses a stylized, softly dimensional town: continuous asphalt, raised curb blocks, snow-capped roofs, warm windows, evergreen silhouettes, streetlight pools, shaded vehicles, and a vignetted active storm. Snow is rendered as a bilinearly smoothed surface rather than visible simulation tiles; genuinely deep cells gain shaped banks. Blue route/access and amber-sensitive markers remain deliberately graphic so the simulation stays legible.

Plow spray particles are presentation-only but originate from authoritative transfer samples, making the blade-right discharge direction readable without inventing snow volume.

## Audio direction

Audio carries machine state: engine load, tire slip, blade scrape, granular salt, snow hitting banks, hydraulic clunks, beacons, and muffled storm ambience. Music is sparse and reactive, giving way to radio chatter and vehicle rhythm. Co-op callouts duck nonessential audio. Accessibility provides visual equivalents for all critical cues.

The browser slice uses restrained synthesized cues for system-state validation; these are functional placeholders, not final sound direction, and can be muted persistently.

## UI, UX, and accessibility

- Minimal HUD: time, fuel, salt, destination access, score, blade state.
- World-space markers show sensitive zones and destination approaches.
- Color is reinforced with icons, labels, patterns, and motion.
- Remappable controls, hold/toggle options, steering sensitivity, camera shake, snow contrast, and reduced-weather mode.
- Full controller support is a Unity requirement.
- The browser slice supports the Gamepad API using the planned Unity action semantics.
- Assist options: extended shift, gentler fuel use, route guidance, automatic blade height, pause-and-plan solo mode.
- Solo browser play supports pause-and-plan at any time and pauses automatically on focus loss.
- Text avoids tiny overlays; essential messages persist in an event log.
- Browser presentation preferences can suppress repeat briefings and reduce visual snowfall without changing accumulation or score.

## Replayability and content generation

Replay comes from systemic combinations: storm track, temperature curve, parked-car pattern, priority calls, equipment availability, and persistent banks. Authored town geometry anchors legibility; seeded scenario data varies conditions. Daily contracts and challenge seeds can be shared without requiring procedural town generation.

## Browser prototype scope

### Included in v0.1

- One 960×600 town map with a compact road network.
- One arcade-handling plow truck.
- Continuous snowfall and visibility fluctuation.
- Grid-based snow depth that the plow moves laterally.
- Fuel, salt, blade toggle, depot resupply.
- Parked-car collision obstacles.
- Three priority destinations with approach-clearance scoring.
- Sensitive roadside zones for driveways and hydrants.
- Shift timer, event log, graded score, win/lose debrief, restart.
- Paused dispatch briefing, deterministic scenario selector, and shareable scenario URL.

### Explicitly excluded

Networking, pedestrians, live traffic AI, towing, equipment damage, multiple vehicles, attachment selection, audio, persistence between browser sessions, 3D rendering, mobile controls, and a full economy.

## Technical approach

The slice is plain HTML/CSS/JavaScript with one Canvas and no dependencies. Fixed-step simulation is separated conceptually from rendering. Map objects and scoring zones are data arrays. Snow is a typed-array field. Collision uses circles against road bounds and parked-car rectangles. This favors rapid iteration and direct opening from disk.

Performance target: stable 60 fps on a typical desktop browser at 960×600; simulation remains playable at 30 fps. The update loop caps accumulated delta to avoid tab-resume explosions.

## Data and state architecture

Top-level state domains:

- `shift`: phase, scenario/seed, elapsed, duration, score, events, outcome.
- `weather`: intensity, gust, visibility, accumulation rate.
- `truck`: transform, velocity, steering, fuel, salt, blade, collision cooldown.
- `snow`: grid dimensions, depth field, salt-treatment field.
- `town`: roads, buildings, destinations, sensitive zones, obstacles, depot.
- `metrics`: connected cleared priority samples, harmful placement, collisions, resource bonuses.

Simulation order is input → vehicle dynamics → collision → plow displacement → salt treatment → snowfall → access/penalty sampling → phase transition → render. Scoring derives from state rather than being the source of truth.

## Unity migration considerations

- Preserve the authored road graph, destination/sensitive-zone schemas, and shift metrics as ScriptableObjects or JSON.
- Replace 2D snow cells with world-space surface chunks, but retain mass-transfer rules and low-frequency authoritative values for networking.
- Use Unity Input System with action maps matching the browser controls.
- Vehicle physics can move to WheelColliders or a custom arcade model; expose the same normalized telemetry.
- Netcode should replicate vehicle inputs/state, tool actions, and compressed snow-field deltas. Server/host owns scoring and persistent town state.
- Separate presentation particles from authoritative snow volume.
- Prototype 2-player host/client snow consistency before adding the full fleet.
- Steam features come after a stable join/rejoin loop: invites, lobbies, achievements, cloud saves.

## First playable vertical slice

**Scenario: “Keep Bellwether Open.”** During a short active storm, the player leaves Public Works Yard and maintains access to Station 2, Bellwether Clinic, and Northstar Market. Parked cars force imperfect lines. Lowering the blade clears snow but throws it rightward; depositing too much onto marked driveways or hydrants creates penalties. Salt offers quick treatment but is limited. The player must reach a credible civic score before the timer expires and preferably return to the depot.

The slice succeeds if a new player can understand within one shift that (a) plowing helps access, (b) snow was moved rather than deleted, and (c) placement can harm the town.

## Milestones

1. **M0 — Design/build-ready:** living GDD, specs, acceptance criteria, no-build shell.
2. **M1 — Functional loop:** drive, plow, snowfall, salt, resources, score, restart.
3. **M2 — Legibility pass:** onboarding, stronger route/sensitive-zone feedback, tuning, audio stubs.
4. **M3 — Systems validation:** seeded scenarios, basic NPC blockage event, persistence mock, controller input.
5. **M4 — Unity preproduction:** data import spike, 3D snow transfer test, network authority prototype.

## Risks and open questions

- **Snow readability:** Can players see transfer at driving speed without noisy overlays?
- **Mass fidelity versus fun:** How much artificial loss/settling is acceptable before the pillar feels false?
- **Route scoring fidelity:** The browser grid now enforces depot connectivity, but cell resolution can still create abrupt access changes; the full road graph should support lane width and weighted obstruction.
- **Handling:** Should the plow truck feel forgiving or demand deliberate countersteer under blade load?
- **Griefing:** Co-op snow placement enables accidental and intentional sabotage; recovery tools and attribution must stay friendly.
- **Persistence:** Long-lived banks add identity but can create unrecoverable seasons. The town needs scheduled hauling/reset valves.
- **Tone:** Resident complaints must create priorities without making public service feel thankless.

## Firm decisions

- Browser v0.1 is desktop keyboard-first, solo, one map, and one vehicle.
- Canvas is preferable to DOM tiles; no build system or dependency is justified yet.
- Snow displacement and harmful placement are required for the first loop, not stretch goals.
- The map is fixed and authored; scenarios will later vary through seed data.
- Scoring emphasizes civic access over speed or raw area cleared.
- The full game targets host-authoritative 2–5 player co-op, with solo crew assists designed from the same roles.
- The canonical local project lives at `C:\Dev\snow-removal` and uses Git with `main` as its primary branch.
- Source and design documents are published in a public GitHub repository named `snow-removal`; the root-level browser prototype is deployed through GitHub Pages for external playtests.
- The no-build deployment path is a product constraint: `index.html` must remain directly playable unless a later measured requirement justifies a reproducible build system.

## Decision log

| Date | Decision | Reason | Revisit when |
|---|---|---|---|
| 2026-08-25 | Use a 40 px snow field in v0.1 | Makes displacement visible and computation cheap | M2 visual tuning |
| 2026-08-25 | Deposit plowed snow on blade-right | Creates route-planning consequence with one input | Angled blades are added |
| 2026-08-25 | Require cleared approach samples to connect to the depot through passable snow cells | Prevents isolated clean patches from scoring as usable civic access | Replace the browser grid with the Unity road graph |
| 2026-08-25 | Allow depot drive-through resupply | Keeps a short shift moving | Economy prototype |
| 2026-08-25 | Keep all implementation dependency-free | Direct file launch and easy handoff | A build tool solves a measured problem |
| 2026-08-25 | Canonicalize at `C:\Dev\snow-removal` with public GitHub/Pages hosting | Gives the project durable version control and a frictionless friend playtest URL | Hosting or repository ownership changes |
| 2026-08-25 | Ship three deterministic scenarios through data presets and URL IDs | Adds replayable pressure variation without procedural-map scope | Scenario telemetry shows insufficient variety |
| 2026-08-25 | Pause the clock behind a short dispatch briefing | Teaches the central placement tradeoff without consuming shift time | Repeat-player friction becomes measurable |
| 2026-08-27 | Replace debug-board primitives with a code-native dimensional Canvas art pass | The coarse grid and flat rectangles obscured the intended grounded municipal fantasy | Player feedback identifies a stronger target style or 3D production begins |
| 2026-08-27 | Smooth visual snow independently from the authoritative 40 px field | Preserves fast deterministic mechanics while hiding tile boundaries | Snow readability or performance regresses |
| 2026-08-27 | Keep ground snow bright and make road-snow opacity nonlinear | The first visual pass compressed snow, pavement, and haze into one gray value range; snow must read before players understand the simulation | Cleared asphalt or plow paths lose readability |

## Next implementation tasks

1. Tune snow accumulation, blade transfer, and access thresholds from five fresh-player runs.
2. Add controller input and a reduced-repeat briefing option.
3. Tune the recoverable delivery-van incident and add obstruction attribution to the debrief.
4. Collect structured debrief JSON from playtests and tune scenario thresholds.
5. Collect multi-shift aftermath debriefs and decide which additional town consequences persist.
