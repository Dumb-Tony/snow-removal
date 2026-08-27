(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const CELL = 40;
  const COLS = W / CELL;
  const ROWS = H / CELL;
  const snowSurface = document.createElement("canvas");
  snowSurface.width = COLS;
  snowSurface.height = ROWS;
  const snowSurfaceCtx = snowSurface.getContext("2d");
  const snowSurfaceImage = snowSurfaceCtx.createImageData(COLS, ROWS);
  const QA_MODE = new URLSearchParams(location.search).get("qa") === "1";
  const SHIFT_SECONDS = QA_MODE ? 5 : 180;
  const { noise2D, floodConnected, classifyAccess, scoreShift, classifyNpcObstruction, transferSnow, carrySnowField, createDebrief } = window.SnowCore;

  const SCENARIOS = [
    { id: "steady", name: "Steady Start", seed: 117, brief: "A routine afternoon storm is building. Open the three civic routes before accumulation outruns the crew.", baseSnow: 0.38, snowVariance: 0.24, stormBase: 0.38, gustScale: 0.34, salt: 100, parking: 0, npcDelay: 42 },
    { id: "lake-effect", name: "Lake-Effect Push", seed: 382, brief: "A narrow lake-effect band has settled over town. Snow is deeper, gusts are stronger, and the hopper starts partially used.", baseSnow: 0.48, snowVariance: 0.3, stormBase: 0.52, gustScale: 0.46, salt: 76, parking: 1, npcDelay: 24 },
    { id: "event-night", name: "Event Night", seed: 911, brief: "Downtown parking is packed during a fast-moving squall. Work precise lines and protect the clinic approach.", baseSnow: 0.42, snowVariance: 0.27, stormBase: 0.45, gustScale: 0.38, salt: 88, parking: 2, npcDelay: 31 }
  ];

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
    stats: document.getElementById("debriefStats"),
    intro: document.getElementById("intro"),
    scenarioBrief: document.getElementById("scenarioBrief"),
    scenarioSelect: document.getElementById("scenarioSelect"),
    scenarioSeed: document.getElementById("scenarioSeed"),
    controllerState: document.getElementById("controllerState"),
    briefingToggle: document.getElementById("briefingToggle"),
    weatherToggle: document.getElementById("weatherToggle"),
    soundToggle: document.getElementById("soundToggle"),
    pauseOverlay: document.getElementById("pauseOverlay")
  };

  const roads = [
    { x: 55, y: 90, w: 850, h: 82 },
    { x: 55, y: 259, w: 850, h: 82 },
    { x: 55, y: 428, w: 850, h: 82 },
    { x: 119, y: 60, w: 82, h: 500 },
    { x: 439, y: 60, w: 82, h: 500 },
    { x: 759, y: 60, w: 82, h: 500 }
  ];

  const townBlocks = [
    { x: 201, y: 172, w: 238, h: 87 }, { x: 521, y: 172, w: 238, h: 87 },
    { x: 201, y: 341, w: 238, h: 87 }, { x: 521, y: 341, w: 238, h: 87 }
  ];

  const depot = { x: 66, y: 505, w: 145, h: 74 };
  const buildings = [
    { x: 245, y: 185, w: 140, h: 58, label: "TOWN HALL", roof: "#495c67", wall: "#30424a", accent: "#d5b675" },
    { x: 550, y: 178, w: 165, h: 65, label: "NORTHSTAR MARKET", roof: "#355963", wall: "#294149", accent: "#e6a85c" },
    { x: 228, y: 354, w: 165, h: 58, label: "BELLWETHER CLINIC", roof: "#47636b", wall: "#2d454c", accent: "#ef8f7f" },
    { x: 552, y: 352, w: 160, h: 62, label: "LIBRARY", roof: "#4c515f", wall: "#343c47", accent: "#d6aa68" },
    { x: 720, y: 515, w: 170, h: 65, label: "STATION 2", roof: "#623f3e", wall: "#443435", accent: "#efbf67" }
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

  const evergreens = [
    { x: 78, y: 54, s: 1.05 }, { x: 232, y: 61, s: .78 }, { x: 414, y: 211, s: .72 },
    { x: 534, y: 62, s: .9 }, { x: 730, y: 67, s: .7 }, { x: 917, y: 205, s: 1.05 },
    { x: 421, y: 386, s: .8 }, { x: 536, y: 389, s: .68 }, { x: 915, y: 385, s: .82 },
    { x: 230, y: 545, s: .75 }, { x: 540, y: 548, s: 1.0 }, { x: 915, y: 555, s: .86 }
  ];

  const streetlights = [
    { x: 218, y: 84 }, { x: 410, y: 177 }, { x: 536, y: 250 }, { x: 733, y: 344 },
    { x: 213, y: 420 }, { x: 530, y: 518 }, { x: 852, y: 420 }
  ];

  const parkingPatterns = [[
    { x: 334, y: 106, w: 42, h: 21, c: "#b95e59" },
    { x: 606, y: 315, w: 43, h: 21, c: "#d6a84a" },
    { x: 135, y: 370, w: 22, h: 43, c: "#5b91aa" },
    { x: 781, y: 206, w: 22, h: 43, c: "#a183bd" },
    { x: 338, y: 475, w: 43, h: 21, c: "#739667" }
  ], [
    { x: 265, y: 140, w: 43, h: 21, c: "#b95e59" },
    { x: 650, y: 275, w: 43, h: 21, c: "#d6a84a" },
    { x: 175, y: 365, w: 22, h: 43, c: "#5b91aa" },
    { x: 765, y: 190, w: 22, h: 43, c: "#a183bd" },
    { x: 560, y: 472, w: 43, h: 21, c: "#739667" }
  ], [
    { x: 300, y: 105, w: 42, h: 21, c: "#b95e59" },
    { x: 390, y: 145, w: 43, h: 21, c: "#d6a84a" },
    { x: 605, y: 305, w: 43, h: 21, c: "#5b91aa" },
    { x: 780, y: 210, w: 22, h: 43, c: "#a183bd" },
    { x: 260, y: 470, w: 43, h: 21, c: "#739667" },
    { x: 470, y: 350, w: 22, h: 43, c: "#c06f52" }
  ]];

  const keys = new Set();
  const pressed = new Set();
  const requestedScenario = new URLSearchParams(location.search).get("scenario");
  let scenarioIndex = Math.max(0, SCENARIOS.findIndex(s => s.id === requestedScenario));
  let parkedCars = parkingPatterns[SCENARIOS[scenarioIndex].parking];
  let previousGamepadButtons = [];
  let activeGamepadName = "";
  const preferences = {
    showBriefing: readPreference("showBriefing", true),
    reducedWeather: readPreference("reducedWeather", false),
    soundEnabled: readPreference("soundEnabled", true)
  };
  let audioContext = null;
  let state;

  function readPreference(name, fallback) {
    try {
      const value = localStorage.getItem(`snow-removal:${name}`);
      return value === null ? fallback : value === "true";
    } catch { return fallback; }
  }

  function savePreference(name, value) {
    preferences[name] = value;
    try { localStorage.setItem(`snow-removal:${name}`, String(value)); } catch { /* file-mode privacy settings may block storage */ }
  }

  function ensureAudio() {
    if (!preferences.soundEnabled) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") void audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playCue(type) {
    const audio = ensureAudio();
    if (!audio) return;
    const cues = {
      blade: { from: 170, to: 105, duration: 0.13, wave: "square", volume: 0.025 },
      impact: { from: 82, to: 48, duration: 0.18, wave: "sawtooth", volume: 0.035 },
      warning: { from: 210, to: 210, duration: 0.16, wave: "square", volume: 0.025 },
      success: { from: 520, to: 720, duration: 0.2, wave: "sine", volume: 0.03 }
    };
    const cue = cues[type];
    if (!cue) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = cue.wave;
    oscillator.frequency.setValueAtTime(cue.from, now);
    oscillator.frequency.exponentialRampToValueAtTime(cue.to, now + cue.duration);
    gain.gain.setValueAtTime(cue.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + cue.duration);
  }

  function readControls() {
    const keyboardThrottle = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
    const keyboardSteer = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
    const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    const gamepad = gamepads[0];
    let throttle = keyboardThrottle;
    let steer = keyboardSteer;
    let salt = keys.has("KeyE");
    let bladePressed = pressed.has("Space");
    let startPressed = pressed.has("Enter");

    if (gamepad) {
      const buttons = gamepad.buttons.map(button => button.pressed);
      const rt = gamepad.buttons[7]?.value || 0;
      const lt = gamepad.buttons[6]?.value || 0;
      const axis = Math.abs(gamepad.axes[0] || 0) > 0.16 ? gamepad.axes[0] : 0;
      throttle = Math.abs(keyboardThrottle) > 0 ? keyboardThrottle : rt - lt;
      steer = Math.abs(keyboardSteer) > 0 ? keyboardSteer : axis;
      salt = salt || Boolean(buttons[2]);
      bladePressed = bladePressed || Boolean(buttons[0] && !previousGamepadButtons[0]);
      startPressed = startPressed || Boolean(buttons[9] && !previousGamepadButtons[9]);
      previousGamepadButtons = buttons;
      activeGamepadName = gamepad.id || "Gamepad";
    } else {
      previousGamepadButtons = [];
      activeGamepadName = "";
    }

    return { throttle, steer, salt, bladePressed, startPressed, active: Math.abs(throttle) > 0.08 || Math.abs(steer) > 0.16 || salt || bladePressed || startPressed };
  }

  function isRoad(x, y) {
    return roads.some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ||
      (x >= depot.x && x <= depot.x + depot.w && y >= depot.y && y <= depot.y + depot.h);
  }

  function reset(nextScenario = scenarioIndex, aftermath = null) {
    scenarioIndex = (nextScenario + SCENARIOS.length) % SCENARIOS.length;
    const scenario = SCENARIOS[scenarioIndex];
    parkedCars = parkingPatterns[scenario.parking];
    const snow = aftermath?.snow?.length === COLS * ROWS ? carrySnowField(aftermath.snow) : new Float32Array(COLS * ROWS);
    const treated = new Float32Array(COLS * ROWS);
    if (!aftermath) {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const wx = x * CELL + CELL / 2;
          const wy = y * CELL + CELL / 2;
          snow[y * COLS + x] = isRoad(wx, wy) ? scenario.baseSnow + noise2D(x, y, scenario.seed) * scenario.snowVariance : 0.72;
        }
      }
    }
    sensitive.forEach(s => { s.buried = false; });
    destinations.forEach(d => { d.access = 0; d.lastStatus = ""; });
    state = {
      phase: preferences.showBriefing ? "ready" : "active",
      townCycle: aftermath ? aftermath.townCycle + 1 : 1,
      elapsed: 0,
      snow,
      treated,
      scenario,
      truck: { x: 145, y: 505, angle: -Math.PI / 2, speed: 0, fuel: 100, salt: scenario.salt, blade: false, hitTimer: 0, leftDepot: false },
      npc: { x: 900, y: 300, w: 42, h: 20, active: false, completed: false, status: "MOVING", incidents: 0, delaySeconds: 0 },
      spray: [],
      weather: { intensity: scenario.stormBase, gust: 0, visibility: 1 },
      metrics: { collisions: 0, harm: 0, access: 0, score: 0, snowMoved: 0, snowLost: 0 },
      resourceWarnings: { fuel: false, salt: false },
      events: [],
      logCooldown: 0,
      resupplyCooldown: 0
    };
    addEvent("Dispatch: open the clinic, market, and Station 2.");
    addEvent("Snow leaves the blade on your right. Mind the amber zones.", true);
    ui.debrief.classList.add("hidden");
    ui.pauseOverlay.classList.add("hidden");
    ui.intro.classList.toggle("hidden", !preferences.showBriefing);
    ui.scenarioBrief.textContent = aftermath
      ? `Aftermath shift ${state.townCycle}: prior snowbanks remain after overnight settling. ${scenario.brief}`
      : scenario.brief;
    ui.scenarioSelect.value = scenario.id;
    ui.scenarioSeed.textContent = `Seed ${scenario.seed} · shift ${state.townCycle} · ${parkedCars.length} parked cars`;
    const url = new URL(location.href);
    url.searchParams.set("scenario", scenario.id);
    history.replaceState(null, "", url);
    if (!preferences.showBriefing) addEvent(`${scenario.name}: shift clock started.`);
    updateAccess(true);
    updateHud();
  }

  function beginShift() {
    if (state.phase !== "ready") return;
    state.phase = "active";
    ensureAudio();
    ui.intro.classList.add("hidden");
    addEvent(`${state.scenario.name}: shift clock started.`);
  }

  function pauseShift() {
    if (!state || state.phase !== "active") return;
    state.phase = "paused";
    state.truck.speed = 0;
    ui.pauseOverlay.classList.remove("hidden");
  }

  function resumeShift() {
    if (state.phase !== "paused") return;
    state.phase = "active";
    ui.pauseOverlay.classList.add("hidden");
    ensureAudio();
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
    const obstacles = state.npc?.active && !state.npc.completed
      ? [...parkedCars, { x: state.npc.x - state.npc.w / 2, y: state.npc.y - state.npc.h / 2, w: state.npc.w, h: state.npc.h }]
      : parkedCars;
    return obstacles.some(c => {
      const nx = Math.max(c.x, Math.min(x, c.x + c.w));
      const ny = Math.max(c.y, Math.min(y, c.y + c.h));
      return (x - nx) ** 2 + (y - ny) ** 2 < radius ** 2;
    });
  }

  function updateTruck(dt, controls) {
    const t = state.truck;
    const { throttle, steer } = controls;
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
        playCue("impact");
        t.hitTimer = 0.65;
      }
      t.speed *= -0.24;
    }
    t.hitTimer -= dt;

    const inDepot = pointInRect(t.x, t.y, depot);
    if (!inDepot) t.leftDepot = true;
    if (inDepot && t.leftDepot) {
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
      const dx = sx + rightX * 48;
      const dy = sy + rightY * 48;
      const dest = snowIndexAt(dx, dy);
      const transfer = transferSnow(state.snow, source, dest, 1.7 * dt);
      if (transfer.removed <= 0.002) continue;
      state.metrics.snowMoved += transfer.deposited;
      state.metrics.snowLost += transfer.lost;
      if (transfer.removed > 0.008 && state.spray.length < 90) {
        const variance = noise2D(Math.floor(sx), Math.floor(sy), Math.floor(state.elapsed * 30) + state.scenario.seed);
        state.spray.push({
          x: sx,
          y: sy,
          vx: rightX * (54 + variance * 30) + fx * 8,
          vy: rightY * (54 + variance * 30) + fy * 8,
          life: 0.36 + variance * 0.18,
          size: 1.8 + variance * 2.4
        });
      }
    }
  }

  function updateSpray(dt) {
    for (const particle of state.spray) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.92, dt * 60);
      particle.vy *= Math.pow(0.92, dt * 60);
      particle.life -= dt;
    }
    state.spray = state.spray.filter(particle => particle.life > 0);
  }

  function spreadSalt(dt, controls) {
    const t = state.truck;
    if (!controls.salt || t.salt <= 0) return;
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
    w.intensity = state.scenario.stormBase + w.gust * state.scenario.gustScale;
    w.visibility = 1 - w.gust * 0.28;
    const amount = w.intensity * 0.0052 * dt;
    for (let i = 0; i < state.snow.length; i++) {
      const shield = state.treated[i] * 0.75;
      state.snow[i] = Math.min(2.5, state.snow[i] + amount * (1 - shield));
      state.treated[i] = Math.max(0, state.treated[i] - 0.035 * dt);
    }
  }

  function updateNpc(dt) {
    const npc = state.npc;
    if (npc.completed || state.elapsed < state.scenario.npcDelay) return;
    if (!npc.active) {
      npc.active = true;
      addEvent("Northstar delivery van entering on East Road.");
    }

    const probeX = npc.x - 28;
    const depth = snowDepthAt(probeX, npc.y);
    const nextStatus = classifyNpcObstruction(depth, npc.status);
    if (nextStatus !== npc.status) {
      npc.status = nextStatus;
      if (nextStatus === "STUCK") {
        npc.incidents++;
        addEvent("Delivery van trapped by deep road snow. Clear its lane!", true);
        playCue("warning");
      } else {
        addEvent("Delivery van is moving again. Route recovery confirmed.");
        playCue("success");
      }
    }
    if (npc.status === "STUCK") {
      npc.delaySeconds += dt;
      return;
    }

    npc.x -= 25 * dt;
    if (npc.x < 68) {
      npc.completed = true;
      addEvent("Delivery van cleared town. Northstar remains supplied.");
    }
  }

  function computeConnectedRoadCells() {
    const starts = [];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const wx = x * CELL + CELL / 2;
        const wy = y * CELL + CELL / 2;
        if (pointInRect(wx, wy, depot)) {
          starts.push(y * COLS + x);
        }
      }
    }
    return floodConnected({
      cols: COLS,
      rows: ROWS,
      starts,
      isPassable: (next, nx, ny) => {
        const wx = nx * CELL + CELL / 2;
        const wy = ny * CELL + CELL / 2;
        return isRoad(wx, wy) && state.snow[next] < 0.52;
      }
    });
  }

  function averageZone(zone, connected) {
    let open = 0;
    let total = 0;
    for (let y = zone.y + 10; y < zone.y + zone.h; y += 20) {
      for (let x = zone.x + 10; x < zone.x + zone.w; x += 20) {
        total++;
        const idx = snowIndexAt(x, y);
        if (state.snow[idx] < 0.31 && connected[idx]) open++;
      }
    }
    return total ? open / total : 0;
  }

  function updateAccess(silent = false) {
    const connected = computeConnectedRoadCells();
    state.connected = connected;
    let accessSum = 0;
    destinations.forEach(d => {
      d.access = averageZone(d.zone, connected);
      accessSum += d.access;
      const status = classifyAccess(d.access, d.lastStatus);
      if (!silent && d.lastStatus && d.lastStatus !== status) {
        addEvent(`${d.name}: access ${status.toLowerCase()}.`, status !== "OPEN");
        playCue(status === "OPEN" ? "success" : "warning");
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
    state.metrics.score = scoreShift({
      access: state.metrics.access,
      fuel: state.truck.fuel,
      salt: state.truck.salt,
      harm,
      collisions: state.metrics.collisions,
      delayPenalty: Math.min(15, state.npc.delaySeconds * 0.25)
    });
  }

  function update(dt) {
    if (pressed.has("KeyR")) { reset(); pressed.clear(); return; }
    if (pressed.has("KeyN")) { reset(scenarioIndex + 1); pressed.clear(); return; }
    const controls = readControls();
    const pausePressed = pressed.has("KeyP") || pressed.has("Escape") || controls.startPressed;
    if (state.phase === "paused") {
      if (pausePressed) resumeShift();
      pressed.clear();
      return;
    }
    if (state.phase === "ready") {
      if (controls.active) beginShift();
      else { pressed.clear(); return; }
    } else if (pausePressed) {
      pauseShift();
      pressed.clear();
      return;
    }
    if (state.phase !== "active") { pressed.clear(); return; }
    if (controls.bladePressed) {
      state.truck.blade = !state.truck.blade;
      addEvent(`Blade ${state.truck.blade ? "lowered" : "raised"}.`);
      playCue("blade");
    }
    state.elapsed += dt;
    updateTruck(dt, controls);
    plowSnow(dt);
    spreadSalt(dt, controls);
    updateWeather(dt);
    updateNpc(dt);
    updateSpray(dt);
    if (state.truck.fuel < 15 && !state.resourceWarnings.fuel) {
      state.resourceWarnings.fuel = true;
      addEvent("Fuel below 15%. Return to the yard.", true);
      playCue("warning");
    }
    if (state.truck.salt < 15 && !state.resourceWarnings.salt) {
      state.resourceWarnings.salt = true;
      addEvent("Salt hopper below 15%.", true);
      playCue("warning");
    }
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
    state.debrief = createDebrief({
      scenario: state.scenario,
      townCycle: state.townCycle,
      elapsed: state.elapsed,
      access: state.metrics.access,
      harm: state.metrics.harm,
      collisions: state.metrics.collisions,
      score,
      fuel: state.truck.fuel,
      salt: state.truck.salt,
      returnedToDepot: pointInRect(state.truck.x, state.truck.y, depot),
      npcDelaySeconds: state.npc.delaySeconds,
      npcIncidents: state.npc.incidents,
      snowMoved: state.metrics.snowMoved,
      snowLost: state.metrics.snowLost
    });
    ui.debrief.classList.remove("hidden");
    playCue(score >= 70 ? "success" : "warning");
  }

  function downloadDebrief() {
    if (!state.debrief) return;
    const blob = new Blob([JSON.stringify(state.debrief, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `snow-removal-${state.scenario.id}-${state.scenario.seed}-debrief.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function continueAftermath() {
    const aftermath = { snow: state.snow.slice(), townCycle: state.townCycle };
    reset(scenarioIndex, aftermath);
  }

  function roundedRectPath(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawEvergreen(tree) {
    const { x, y, s } = tree;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(8, 18, 23, .32)";
    ctx.beginPath();
    ctx.ellipse(5, 16, 15, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#172f32";
    for (const [yy, width] of [[9, 13], [1, 11], [-7, 8]]) {
      ctx.beginPath();
      ctx.moveTo(0, yy - 17);
      ctx.lineTo(-width, yy + 8);
      ctx.lineTo(width, yy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(226, 241, 244, .68)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-width + 2, yy + 5);
      ctx.quadraticCurveTo(0, yy + 1, width - 2, yy + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStreetlight(light) {
    const glow = ctx.createRadialGradient(light.x, light.y - 11, 0, light.x, light.y - 11, 19);
    glow.addColorStop(0, "rgba(255, 211, 130, .22)");
    glow.addColorStop(1, "rgba(255, 211, 130, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(light.x, light.y - 11, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#24343b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(light.x, light.y + 6);
    ctx.lineTo(light.x, light.y - 10);
    ctx.lineTo(light.x + 5, light.y - 10);
    ctx.stroke();
    ctx.fillStyle = "#ffd889";
    ctx.beginPath();
    ctx.arc(light.x + 6, light.y - 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBuilding(b) {
    ctx.save();
    ctx.shadowColor = "rgba(5, 12, 16, .55)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 7;
    roundedRectPath(b.x, b.y + 4, b.w, b.h - 4, 5);
    ctx.fillStyle = b.wall;
    ctx.fill();
    ctx.shadowColor = "transparent";

    const roof = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h * .62);
    roof.addColorStop(0, "#60717a");
    roof.addColorStop(.14, b.roof);
    roof.addColorStop(1, "#26363d");
    roundedRectPath(b.x - 4, b.y - 3, b.w + 8, b.h * .56, 6);
    ctx.fillStyle = roof;
    ctx.fill();
    ctx.strokeStyle = "rgba(10, 20, 24, .55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "rgba(242, 249, 250, .8)";
    ctx.beginPath();
    ctx.moveTo(b.x - 2, b.y - 2);
    ctx.quadraticCurveTo(b.x + b.w * .25, b.y + 3, b.x + b.w * .48, b.y - 1);
    ctx.quadraticCurveTo(b.x + b.w * .72, b.y + 4, b.x + b.w + 2, b.y);
    ctx.lineTo(b.x + b.w + 3, b.y + 6);
    ctx.quadraticCurveTo(b.x + b.w * .65, b.y + 10, b.x - 3, b.y + 6);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = "rgba(255, 190, 96, .38)";
    ctx.shadowBlur = 7;
    ctx.fillStyle = b.accent;
    const windowY = b.y + b.h * .63;
    for (let x = b.x + 13; x < b.x + b.w - 11; x += 27) {
      roundedRectPath(x, windowY, 11, 8, 1.5);
      ctx.fill();
    }
    ctx.shadowColor = "transparent";

    roundedRectPath(b.x + b.w / 2 - Math.min(54, b.w * .38), b.y + b.h - 13, Math.min(108, b.w * .76), 16, 4);
    ctx.fillStyle = "rgba(11, 21, 26, .82)";
    ctx.fill();
    ctx.fillStyle = "#dce8eb";
    ctx.font = "800 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h - 2);
    ctx.restore();
  }

  function drawWorld() {
    const ground = ctx.createLinearGradient(0, 0, W, H);
    ground.addColorStop(0, "#dce8e9");
    ground.addColorStop(.52, "#c7d7da");
    ground.addColorStop(1, "#aebfc4");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 90; i++) {
      const x = (i * 137) % W;
      const y = (i * 83 + 37) % H;
      const r = 5 + (i % 9) * 2;
      ctx.fillStyle = i % 3 === 0
        ? `rgba(255, 255, 255, ${.08 + (i % 4) * .018})`
        : `rgba(111, 145, 155, ${.025 + (i % 4) * .01})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.7, r, (i % 5) * .25, 0, Math.PI * 2);
      ctx.fill();
    }

    roads.forEach(r => {
      ctx.fillStyle = "rgba(10, 18, 22, .38)";
      ctx.fillRect(r.x - 6, r.y + 4, r.w + 12, r.h + 7);
    });
    const asphalt = ctx.createLinearGradient(0, 70, 0, 550);
    asphalt.addColorStop(0, "#26363d");
    asphalt.addColorStop(.55, "#1e2e35");
    asphalt.addColorStop(1, "#293b42");
    ctx.fillStyle = asphalt;
    roads.forEach(r => ctx.fillRect(r.x, r.y, r.w, r.h));

    ctx.strokeStyle = "rgba(196, 213, 216, .42)";
    ctx.lineWidth = 4;
    townBlocks.forEach(block => {
      roundedRectPath(block.x + 2, block.y + 2, block.w - 4, block.h - 4, 5);
      ctx.stroke();
    });

    ctx.setLineDash([20, 19]);
    ctx.strokeStyle = "rgba(218, 211, 171, .22)";
    ctx.lineWidth = 1.5;
    [131, 300, 469].forEach(y => { ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(900, y); ctx.stroke(); });
    [160, 480, 800].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 65); ctx.lineTo(x, 555); ctx.stroke(); });
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(8, 16, 20, .3)";
    ctx.lineWidth = 2;
    [117, 145, 286, 314, 455, 483].forEach(y => { ctx.beginPath(); ctx.moveTo(64, y); ctx.lineTo(896, y); ctx.stroke(); });

    evergreens.forEach(drawEvergreen);
    streetlights.forEach(drawStreetlight);

    ctx.save();
    ctx.shadowColor = "rgba(5, 14, 16, .45)";
    ctx.shadowBlur = 8;
    roundedRectPath(depot.x, depot.y, depot.w, depot.h, 8);
    ctx.fillStyle = "#244b3a";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(137, 213, 169, .72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#b5e4c8";
    ctx.font = "800 9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText("PUBLIC WORKS · RESUPPLY", depot.x + 8, depot.y + depot.h - 9);
    ctx.restore();

    buildings.forEach(drawBuilding);

    destinations.forEach(d => {
      const open = d.access >= .7;
      const color = open ? "#72d6a0" : "#70c4ef";
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = open ? 15 : 8;
      roundedRectPath(d.zone.x + 2, d.zone.y + 2, d.zone.w - 4, d.zone.h - 4, 8);
      ctx.fillStyle = open ? "rgba(114, 214, 160, .1)" : "rgba(98, 183, 232, .07)";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(d.zone.x + 15, d.zone.y + 15, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#10202a";
      ctx.font = "900 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(d.icon, d.zone.x + 15, d.zone.y + 18.5);
      ctx.restore();
    });

    sensitive.forEach(s => {
      const color = s.buried ? "#ff6b5e" : "#ffc469";
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.PI / 4);
      ctx.shadowColor = color;
      ctx.shadowBlur = s.buried ? 12 : 5;
      roundedRectPath(-10, -10, 20, 20, 4);
      ctx.fillStyle = s.buried ? "rgba(255, 107, 94, .9)" : "rgba(255, 196, 105, .82)";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#18242a";
      ctx.font = "900 8px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(s.type === "HYDRANT" ? "H" : "D", 0, 3);
      ctx.restore();
    });
  }

  function drawSnow() {
    ctx.save();
    ctx.beginPath();
    roads.forEach(r => ctx.rect(r.x, r.y, r.w, r.h));
    ctx.rect(depot.x, depot.y, depot.w, depot.h);
    ctx.clip();

    const surface = snowSurfaceImage;
    surface.data.fill(0);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const idx = y * COLS + x;
        const cx = x * CELL + CELL / 2;
        const cy = y * CELL + CELL / 2;
        if (!isRoad(cx, cy) || state.snow[idx] < 0.035) continue;
        const d = state.snow[idx];
        const variation = noise2D(x, y, state.scenario.seed);
        const pixel = idx * 4;
        surface.data[pixel] = 235 + Math.round(variation * 16);
        surface.data[pixel + 1] = 244 + Math.round(variation * 10);
        surface.data[pixel + 2] = 248 + Math.round(variation * 7);
        surface.data[pixel + 3] = Math.min(255, Math.round(45 + Math.sqrt(d) * 300));
      }
    }
    snowSurfaceCtx.putImageData(surface, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(snowSurface, -CELL / 2, -CELL / 2, W + CELL, H + CELL);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const idx = y * COLS + x;
        const d = state.snow[idx];
        if (d < 0.045) continue;
        const cx = x * CELL + CELL / 2;
        const cy = y * CELL + CELL / 2;
        if (!isRoad(cx, cy)) continue;

        if (d > .84) {
          ctx.save();
          ctx.shadowColor = "rgba(14, 35, 44, .25)";
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 5;
          const bank = ctx.createLinearGradient(cx, cy - 18, cx, cy + 16);
          bank.addColorStop(0, "rgba(255,255,255,.92)");
          bank.addColorStop(.55, "rgba(225,240,245,.86)");
          bank.addColorStop(1, "rgba(164,196,207,.72)");
          ctx.fillStyle = bank;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.min(23, 13 + d * 4), Math.min(15, 7 + d * 2.7), -.16, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (state.treated[idx] > .15) {
          const treatment = state.treated[idx];
          ctx.fillStyle = `rgba(131, 222, 181, ${treatment * .35})`;
          for (let p = 0; p < 5; p++) {
            const px = cx - 13 + noise2D(x + p, y, 81) * 26;
            const py = cy - 13 + noise2D(x, y + p, 93) * 26;
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    ctx.restore();
  }

  function drawCars() {
    parkedCars.forEach(c => {
      const horizontal = c.w > c.h;
      ctx.save();
      ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
      ctx.shadowColor = "rgba(4, 11, 15, .7)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 4;
      roundedRectPath(-c.w / 2, -c.h / 2, c.w, c.h, 6);
      const paint = ctx.createLinearGradient(-c.w / 2, -c.h / 2, c.w / 2, c.h / 2);
      paint.addColorStop(0, "#d9e2e5");
      paint.addColorStop(.13, c.c);
      paint.addColorStop(1, "#26383f");
      ctx.fillStyle = paint;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#14242b";
      if (horizontal) {
        roundedRectPath(-8, -c.h / 2 + 4, 18, c.h - 8, 3);
      } else {
        roundedRectPath(-c.w / 2 + 4, -8, c.w - 8, 18, 3);
      }
      ctx.fill();
      ctx.fillStyle = "rgba(242, 249, 251, .76)";
      ctx.beginPath();
      if (horizontal) ctx.ellipse(-5, -c.h / 2 + 2, 12, 2.2, 0, 0, Math.PI * 2);
      else ctx.ellipse(-c.w / 2 + 2, -5, 2.2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawNpc() {
    const npc = state.npc;
    if (!npc.active || npc.completed) return;
    ctx.save();
    ctx.translate(npc.x, npc.y);
    ctx.shadowColor = "rgba(4, 11, 15, .7)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 4;
    roundedRectPath(-npc.w / 2, -npc.h / 2, npc.w, npc.h, 5);
    const vanPaint = ctx.createLinearGradient(-20, -10, 20, 10);
    vanPaint.addColorStop(0, "#fbf7e8");
    vanPaint.addColorStop(1, npc.status === "STUCK" ? "#c95b52" : "#9e9b89");
    ctx.fillStyle = vanPaint;
    ctx.fill();
    ctx.shadowColor = "transparent";
    roundedRectPath(-8, -npc.h / 2 + 4, 17, npc.h - 8, 2);
    ctx.fillStyle = "#355b6b";
    ctx.fill();
    ctx.fillStyle = "#162229";
    ctx.font = "900 8px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("NPC", 0, 3);
    if (npc.status === "STUCK") {
      roundedRectPath(-24, -32, 48, 14, 4);
      ctx.fillStyle = "#ff6b5e";
      ctx.fill();
      ctx.fillStyle = "#111b20";
      ctx.fillText("STUCK", 0, -21);
    }
    ctx.restore();
  }

  function drawConnectivity() {
    if (!state.connected) return;
    const drawLinks = (width, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const idx = y * COLS + x;
          if (!state.connected[idx]) continue;
          const cx = x * CELL + CELL / 2;
          const cy = y * CELL + CELL / 2;
          if (x + 1 < COLS && state.connected[idx + 1]) {
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + CELL, cy); ctx.stroke();
          }
          if (y + 1 < ROWS && state.connected[idx + COLS]) {
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + CELL); ctx.stroke();
          }
        }
      }
    };
    drawLinks(7, "rgba(53, 144, 185, .12)");
    drawLinks(2, "rgba(118, 207, 244, .34)");
  }

  function drawSpray() {
    for (const particle of state.spray) {
      const alpha = Math.min(0.9, particle.life * 2.4);
      ctx.fillStyle = `rgba(230, 247, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTruck() {
    const t = state.truck;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    ctx.fillStyle = "rgba(4, 10, 14, .5)";
    ctx.beginPath();
    ctx.ellipse(1, 5, 29, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10191e";
    roundedRectPath(-20, -15, 9, 6, 2); ctx.fill();
    roundedRectPath(-20, 9, 9, 6, 2); ctx.fill();
    roundedRectPath(9, -15, 9, 6, 2); ctx.fill();
    roundedRectPath(9, 9, 9, 6, 2); ctx.fill();
    const body = ctx.createLinearGradient(-22, -14, 22, 14);
    body.addColorStop(0, "#8b551d");
    body.addColorStop(.42, "#f0a538");
    body.addColorStop(1, "#9d5d1f");
    roundedRectPath(-21, -12, 43, 24, 6);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "rgba(74, 40, 12, .7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    roundedRectPath(-16, -8, 17, 16, 3);
    ctx.fillStyle = "#b86f25";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 210, 124, .4)";
    ctx.stroke();
    roundedRectPath(3, -9, 14, 18, 4);
    ctx.fillStyle = "#dce8e9";
    ctx.fill();
    ctx.fillStyle = "#2b5262";
    roundedRectPath(8, -7, 7, 14, 2);
    ctx.fill();
    ctx.fillStyle = "#17262d";
    roundedRectPath(-13, -5, 9, 10, 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(236, 244, 246, .35)";
    ctx.lineWidth = 1;
    for (let line = -10; line <= -5; line += 2.5) {
      ctx.beginPath(); ctx.moveTo(line, -5); ctx.lineTo(line, 5); ctx.stroke();
    }
    const beacon = ctx.createRadialGradient(1, -14, 0, 1, -14, 11);
    beacon.addColorStop(0, "rgba(255, 201, 75, .7)");
    beacon.addColorStop(1, "rgba(255, 201, 75, 0)");
    ctx.fillStyle = beacon;
    ctx.beginPath(); ctx.arc(1, -14, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd15a";
    ctx.fillRect(-1, -13, 4, 3);
    if (t.blade) {
      ctx.strokeStyle = "#dceef3";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(24, -20);
      ctx.lineTo(28, 20);
      ctx.stroke();
      ctx.strokeStyle = "#4f7889";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "#172a33";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(18, -7); ctx.lineTo(25, -15); ctx.moveTo(18, 7); ctx.lineTo(27, 15); ctx.stroke();
    } else {
      ctx.strokeStyle = "#789aa8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(20, -14);
      ctx.lineTo(20, 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWeather() {
    const gust = state.weather.gust;
    const visualScale = preferences.reducedWeather ? 0.35 : 1;
    ctx.fillStyle = `rgba(220,240,248,${(1 - state.weather.visibility) * .32 * visualScale})`;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(255,255,255,${(.2 + gust * .31) * visualScale})`;
    const flakeCount = preferences.reducedWeather ? 20 : 58;
    for (let i = 0; i < flakeCount; i++) {
      const x = (i * 173 + state.elapsed * (35 + gust * 70)) % (W + 40) - 20;
      const y = (i * 97 + state.elapsed * 63) % (H + 30) - 15;
      const size = .8 + (i % 5) * .35;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 3 + gust * 7 + size, y + 5 + size * 2);
      ctx.stroke();
    }
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .82);
    vignette.addColorStop(0, "rgba(3, 10, 14, 0)");
    vignette.addColorStop(1, "rgba(3, 10, 14, .28)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function render() {
    drawWorld();
    drawSnow();
    drawConnectivity();
    drawSpray();
    drawCars();
    drawNpc();
    drawTruck();
    drawWeather();
  }

  function updateHud() {
    const remaining = Math.max(0, SHIFT_SECONDS - state.elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    ui.time.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    ui.storm.textContent = `${state.scenario.name.toUpperCase()} · ${state.weather.gust > .68 ? "LOW VISIBILITY" : "ACTIVE"}`;
    ui.access.textContent = `${Math.round(state.metrics.access * 100)}%`;
    ui.fuelMeter.value = state.truck.fuel;
    ui.fuel.textContent = `${Math.round(state.truck.fuel)}%`;
    ui.saltMeter.value = state.truck.salt;
    ui.salt.textContent = `${Math.round(state.truck.salt)}%`;
    ui.score.textContent = state.metrics.score;
    const buried = sensitive.filter(s => s.buried).length;
    ui.harm.textContent = state.npc.status === "STUCK" ? `NPC delayed ${Math.round(state.npc.delaySeconds)}s` : buried ? `${buried} access point${buried > 1 ? "s" : ""} buried` : "No blocked access points";
    ui.blade.textContent = state.truck.blade ? "BLADE LOWERED · SNOW → RIGHT" : "BLADE RAISED";
    ui.blade.classList.toggle("raised", !state.truck.blade);
    ui.controllerState.textContent = activeGamepadName ? `CONTROLLER READY · ${activeGamepadName.slice(0, 28)}` : "NO CONTROLLER DETECTED";
    ui.controllerState.classList.toggle("connected", Boolean(activeGamepadName));
    ui.destinations.innerHTML = destinations.map(d => {
      const pct = Math.round(d.access * 100);
      const cls = pct >= 70 ? "" : pct >= 45 ? "strained" : "blocked";
      const status = d.lastStatus || classifyAccess(d.access);
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
  window.addEventListener("blur", () => { keys.clear(); pressed.clear(); pauseShift(); });
  document.getElementById("restartButton").addEventListener("click", () => reset());
  document.getElementById("downloadDebrief").addEventListener("click", downloadDebrief);
  document.getElementById("continueAftermath").addEventListener("click", continueAftermath);
  document.getElementById("startButton").addEventListener("click", beginShift);
  document.getElementById("resumeButton").addEventListener("click", resumeShift);
  ui.scenarioSelect.innerHTML = SCENARIOS.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  ui.scenarioSelect.addEventListener("change", () => reset(SCENARIOS.findIndex(s => s.id === ui.scenarioSelect.value)));
  ui.briefingToggle.checked = preferences.showBriefing;
  ui.weatherToggle.checked = preferences.reducedWeather;
  ui.soundToggle.checked = preferences.soundEnabled;
  ui.briefingToggle.addEventListener("change", () => savePreference("showBriefing", ui.briefingToggle.checked));
  ui.weatherToggle.addEventListener("change", () => savePreference("reducedWeather", ui.weatherToggle.checked));
  ui.soundToggle.addEventListener("change", () => {
    savePreference("soundEnabled", ui.soundToggle.checked);
    if (!preferences.soundEnabled && audioContext?.state === "running") void audioContext.suspend().catch(() => {});
    if (preferences.soundEnabled) playCue("success");
  });

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
