"use strict";

const assert = require("node:assert/strict");
const { noise2D, floodConnected, classifyAccess, scoreShift, classifyNpcObstruction, transferSnow, carrySnowField, applySnowfall, createDebrief } = require("../core.js");

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

test("plow transfer conserves reported snow mass", () => {
  const field = new Float32Array([1, 0.2]);
  const before = field[0] + field[1];
  const result = transferSnow(field, 0, 1, 0.5);
  const after = field[0] + field[1];
  assert.ok(Math.abs(result.removed - 0.5) < 1e-6);
  assert.ok(Math.abs(result.deposited - 0.45) < 1e-6);
  assert.ok(Math.abs((before - after) - result.lost) < 1e-6);
});

test("plow transfer reports bank-capacity overflow and protects same-cell edges", () => {
  const field = new Float32Array([1, 2.48]);
  const overflow = transferSnow(field, 0, 1, 0.5);
  assert.ok(overflow.deposited < 0.021);
  assert.ok(overflow.lost > 0.47);
  const unchanged = Array.from(field);
  assert.deepEqual(transferSnow(field, 0, 0, 0.5), { removed: 0, deposited: 0, lost: 0 });
  assert.deepEqual(Array.from(field), unchanged);
});

test("aftermath carryover settles loose snow without erasing banks or mutating history", () => {
  const original = new Float32Array([0, 0.2, 1.4, 2.5]);
  const snapshot = Array.from(original);
  const carried = carrySnowField(original);
  assert.deepEqual(Array.from(original), snapshot);
  assert.equal(carried[0], 0);
  assert.ok(carried[1] < original[1]);
  assert.ok(carried[2] > 1.3);
  assert.ok(carried[3] > 2.4);
});

test("steady snowfall leaves a freshly cleared route viable for a full shift", () => {
  const field = new Float32Array([0]);
  const treated = new Float32Array([0]);
  applySnowfall(field, treated, { intensity: 0.55, rate: 0.0022, dt: 180 });
  assert.ok(field[0] > 0.2);
  assert.ok(field[0] < 0.31);
});

test("salt treatment suppresses accumulation and expires safely", () => {
  const field = new Float32Array([0]);
  const treated = new Float32Array([1]);
  applySnowfall(field, treated, { intensity: 0.55, rate: 0.0022, dt: 1 });
  assert.ok(field[0] < 0.001);
  assert.ok(treated[0] < 1 && treated[0] > 0);
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
    townCycle: 2,
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
    snowMoved: 2.34567,
    snowLost: 0.12345,
    completedAt: "2026-08-25T00:00:00.000Z"
  });
  assert.equal(record.format, "snow-removal-debrief-v1");
  assert.equal(record.outcome.civicAccessPercent, 75);
  assert.equal(record.outcome.placementHarm, 4.24);
  assert.equal(record.shift.returnedToDepot, true);
  assert.equal(record.shift.townCycle, 2);
  assert.equal(record.outcome.npcDelaySeconds, 13);
  assert.equal(record.outcome.snowMoved, 2.346);
  assert.doesNotThrow(() => JSON.stringify(record));
});

console.log("All SnowCore tests passed.");
