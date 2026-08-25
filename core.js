(function exposeSnowCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SnowCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSnowCore() {
  "use strict";

  function noise2D(x, y, seed) {
    const n = Math.sin(x * 91.17 + y * 47.83 + seed * 0.0137 + 1.234) * 43758.5453;
    return n - Math.floor(n);
  }

  function floodConnected({ cols, rows, starts, isPassable }) {
    const connected = new Uint8Array(cols * rows);
    const queue = [];
    for (const idx of starts) {
      if (idx < 0 || idx >= connected.length || connected[idx]) continue;
      connected[idx] = 1;
      queue.push(idx);
    }
    for (let head = 0; head < queue.length; head++) {
      const idx = queue[head];
      const x = idx % cols;
      const y = Math.floor(idx / cols);
      const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const next = ny * cols + nx;
        if (connected[next] || !isPassable(next, nx, ny)) continue;
        connected[next] = 1;
        queue.push(next);
      }
    }
    return connected;
  }

  function classifyAccess(value, previous = "") {
    if (previous === "OPEN") return value >= 0.64 ? "OPEN" : value >= 0.39 ? "STRAINED" : "BLOCKED";
    if (previous === "STRAINED") return value >= 0.72 ? "OPEN" : value >= 0.39 ? "STRAINED" : "BLOCKED";
    if (previous === "BLOCKED") return value >= 0.72 ? "OPEN" : value >= 0.47 ? "STRAINED" : "BLOCKED";
    return value >= 0.7 ? "OPEN" : value >= 0.45 ? "STRAINED" : "BLOCKED";
  }

  function scoreShift({ access, fuel, salt, harm, collisions, delayPenalty = 0 }) {
    const accessPoints = Math.max(0, Math.min(1, access)) * 100;
    const resourceBonus = (Math.max(0, fuel) + Math.max(0, salt)) * 0.07;
    return Math.max(0, Math.round(accessPoints + resourceBonus - Math.max(0, harm) - Math.max(0, collisions) * 3 - Math.max(0, delayPenalty)));
  }

  function classifyNpcObstruction(depth, previous = "MOVING") {
    if (previous === "STUCK") return depth < 0.42 ? "MOVING" : "STUCK";
    return depth >= 0.86 ? "STUCK" : "MOVING";
  }

  function transferSnow(field, source, destination, requested, { retention = 0.9, capacity = 2.5 } = {}) {
    if (source === destination || requested <= 0) return { removed: 0, deposited: 0, lost: 0 };
    const removed = Math.min(Math.max(0, field[source]), requested);
    const depositTarget = removed * retention;
    const room = Math.max(0, capacity - field[destination]);
    const deposited = Math.min(room, depositTarget);
    field[source] -= removed;
    field[destination] += deposited;
    return { removed, deposited, lost: removed - deposited };
  }

  function carrySnowField(field, { settling = 0.04 } = {}) {
    const carried = new Float32Array(field.length);
    for (let i = 0; i < field.length; i++) {
      const depth = Math.max(0, field[i]);
      carried[i] = Math.max(0, depth - Math.min(settling, depth * 0.08));
    }
    return carried;
  }

  function createDebrief({ scenario, townCycle = 1, elapsed, access, harm, collisions, score, fuel, salt, returnedToDepot, npcDelaySeconds = 0, npcIncidents = 0, snowMoved = 0, snowLost = 0, completedAt }) {
    return {
      format: "snow-removal-debrief-v1",
      completedAt: completedAt || new Date().toISOString(),
      scenario: { id: scenario.id, name: scenario.name, seed: scenario.seed },
      shift: { townCycle, elapsedSeconds: Math.round(elapsed), returnedToDepot: Boolean(returnedToDepot) },
      outcome: {
        civicAccessPercent: Math.round(access * 100),
        placementHarm: Number(harm.toFixed(2)),
        collisions,
        npcDelaySeconds: Math.round(npcDelaySeconds),
        npcIncidents,
        snowMoved: Number(snowMoved.toFixed(3)),
        snowLost: Number(snowLost.toFixed(3)),
        score,
        fuelRemainingPercent: Math.round(fuel),
        saltRemainingPercent: Math.round(salt)
      }
    };
  }

  return { noise2D, floodConnected, classifyAccess, scoreShift, classifyNpcObstruction, transferSnow, carrySnowField, createDebrief };
});
