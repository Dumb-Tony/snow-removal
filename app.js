(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const CELL = 40;
  const COLS = W / CELL;
  const ROWS = H / CELL;
  const SHIFT_SECONDS = 180;

  const ui = {
    time: document.getElementById("timeValue"),
    storm: document.getElementById("stormLabel"),
    destinations: document.getElementById("destinations"),
    access: document.getElementById("accessTotal"),
    fuelMeter: document.getElementById("fuelMeter"),
    fuel: document.getElementById("fuelValue"),
    saltMeter: document.getElementById("saltMeter"),
    salt: document.getElementById("saltValue"),
    score: document.getElementById("scoreValue"),
    harm: document.getElementById("harmValue"),
    log: document.getElementById("eventLog"),
    blade: document.getElementById("bladeState"),
    debrief: document.getElementById("debrief"),
    grade: document.getElementById("debriefGrade"),
    summary: document.getElementById("debriefSummary"),
    stats: document.getElementById("debriefStats")
  };

  const roads = [
    { x: 55, y: 90, w: 850, h: 82 },
    { x: 55, y: 259, w: 850, h: 82 },
    { x: 55, y: 428, w: 850, h: 82 },
    { x: 119, y: 60, w: 82, h: 500 },
    { x: 439, y: 60, w: 82, h: 500 },
    { x: 759, y: 60, w: 82, h: 500 }
  ];

  const depot = { x: 66, y: 505, w: 145, h: 74 };
  const buildings = [
    { x: 245, y: 185, w: 140, h: 58, label: "TOWN HALL" },
    { x: 550, y: 178, w: 165, h: 65, label: "NORTHSTAR MARKET" },
    { x: 228, y: 354, w: 165, h: 58, label: "BELLWETHER CLINIC" },
    { x: 552, y: 352, w: 160, h: 62, label: "LIBRARY" },
    { x: 720, y: 515, w: 170, h: 65, label: "STATION 2" }
  ];

  const destinations = [
    { id: "market", name: "Northstar Market", icon: "M", zone: { x: 550, y: 120, w: 165, h: 52 }, access: 0 },
    { id: "clinic", name: "Bellwether Clinic", icon: "+", zone: { x: 228, y: 259, w: 165, h: 58 }, access: 0 },
    { id: "station", name: "Station 2", icon: "2", zone: { x: 759, y: 428, w: 82, h: 92 }, access: 0 }
  ];

  const sensitive = [
    { x: 214, y: 178, r: 18, type: "HYDRANT", buried: false },
    { x: 400, y: 235, r: 21, type: "DRIVEWAY", buried: false },
    { x: 535, y: 350, r: 21, type: "HYDRANT", buried: false },
    { x: 742, y: 412, r: 21, type: "DRIVEWAY", buried: false },
    { x: 858, y: 515, r: 21, type: "HYDRANT", buried: false }
  ];

  const parkedCars = [
    { x: 334, y: 106, w: 42, h: 21, c: "#b95e59" },
    { x: 606, y: 315, w: 43, h: 21, c: "#d6a84a" },
    { x: 135, y: 370, w: 22, h: 43, c: "#5b91aa" },
    { x: 781, y: 206, w: 22, h: 43, c: "#a183bd" },
    { x: 338, y: 475, w: 43, h: 21, c: "#739667" }
  ];

  const keys = new Set();
  const pressed = new Set();
  let state;

  function seededNoise(x, y) {
    const n = Math.sin(x * 91.17 + y * 47.83 + 1.234) * 43758.5453;
    return n - Math.floor(n);
  }

  function isRoad(x, y) {
    return roads.some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ||
      (x >= depot.x && x <= depot.x + depot.w && y >= depot.y && y <= depot.y + depot.h);
  }

  function reset() {
    const snow = new Float32Array(COLS * ROWS);
    const treated = new Float32Array(COLS * ROWS);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const wx = x * CELL + CELL / 2;
        const wy = y * CELL + CELL / 2;
        snow[y * COLS + x] = isRoad(wx, wy) ? 0.42 + seededNoise(x, y) * 0.26 : 0.72;
      }
    }
    sensitive.forEach(s => { s.buried = false; });
    destinations.forEach(d => { d.access = 0; d.lastStatus = ""; });
    state = {
      phase: "active",
      elapsed: 0,
      snow,
      treated,
      truck: { x: 145, y: 505, angle: -Math.PI / 2, speed: 0, fuel: 100, salt: 100, blade: false, hitTimer: 0 },
      weather: { intensity: 0.56, gust: 0, visibility: 1 },
      metrics: { collisions: 0, harm: 0, access: 0, score: 0 },
      events: [],
      logCooldown: 0,
      resupplyCooldown: 0
    };
    addEvent("Dispatch: open the clinic, market, and Station 2.");
    addEvent("Snow leaves the blade on your right. Mind the amber zones.", true);
    ui.debrief.classList.add("hidden");
    updateAccess(true);
    updateHud();
  }

  function addEvent(text, warn = false) {
    state.events.unshift({ text, warn });
    state.events.length = Math.min(state.events.length, 5);
  }

  function snowIndexAt(x, y) {
    const cx = Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL)));
    const cy = Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL)));
    return cy * COLS + cx;
  }

  function snowDepthAt(x, y) {
    return state.snow[snowIndexAt(x, y)];
  }

  function pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function truckBlocked(x, y) {
    const radius = 13;
    if (!isRoad(x, y)) return true;
    return parkedCars.some(c => {
      const nx = Math.max(c.x, Math.min(x, c.x + c.w));
      const ny = Math.max(c.y, Math.min(y, c.y + c.h));
      return (x - nx) ** 2 + (y - ny) ** 2 < radius ** 2;
    });
  }

  function updateTruck(dt) {
    const t = state.truck;
    const throttle = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const steer = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const depth = snowDepthAt(t.x, t.y);
    const traction = Math.max(0.48, 1 - depth * 0.3);

    if (throttle !== 0 && t.fuel > 0) {
      t.speed += throttle * 82 * traction * dt;
      t.fuel = Math.max(0, t.fuel - (0.42 + Math.abs(t.speed) * 0.004) * dt);
    }
    t.speed *= Math.pow(t.blade ? 0.945 : 0.956, dt * 60);
    t.speed = Math.max(-54, Math.min(t.blade ? 82 : 102, t.speed));

    if (Math.abs(t.speed) > 2) {
      t.angle += steer * 1.75 * traction * dt * Math.min(1, Math.abs(t.speed) / 28) * Math.sign(t.speed);
    }

    const nx = t.x + Math.cos(t.angle) * t.speed * dt;
    const ny = t.y + Math.sin(t.angle) * t.speed * dt;
    if (!truckBlocked(nx, ny)) {
      t.x = nx;
      t.y = ny;
    } else {
      if (t.hitTimer <= 0 && Math.abs(t.speed) > 14) {
        state.metrics.collisions++;
        addEvent("Impact reported. Easy on the parked cars.", true);
        t.hitTimer = 0.65;
      }
      t.speed *= -0.24;
    }
    t.hitTimer -= dt;

    if (pointInRect(t.x, t.y, depot)) {
      t.fuel = Math.min(100, t.fuel + 24 * dt);
      t.salt = Math.min(100, t.salt + 34 * dt);
      if (state.resupplyCooldown <= 0 && (t.fuel < 99 || t.salt < 99)) {
        addEvent("Public Works Yard: refueling and loading salt.");
        state.resupplyCooldown = 8;
      }
    }
    state.resupplyCooldown -= dt;
  }

  function plowSnow(dt) {
    const t = state.truck;
    if (!t.blade || Math.abs(t.speed) < 8) return;
    const forward = Math.sign(t.speed) || 1;
    const fx = Math.cos(t.angle) * forward;
    const fy = Math.sin(t.angle) * forward;
    const rightX = -fy;
    const rightY = fx;
    const bladeX = t.x + fx * 24;
    const bladeY = t.y + fy * 24;

    for (const offset of [-14, 0, 14]) {
      const sx = bladeX + rightX * offset;
      const sy = bladeY + rightY * offset;
      const source = snowIndexAt(sx, sy);
      const removable = Math.min(state.snow[source], 1.7 * dt);
      if (removable <= 0.002) continue;
      state.snow[source] -= removable;
      const dx = sx + rightX * 48;
      const dy = sy + rightY * 48;
      const dest = snowIndexAt(dx, dy);
      state.snow[dest] = Math.min(2.5, state.snow[dest] + removable * 0.9);
    }
  }

  function spreadSalt(dt) {
    const t = state.truck;
    if (!keys.has("KeyE") || t.salt <= 0) return;
    t.salt = Math.max(0, t.salt - 8.5 * dt);
    const bx = t.x - Math.cos(t.angle) * 18;
    const by = t.y - Math.sin(t.angle) * 18;
    const idx = snowIndexAt(bx, by);
    state.snow[idx] = Math.max(0, state.snow[idx] - 0.45 * dt);
    state.treated[idx] = Math.min(1, state.treated[idx] + 1.8 * dt);
  }

  function updateWeather(dt) {
    const w = state.weather;
    w.gust = (Math.sin(state.elapsed * 0.16) + Math.sin(state.elapsed * 0.051 + 2)) * 0.25 + 0.5;
    w.intensity = 0.42 + w.gust * 0.38;
    w.visibility = 1 - w.gust * 0.28;
    const amount = w.intensity * 0.0052 * dt;
    for (let i = 0; i < state.snow.length; i++) {
      const shield = state.treated[i] * 0.75;
      state.snow[i] = Math.min(2.5, state.snow[i] + amount * (1 - shield));
      state.treated[i] = Math.max(0, state.treated[i] - 0.035 * dt);
    }
  }

  function averageZone(zone) {
    let open = 0;
    let total = 0;
    for (let y = zone.y + 10; y < zone.y + zone.h; y += 20) {
      for (let x = zone.x + 10; x < zone.x + zone.w; x += 20) {
        total++;
        if (snowDepthAt(x, y) < 0.31) open++;
      }
    }
    return total ? open / total : 0;
  }

  function updateAccess(silent = false) {
    let accessSum = 0;
    destinations.forEach(d => {
      d.access = averageZone(d.zone);
      accessSum += d.access;
      const status = d.access >= 0.7 ? "OPEN" : d.access >= 0.45 ? "STRAINED" : "BLOCKED";
      if (!silent && d.lastStatus && d.lastStatus !== status) {
        addEvent(`${d.name}: access ${status.toLowerCase()}.`, status !== "OPEN");
      }
      d.lastStatus = status;
    });

    let harm = 0;
    sensitive.forEach(s => {
      const depth = snowDepthAt(s.x, s.y);
      const nowBuried = depth >= 0.92;
      harm += Math.max(0, depth - 0.64) * 13;
      if (!silent && nowBuried && !s.buried) addEvent(`${s.type} buried by displaced snow. Clear it!`, true);
      s.buried = nowBuried;
    });

    state.metrics.access = accessSum / destinations.length;
    state.metrics.harm = harm;
    const accessPoints = state.metrics.access * 100;
    const resourceBonus = (state.truck.fuel + state.truck.salt) * 0.07;
    state.metrics.score = Math.max(0, Math.round(accessPoints + resourceBonus - harm - state.metrics.collisions * 3));
  }

  function update(dt) {
    if (pressed.has("KeyR")) reset();
    if (state.phase !== "active") { pressed.clear(); return; }
    if (pressed.has("Space")) {
      state.truck.blade = !state.truck.blade;
      addEvent(`Blade ${state.truck.blade ? "lowered" : "raised"}.`);
    }
    state.elapsed += dt;
    updateTruck(dt);
    plowSnow(dt);
    spreadSalt(dt);
    updateWeather(dt);
    state.logCooldown -= dt;
    if (state.logCooldown <= 0) {
      updateAccess();
      state.logCooldown = 0.5;
    }
    if (state.elapsed >= SHIFT_SECONDS) endShift();
    pressed.clear();
  }

  function endShift() {
    state.phase = "debrief";
    state.truck.speed = 0;
    updateAccess(true);
    const score = state.metrics.score;
    const grade = score >= 86 ? "A" : score >= 70 ? "B" : score >= 52 ? "C" : score >= 35 ? "D" : "F";
    ui.grade.textContent = grade;
    ui.summary.textContent = score >= 70
      ? "Bellwether can still reach what matters. The next crew will inherit a manageable town."
      : "Critical access remains unreliable. Dispatch has called in another crew to recover the routes.";
    ui.stats.innerHTML = `<span><b>${Math.round(state.metrics.access * 100)}%</b>access</span><span><b>${state.metrics.harm.toFixed(0)}</b>placement harm</span><span><b>${state.metrics.collisions}</b>impacts</span><span><b>${score}</b>score</span>`;
    ui.debrief.classList.remove("hidden");
  }

  function drawBuilding(b) {
    ctx.fillStyle = "#263942";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = "#c89f62";
    for (let x = b.x + 12; x < b.x + b.w - 8; x += 28) ctx.fillRect(x, b.y + 13, 11, 8);
    ctx.fillStyle = "#b7c5cc";
    ctx.font = "700 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h - 10);
  }

  function drawWorld() {
    ctx.fillStyle = "#31454a";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#202c33";
    roads.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));
    ctx.strokeStyle = "#42545c";
    ctx.lineWidth = 1;
    roads.forEach(r => ctx.strokeRect(r.x, r.y, r.w, r.h));

    ctx.setLineDash([18, 18]);
    ctx.strokeStyle = "#7f8a8955";
    ctx.lineWidth = 2;
    [131, 300, 469].forEach(y => { ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(900, y); ctx.stroke(); });
    [160, 480, 800].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 65); ctx.lineTo(x, 555); ctx.stroke(); });
    ctx.setLineDash([]);

    ctx.fillStyle = "#244b3a";
    ctx.fillRect(depot.x, depot.y, depot.w, depot.h);
    ctx.fillStyle = "#87d5a9";
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("PUBLIC WORKS · RESUPPLY", depot.x + 8, depot.y + depot.h - 9);

    buildings.forEach(drawBuilding);

    destinations.forEach(d => {
      ctx.fillStyle = d.access >= .7 ? "#72d6a033" : "#62b7e82a";
      ctx.fillRect(d.zone.x, d.zone.y, d.zone.w, d.zone.h);
      ctx.strokeStyle = d.access >= .7 ? "#72d6a0" : "#62b7e8";
      ctx.lineWidth = 2;
      ctx.strokeRect(d.zone.x, d.zone.y, d.zone.w, d.zone.h);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(d.zone.x + 14, d.zone.y + 14, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#10202a";
      ctx.font = "900 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(d.icon, d.zone.x + 14, d.zone.y + 18);
    });

    sensitive.forEach(s => {
      ctx.fillStyle = s.buried ? "#ff6b5e55" : "#ffbc5735";
      ctx.strokeStyle = s.buried ? "#ff6b5e" : "#ffbc57";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = "900 8px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(s.type === "HYDRANT" ? "H" : "D", s.x, s.y + 3);
    });
  }

  function drawSnow() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const idx = y * COLS + x;
        const d = state.snow[idx];
        if (d < 0.045) continue;
        const cx = x * CELL + CELL / 2;
        const cy = y * CELL + CELL / 2;
        if (!isRoad(cx, cy)) continue;
        ctx.fillStyle = `rgba(222, 240, 248, ${Math.min(.88, d * .55)})`;
        ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        if (d > .85) {
          ctx.fillStyle = `rgba(255,255,255,${Math.min(.55, (d - .8) * .4)})`;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.min(17, 7 + d * 4), 0, Math.PI * 2);
          ctx.fill();
        }
        if (state.treated[idx] > .15) {
          ctx.fillStyle = `rgba(114,214,160,${state.treated[idx] * .18})`;
          ctx.fillRect(x * CELL + 5, y * CELL + 5, CELL - 10, CELL - 10);
        }
      }
    }
  }

  function drawCars() {
    parkedCars.forEach(c => {
      ctx.fillStyle = "#111b20";
      ctx.fillRect(c.x - 2, c.y - 2, c.w + 4, c.h + 4);
      ctx.fillStyle = c.c;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "#a9c4cf";
      if (c.w > c.h) ctx.fillRect(c.x + 11, c.y + 4, 17, c.h - 8);
      else ctx.fillRect(c.x + 4, c.y + 11, c.w - 8, 17);
    });
  }

  function drawTruck() {
    const t = state.truck;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.fillStyle = "#0b151b";
    ctx.fillRect(-21, -13, 43, 26);
    ctx.fillStyle = "#e69b32";
    ctx.fillRect(-18, -11, 35, 22);
    ctx.fillStyle = "#dceaf0";
    ctx.fillRect(3, -8, 10, 16);
    ctx.fillStyle = "#f5c75f";
    ctx.fillRect(-9, -13, 5, 3);
    ctx.fillRect(7, -13, 5, 3);
    if (t.blade) {
      ctx.strokeStyle = "#8dd3f5";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(24, -20);
      ctx.lineTo(28, 20);
      ctx.stroke();
      ctx.strokeStyle = "#1b536d";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#66818e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(20, -14);
      ctx.lineTo(20, 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWeather() {
    const gust = state.weather.gust;
    ctx.fillStyle = `rgba(220,240,248,${(1 - state.weather.visibility) * .32})`;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(255,255,255,${.22 + gust * .32})`;
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 58; i++) {
      const x = (i * 173 + state.elapsed * (35 + gust * 70)) % (W + 40) - 20;
      const y = (i * 97 + state.elapsed * 63) % (H + 30) - 15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5 + gust * 8, y + 8);
      ctx.stroke();
    }
  }

  function render() {
    drawWorld();
    drawSnow();
    drawCars();
    drawTruck();
    drawWeather();
  }

  function updateHud() {
    const remaining = Math.max(0, SHIFT_SECONDS - state.elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    ui.time.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    ui.storm.textContent = state.weather.gust > .68 ? "GUSTING · LOW VISIBILITY" : "STEADY SNOW";
    ui.access.textContent = `${Math.round(state.metrics.access * 100)}%`;
    ui.fuelMeter.value = state.truck.fuel;
    ui.fuel.textContent = `${Math.round(state.truck.fuel)}%`;
    ui.saltMeter.value = state.truck.salt;
    ui.salt.textContent = `${Math.round(state.truck.salt)}%`;
    ui.score.textContent = state.metrics.score;
    const buried = sensitive.filter(s => s.buried).length;
    ui.harm.textContent = buried ? `${buried} access point${buried > 1 ? "s" : ""} buried` : "No blocked access points";
    ui.blade.textContent = state.truck.blade ? "BLADE LOWERED · SNOW → RIGHT" : "BLADE RAISED";
    ui.blade.classList.toggle("raised", !state.truck.blade);
    ui.destinations.innerHTML = destinations.map(d => {
      const pct = Math.round(d.access * 100);
      const cls = pct >= 70 ? "" : pct >= 45 ? "strained" : "blocked";
      const status = pct >= 70 ? "OPEN" : pct >= 45 ? "STRAINED" : "BLOCKED";
      return `<div class="destination"><div class="destination-line"><span>${d.icon} · ${d.name}</span><b>${status} ${pct}%</b></div><div class="bar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
    }).join("");
    ui.log.innerHTML = state.events.map(e => `<li class="${e.warn ? "warn" : ""}">${e.text}</li>`).join("");
  }

  const blockedKeys = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
  window.addEventListener("keydown", e => {
    if (blockedKeys.has(e.code)) e.preventDefault();
    if (!keys.has(e.code)) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener("keyup", e => keys.delete(e.code));
  window.addEventListener("blur", () => { keys.clear(); pressed.clear(); });
  document.getElementById("restartButton").addEventListener("click", reset);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    updateHud();
    requestAnimationFrame(frame);
  }

  reset();
  requestAnimationFrame(frame);
})();

