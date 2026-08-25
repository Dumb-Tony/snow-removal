# SNOW REMOVAL — Browser Playtest Guide

**Playable build:** https://dumb-tony.github.io/snow-removal/  
**Target time:** 12–18 minutes  
**Build line:** Browser vertical slice v0.2

## What this playtest is testing

The build is not testing final art, full vehicle physics, multiplayer, or content volume. It is testing whether one central idea creates satisfying decisions:

> Clearing a road helps the town, but the snow must go somewhere and can create a new problem.

We also want to learn whether connected-route scoring, limited supplies, the mid-shift delivery van, and persistent snowbanks remain understandable under pressure.

## Suggested run

1. Play **Steady Start** once without reading the design documents.
2. Play **Lake-Effect Push** and respond to the Northstar delivery van.
3. At debrief, choose **Continue with these snowbanks** and begin the aftermath shift long enough to inspect the inherited town.
4. If time remains, try **Event Night** with a gamepad.

Each scenario is shareable:

- Steady Start: `?scenario=steady`
- Lake-Effect Push: `?scenario=lake-effect`
- Event Night: `?scenario=event-night`

## Notes to capture

Please answer briefly; concrete moments are more useful than general ratings.

1. When did you first understand that the blade moves snow to the truck's right?
2. Did you understand why a destination was BLOCKED, STRAINED, or OPEN?
3. Describe one mistake you recognized and how you tried to recover from it.
4. Did the delivery van feel caused by town conditions, arbitrary, or unclear?
5. Which information did you look for but could not find?
6. Did steering, blade control, salt, or resupply behave differently than expected?
7. Would you voluntarily play another scenario? Why or why not?

Optional: download the JSON debrief from the end screen and attach it to the notes. It contains scenario/seed, shift number, civic access, placement harm, NPC delay, resource remainder, and snow moved/lost. It contains no personal information or telemetry.

## Facilitator observations

- Time until first blade-lowered pass.
- Whether the player notices blue connected-road outlines.
- Whether the player buries an amber zone and can explain the warning.
- Whether the player predicts which side receives the bank before the second pass.
- Whether the player attempts to recover the delivery van.
- Whether the player returns to the yard voluntarily.
- Any point where the player stops driving to parse the UI.

## Known limitations

- Top-down arcade handling is a systems stand-in for the eventual 3D truck.
- Snow uses a coarse 40 px field and can change access status abruptly at cell boundaries.
- The delivery van follows one fixed road and has deliberately simple behavior.
- Audio cues are synthesized placeholders.
- Browser aftermath preserves snow only when explicitly chosen at debrief; it is not a season save.
- Keyboard bindings are not yet remappable.

