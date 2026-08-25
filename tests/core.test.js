"use strict";

const assert = require("node:assert/strict");
const { noise2D, floodConnected, classifyAccess, scoreShift, classifyNpcObstruction, createDebrief } = require("../core.js");

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}

test("seeded noise is deterministic and seed-sensitive", () => {
  assert.equal(noise2D(4, 7, 117), noise2D(4, 7, 117));
  assert.notEqual(noise2D(4, 7, 117), noise2D(4, 7, 382));
});

test("connectivity cannot jump across a blocked cell", () => {
  const result = floodConnected({ cols: 5, rows: 1, starts: [0], isPassable: idx => idx !== 2 });
  assert.deepEqual(Array.from(result), [1, 1, 0, 0, 0]);
});

test("connectivity can route around an obstruction", () => {
  const result = floodConnected({ cols: 3, rows: 2, starts: [0], isPassable: idx => idx !== 1 });
  assert.equal(result[2], 1);
});

test("access hysteresis suppresses threshold chatter", () => {
  assert.equal(classifyAccess(0.68, "OPEN"), "OPEN");
  assert.equal(classifyAccess(0.68, "STRAINED"), "STRAINED");
  assert.equal(classifyAccess(0.46, "BLOCKED"), "BLOCKED");
  assert.equal(classifyAccess(0.48, "BLOCKED"), "STRAINED");
});

test("NPC obstruction uses wide recovery hysteresis", () => {
  assert.equal(classifyNpcObstruction(0.9, "MOVING"), "STUCK");
  assert.equal(classifyNpcObstruction(0.7, "STUCK"), "STUCK");
  assert.equal(classifyNpcObstruction(0.4, "STUCK"), "MOVING");
});

test("score rewards access and resources while charging harm", () => {
  assert.equal(scoreShift({ access: 1, fuel: 100, salt: 100, harm: 0, collisions: 0 }), 114);
  assert.equal(scoreShift({ access: 0.5, fuel: 50, salt: 50, harm: 8, collisions: 2 }), 43);
  assert.equal(scoreShift({ access: 0.5, fuel: 50, salt: 50, harm: 8, collisions: 2, delayPenalty: 5 }), 38);
  assert.equal(scoreShift({ access: 0, fuel: 0, salt: 0, harm: 99, collisions: 9 }), 0);
});

test("debrief export is stable, compact, and JSON-safe", () => {
  const record = createDebrief({
    scenario: { id: "steady", name: "Steady Start", seed: 117 },
    elapsed: 179.6,
    access: 0.745,
    harm: 4.236,
    collisions: 1,
    score: 77,
    fuel: 52.4,
    salt: 61.8,
    returnedToDepot: true,
    npcDelaySeconds: 12.6,
    npcIncidents: 1,
    completedAt: "2026-08-25T00:00:00.000Z"
  });
  assert.equal(record.format, "snow-removal-debrief-v1");
  assert.equal(record.outcome.civicAccessPercent, 75);
  assert.equal(record.outcome.placementHarm, 4.24);
  assert.equal(record.shift.returnedToDepot, true);
  assert.equal(record.outcome.npcDelaySeconds, 13);
  assert.doesNotThrow(() => JSON.stringify(record));
});

console.log("All SnowCore tests passed.");
