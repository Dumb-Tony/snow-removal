"use strict";

const assert = require("node:assert/strict");
const { noise2D, floodConnected, classifyAccess, scoreShift } = require("../core.js");

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

test("score rewards access and resources while charging harm", () => {
  assert.equal(scoreShift({ access: 1, fuel: 100, salt: 100, harm: 0, collisions: 0 }), 114);
  assert.equal(scoreShift({ access: 0.5, fuel: 50, salt: 50, harm: 8, collisions: 2 }), 43);
  assert.equal(scoreShift({ access: 0, fuel: 0, salt: 0, harm: 99, collisions: 9 }), 0);
});

console.log("All SnowCore tests passed.");

