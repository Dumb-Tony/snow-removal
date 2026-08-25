# SNOW REMOVAL — Browser Vertical Slice

A no-build Canvas prototype about keeping a small town moving during an active storm.

> **Public playtest:** Pending the first GitHub Pages publish. The canonical repository is prepared for root-folder Pages deployment.

## Play

Open `index.html` in a modern desktop browser. No server, install, or build step is required.

- Drive: `WASD` or arrow keys
- Brake/reverse: `S` / down arrow
- Toggle plow: `Space`
- Spread salt: `E`
- Reset shift: `R`

Clear the blue priority roads and keep access open to the fire station, clinic, and grocery store. Snow is pushed to the side of the blade rather than deleted, so careless passes can bury driveways and hydrants. Return to the depot before fuel runs out.

## Project documents

- `docs/GDD.md` — living game design document and decision log
- `docs/BUILD_PREP.md` — backlog, milestones, acceptance criteria, specifications, and QA

## Repository and deployment policy

- The canonical local project is `C:\Dev\snow-removal`.
- `main` is the primary branch and must remain playable without a build step.
- The public GitHub repository is named `snow-removal`.
- The browser prototype is deployed from the repository root with GitHub Pages.
- Prototype code, the living GDD, and build-planning artifacts stay under version control.
- Secrets, credentials, machine-specific files, dependencies, and generated output are excluded.
- Update this README's public playtest link whenever the hosting location changes.

## Current prototype boundaries

This is a systems proof, not a content-complete game. The truck uses readable arcade handling; snow is simulated on a low-resolution field; collision geometry is intentionally simple; and the browser slice is solo-only while its systems and data are organized for eventual co-op migration.
