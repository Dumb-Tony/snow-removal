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

  function scoreShift({ access, fuel, salt, harm, collisions }) {
    const accessPoints = Math.max(0, Math.min(1, access)) * 100;
    const resourceBonus = (Math.max(0, fuel) + Math.max(0, salt)) * 0.07;
    return Math.max(0, Math.round(accessPoints + resourceBonus - Math.max(0, harm) - Math.max(0, collisions) * 3));
  }

  return { noise2D, floodConnected, classifyAccess, scoreShift };
});

