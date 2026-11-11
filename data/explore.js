/* Explore helpers — deterministic derivations on top of window.NETWORK_DATA. Sets window.EXPLORE. */
(function () {
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = hash(seed); return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hex(n, len) { var s = (n >>> 0).toString(16).toUpperCase(); while (s.length < len) s = "0" + s; return s.slice(-len); }

  var STATE_ORDER = { down: 0, degraded: 1, healthy: 2 };
  var LOC_LABEL = { healthy: "Operational", degraded: "Warning", down: "Failed" };
  var LOC_COLOR = { healthy: "var(--success)", degraded: "var(--warning)", down: "var(--destructive)" };
  var DEV_ORDER = { offline: 0, pending: 1, operational: 2 };
  var DEV_LABEL = { operational: "Operational", offline: "Failed", pending: "Warning" };
  var GW_MODELS = ["Wiliot GW Cell 2", "Wiliot GW Wi-Fi", "Edge Hub 300"];
  var FW = ["4.4.2", "4.5.0", "4.5.1", "4.6.0", "4.6.2"];
  var CONFIG = [
    ["Radio", [["rx_channel", "RX channel used to listen for Pixels", "37"], ["tx_power", "Transmit power in dBm", "+4"], ["energy_pattern", "Energizing pattern id", "P2"]]],
    ["Datapath", [["pacer_interval", "Minimum seconds between packets per Pixel", "15"], ["rssi_threshold", "Packets weaker than this are dropped", "-80"], ["packet_filter", "Which packet types are forwarded", "All"]]],
    ["Power", [["output_power", "Energizing output level", "Max"], ["sleep_mode", "Low-power mode when idle", "Off"]]],
  ];

  var cache = null;
  function build() {
    var D = window.NETWORK_DATA;
    if (!D) return null;
    if (cache && cache.D === D) return cache;
    var devices = [], byId = {};
    D.locations.forEach(function (l) {
      var depH = hash(l.id + "dep") % 10;
      var dep = depH < 7 ? "Deployed" : depH < 9 ? "In progress" : "Planned";
      l.dus.forEach(function (u) {
        u.devices.forEach(function (d, k) {
          var h = hash(d.id), r = rng(d.id + "v");
          var gw = d.kind === "gateway";
          var sn = gw ? d.sn : d.name;
          var status = !d.online ? "offline" : (h % 53 === 0 ? "pending" : "operational");
          var model = gw ? GW_MODELS[h % 3] : (d.mx && d.mx[1] ? d.mx[1][1] : "ERMV2");
          var interf = []; var hi = (d.codes || []).some(function (c) { return c === "0x1a" || c === "0x1b"; });
          for (var i = 0; i < D.buckets; i++) interf.push(Math.min(1, (hi ? 0.55 : 0.12) + r() * (hi ? 0.45 : 0.3)));
          var dev = {
            id: d.id, raw: d, kind: d.kind, gw: gw, sn: sn, name: gw ? "Gateway " + sn.replace("GW-", "") : sn,
            shortId: hex(h, 8), model: model, fw: FW[h % FW.length], template: u.type, loc: l, du: u,
            labels: (u.letter === "D" ? ["dock"] : u.letter === "C" ? ["conveyor"] : []).concat([gw ? "gateway" : "bridge"]),
            status: status, statusLabel: DEV_LABEL[status], codes: d.codes || [], health: d.health || 0,
            compliance: (d.codes || []).indexOf("0x5a") >= 0 ? "Non-compliant" : "Compliant", deployment: dep,
            hist: d.hist, interf: interf, mx: d.mx || [], idx: k,
          };
          devices.push(dev); byId[dev.id] = dev;
        });
      });
    });
    devices.sort(function (a, b) { return (DEV_ORDER[a.status] - DEV_ORDER[b.status]) || (a.sn < b.sn ? -1 : a.sn > b.sn ? 1 : 0); });
    var locsSorted = D.locations.slice().sort(function (a, b) { return (STATE_ORDER[a.state] - STATE_ORDER[b.state]) || a.name.localeCompare(b.name); });
    cache = { D: D, devices: devices, devById: byId, locsSorted: locsSorted, items: {} };
    return cache;
  }

  var ZONES = [{ x: 38, y: 1, w: 36, h: 12, label: "Receiving" }, { x: 28.5, y: 15, w: 17, h: 31, label: "Cold storage" }, { x: 4.5, y: 53, w: 28, h: 19, label: "Staging" }];
  var CATS = {
    printers: [["zt411", "Zebra ZT411", "var(--w-blue-600)"], ["zt610", "Zebra ZT610", "var(--w-purple-500)"], ["pm45", "Honeywell PM45", "var(--w-slate-500)"]],
    pixels: [["recent", "Seen in last 15 min", "var(--w-purple-500)"], ["stale", "Not seen in 15 min+", "var(--w-slate-400)"]],
    sensors: [["proper", "In range", "var(--brand)"], ["elevated", "Elevated", "var(--warning)"], ["high", "High", "var(--w-yellow-700)"], ["excursion", "Excursion", "var(--destructive)"]],
    assets: [["dock", "At dock door", "var(--w-blue-600)"], ["zone", "In zone", "var(--w-blue-400)"], ["idle", "Idle 24h+", "var(--w-slate-400)"]],
  };


  function tempProfile(l) { return (hash(l.id + "prof") % 4) === 0 ? { kind: "Freezer", base: -19, lim: [-15, -12, -8] } : { kind: "Chiller", base: 2.8, lim: [5, 7, 8.5] }; }
  function tempBand(t, pf) { return t > pf.lim[2] ? "excursion" : t > pf.lim[1] ? "high" : t > pf.lim[0] ? "elevated" : "proper"; }
  function itemsFor(layer, l) {
    var c = build(); if (!c) return [];
    var key = layer + ":" + l.id;
    if (c.items[key]) return c.items[key];
    var r = rng(l.id + layer), out = [], cats = CATS[layer];
    var inPlan = function () { return [6 + r() * 88, 6 + r() * 86]; };
    var inZone = function () { var z = ZONES[Math.floor(r() * ZONES.length)]; return [z.x + 2 + r() * (z.w - 4), z.y + 2 + r() * (z.h - 4)]; };
    var mk = function (o) { var cat = cats.filter(function (x) { return x[0] === o.cat; })[0]; o.catLabel = cat[1]; o.color = cat[2]; o.loc = l; out.push(o); };
    if (layer === "printers") {
      var n = 1 + (hash(l.id) % 4), ws = l.dus.filter(function (u) { return u.letter === "W" || u.letter === "D"; });
      for (var i = 0; i < n; i++) { var u = ws[i % Math.max(1, ws.length)]; var mdl = ["zt411", "zt610", "pm45"][Math.floor(r() * 3)]; var p = u ? [u.x + 3, u.y - 6] : inPlan();
        mk({ id: l.id + "-P" + i, name: "PRN-" + hex(hash(l.id + i), 4), x: p[0], y: p[1], cat: mdl, du: u, meta: (120 + Math.floor(r() * 300)) + " labels today" + (u ? " · near " + u.name : ""), icon: "printer" }); }
    } else if (layer === "pixels") {
      var np = 24 + (hash(l.id + "np") % 96);
      for (var j = 0; j < np; j++) { var q = r() < 0.6 ? inZone() : inPlan(); var stale = r() < 0.18;
        mk({ id: l.id + "-X" + j, name: "PX-" + hex(hash(l.id + "x" + j), 6), x: q[0], y: q[1], cat: stale ? "stale" : "recent", meta: stale ? "Last seen " + (20 + Math.floor(r() * 90)) + " min ago" : "Last seen " + (1 + Math.floor(r() * 14)) + " min ago" }); }
    } else if (layer === "sensors") {
      var pf = tempProfile(l), drift = (hash(l.id + "drift") % 100) < 11 ? 1.5 + (hash(l.id + "dv") % 60) / 10 : 0;
      for (var k = 0; k < 6 + (hash(l.id + "ns") % 5); k++) { var s = k < 5 ? inZone() : inPlan(); var t = pf.base + (r() - 0.5) * 3.6 + drift + (r() < 0.05 ? 2 + r() * 6 : 0); var cat = tempBand(t, pf);
        mk({ id: l.id + "-S" + k, name: "T-" + String(k + 1).padStart(2, "0"), x: s[0], y: s[1], cat: cat, temp: t, meta: t.toFixed(1) + "°C" }); }
    } else if (layer === "assets") {
      var docks = l.dus.filter(function (u) { return u.letter === "D"; });
      var na = 16 + (hash(l.id + "na") % 64);
      for (var m = 0; m < na; m++) { var du = docks.length && r() < 0.45 ? docks[Math.floor(r() * docks.length)] : null; var idle = !du && r() < 0.25;
        var a = du ? [du.x + (r() - 0.5) * 5, du.y - 3 - r() * 8] : inZone();
        mk({ id: l.id + "-A" + m, name: "TOTE-" + (10000 + (hash(l.id + m) % 89999)), x: a[0], y: a[1], cat: du ? "dock" : idle ? "idle" : "zone", du: du, meta: du ? "At " + du.name : idle ? "No movement in 26h" : "In zone" }); }
    }
    c.items[key] = out;
    return out;
  }

  function metrics(l) {
    var gw = 0, br = 0;
    l.dus.forEach(function (u) { u.devices.forEach(function (d) { if (d.kind === "gateway") gw++; else br++; }); });
    var pr = itemsFor("printers", l), px = itemsFor("pixels", l), se = itemsFor("sensors", l), as = itemsFor("assets", l);
    return { gateways: gw, bridges: br, devices: gw + br, printers: pr.length, printersDown: 0,
      pixels: px.length, temp: se.length ? se.reduce(function (a, x) { return a + x.temp; }, 0) / se.length : 0, tempBand: se.length ? tempBand(se.reduce(function (a, x) { return a + x.temp; }, 0) / se.length, tempProfile(l)) : "proper", tempKind: tempProfile(l).kind, assets: as.length };
  }
  // Lens status tags — one unified status family, shared by the map pins, the floating-panel rows and every lens.
  //   Lifecycle: NEW (blue) → deploying (purple 600, red dot if a deployment errored) → just deployed <1 week (green ✓, same as healthy)
  //   → operational ≥1 week, shown by current network health: ✓ green · ⚠ % yellow · ⊗ % red.
  var LENS_TONE = {
    green: ["var(--w-green-300)", "var(--w-green-950)"], yellow: ["var(--w-yellow-300)", "var(--w-yellow-950)"], red: ["var(--w-red-300)", "var(--w-red-950)"],
    blue: ["var(--w-blue-300)", "var(--w-blue-950)"], purpleDark: ["var(--w-purple-600)", "#FFFFFF"], purple: ["var(--w-purple-200)", "var(--w-purple-950)"],
  };
  function lifecycle(l) {
    var h = hash(l.id + "life") % 100;
    var stage = h < 5 ? "new" : h < 25 ? "deploying" : h < 27 ? "deployError" : h < 37 ? "justDeployed" : "operational";
    var p = 15 + (hash(l.id + "prog") % 75);
    return { stage: stage, progress: p, failed: 6 + (hash(l.id + "fail") % 30),
      daysSince: stage === "justDeployed" ? 1 + (hash(l.id + "ds") % 6) : stage === "operational" ? 8 + (hash(l.id + "ds") % 300) : 0,
      label: { new: "New", deploying: "Deploying", deployError: "Deployment error", justDeployed: "Just deployed", operational: "Operational" }[stage] };
  }
  // Network state as the lenses show it: keep warnings/errors to ~10% of all sites (the raw demo data is far noisier).
  var stCache = null;
  function lensState(l) {
    var D = window.NETWORK_DATA;
    if (!D) return l.state;
    if (!stCache || stCache.D !== D) {
      var bad = D.locations.filter(function (x) { return x.state !== "healthy" && lifecycle(x).stage === "operational"; })
        .sort(function (a, b) { return (a.state === "down" ? 0 : 1) - (b.state === "down" ? 0 : 1) || hash(a.id + "keep") - hash(b.id + "keep"); });
      var n = Math.round(D.locations.length * 0.10), nRed = Math.max(1, Math.round(n * 0.35)), keep = {};
      bad.filter(function (x) { return x.state === "down"; }).slice(0, nRed).forEach(function (x) { keep[x.id] = 1; });
      bad.filter(function (x) { return x.state === "degraded"; }).slice(0, n - Object.keys(keep).length).forEach(function (x) { keep[x.id] = 1; });
      stCache = { D: D, keep: keep };
    }
    return stCache.keep[l.id] ? l.state : "healthy";
  }
  window.LENS_STATE = lensState;

  // ---------- Status model: every entity (location, plan, DU, device) has exactly ONE status ----------
  //   Planning & deployment lifecycle: New -> In progress -> Success  (only these carry a sub-status)
  //   after a set period in Success the entity becomes Operational and is monitored as Operational / Warning / Failed.
  // Simple status glyphs registered into the design-system icon set: "!" for Warning.
  function regIcons() { var N = window.DesignSystem_0d72f4 && window.DesignSystem_0d72f4.LUCIDE_NODES; if (N && !N["status-warn"]) N["status-warn"] = '<path d="M12 4.5v10"/><path d="M12 19.5h.01"/>'; return !!N; }
  if (!regIcons()) { var _ri = setInterval(function () { if (regIcons()) clearInterval(_ri); }, 50); setTimeout(function () { clearInterval(_ri); }, 10000); }
  var STATUS = {
    new:         { key: "new",         label: "New",         phase: "plan", bg: "var(--w-blue-300)",   ink: "var(--w-blue-950)",   dot: "var(--w-blue-500)",   icon: "pen",           sev: 0 },
    inProgress:  { key: "inProgress",  label: "In progress", phase: "plan", bg: "var(--w-purple-200)", ink: "var(--w-purple-950)", dot: "var(--w-purple-500)", icon: "loader-circle", sev: 1 },
    success:     { key: "success",     label: "Success",     phase: "plan", bg: "var(--w-green-300)",  ink: "var(--w-green-950)",  dot: "var(--w-green-600)",  icon: "check",         sev: 0 },
    operational: { key: "operational", label: "Operational", phase: "ops",  bg: "var(--w-green-300)",  ink: "var(--w-green-950)",  dot: "var(--w-green-600)",  icon: "check",         sev: 0 },
    warning:     { key: "warning",     label: "Warning",     phase: "ops",  bg: "var(--w-yellow-300)", ink: "var(--w-yellow-950)", dot: "var(--w-yellow-500)", icon: "status-warn",   sev: 1 },
    failed:      { key: "failed",      label: "Failed",      phase: "ops",  bg: "var(--w-red-300)",    ink: "var(--w-red-950)",    dot: "var(--w-red-500)",    icon: "x",             sev: 2 },
  };
  var ORDER = ["new", "inProgress", "success", "operational", "warning", "failed"];
  var STAGES = ["new", "deploying", "deployError", "justDeployed", "operational"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(daysAgo) { var d = new Date(2026, 9, 14 - daysAgo); return d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear(); }
  function stageKey(stage, ops) { return stage === "new" ? "new" : (stage === "deploying" || stage === "deployError") ? "inProgress" : stage === "justDeployed" ? "success" : ({ healthy: "operational", degraded: "warning", down: "failed" }[ops] || "operational"); }
  function plans(l) { var h = 7; for (var i = 0; i < l.id.length; i++) h = (h * 31 + l.id.charCodeAt(i)) >>> 0; return (l.kind !== "store" || h % 3 === 0) ? 2 : 1; }
  function planOf(l, u) { return plans(l) > 1 ? Math.max(0, l.dus.indexOf(u)) % 2 : 0; }
  // Plan 0 follows the site; another plan can lag one lifecycle step behind (the mixed-stage edge case).
  function planStage(l, p) { var lc = lifecycle(l); if (!p) return lc.stage; var si = STAGES.indexOf(lc.stage), lag = hash(l.id + "p" + p) % 5 === 0 ? 1 : 0; return STAGES[Math.max(0, si - lag)]; }
  function subFor(stage, l, dus, salt) { var lc = lifecycle(l), n = Math.max(4, dus.length);
    if (stage === "new") return hash(l.id + "pl" + salt) % 2 ? "Planning needed" : "In planning";
    if (stage === "deploying" || stage === "deployError") { var x = Math.min(n - 1, Math.max(0, Math.round(n * lc.progress / 100))); return x + "/" + n + " deployed" + (stage === "deployError" ? " + failure" : ""); }
    if (stage === "justDeployed") return fmtDate(lc.stage === "justDeployed" ? lc.daysSince : 1 + hash(l.id + "sd" + salt) % 6);
    return ""; }
  function locStatus(l) { var lc = lifecycle(l), k = stageKey(lc.stage, lensState(l)); return { key: k, def: STATUS[k], fail: lc.stage === "deployError", sub: subFor(lc.stage, l, l.dus, "") }; }
  function planStatus(l, p) { var st = planStage(l, p), dus = l.dus.filter(function (u) { return planOf(l, u) === p; });
    var k = stageKey(st, lensState(l));
    if (STATUS[k].phase === "ops") k = dus.some(function (u) { return duBad(l, u); }) ? opsKey(l) : "operational";
    return { key: k, def: STATUS[k], fail: st === "deployError", sub: subFor(st, l, dus, p) }; }
  // Ops health is driven by devices: a Warning/Failed location (or plan, or DU) is one that has a failing device under it.
  function rawBad(d) { return !d.online || !!(d.codes && d.codes.length); }
  var badCache = {};
  // Failing share per site: mostly 5–16%, a few up to 25% (devices reporting codes first, then a deterministic fill).
  function badSet(l) { var k = l.id; if (badCache[k]) return badCache[k]; var set = {}, all = [];
    l.dus.forEach(function (u) { u.devices.forEach(function (d) { all.push(d); }); });
    var h = hash(l.id + "share") % 100, frac = h < 85 ? 0.05 + (h / 85) * 0.11 : 0.17 + ((h - 85) / 15) * 0.08;
    var n = Math.max(1, Math.min(all.length, Math.round(all.length * frac)));
    var ranked = all.slice().sort(function (a, b) { return (rawBad(b) ? 1 : 0) - (rawBad(a) ? 1 : 0) || hash(a.id + "pick") - hash(b.id + "pick"); });
    ranked.slice(0, n).forEach(function (d) { set[d.id] = 1; });
    return (badCache[k] = set); }
  function opsKey(l) { var o = lensState(l); return o === "down" ? "failed" : o === "degraded" ? "warning" : "operational"; }
  function devBad(l, d) { return opsKey(l) !== "operational" && !!badSet(l)[d.id]; }
  function duBad(l, u) { return u.devices.some(function (d) { return devBad(l, d); }); }
  function worst(keys, dflt) { var best = dflt; keys.forEach(function (k) { if (STATUS[k].phase === STATUS[best].phase && STATUS[k].sev > STATUS[best].sev) best = k; }); return best; }
  // In-progress plans with a deployment error: which DUs carry the failure (always at least one).
  var failCache = {};
  function failDus(l, p) { var key = l.id + ":" + p; if (failCache[key]) return failCache[key]; var lc = lifecycle(l), set = {}, ip = [];
    l.dus.forEach(function (u) { if (planOf(l, u) !== p) return; var h = hash(u.id + "dep") % 100; if (h >= lc.progress) { ip.push(u); if (h % 3 === 0) set[u.id] = 1; } });
    if (!Object.keys(set).length && ip.length) set[ip[0].id] = 1;
    return (failCache[key] = set); }
  function duStatus(l, u) { var st = planStage(l, planOf(l, u)), lc = lifecycle(l), h = hash(u.id + "dep") % 100;
    if (st === "new") return { key: "new", fail: false };
    if (st === "deploying" || st === "deployError") { if (h < lc.progress) return { key: "success", fail: false }; return { key: "inProgress", fail: st === "deployError" && !!failDus(l, planOf(l, u))[u.id] }; }
    if (st === "justDeployed") return { key: "success", fail: false };
    return { key: duBad(l, u) ? opsKey(l) : "operational", fail: false }; } // operational: a DU turns Warning/Failed only when one of its devices fails
  function devStatus(l, d, u) { var us = u ? duStatus(l, u) : locStatus(l);
    if (STATUS[us.key].phase === "plan") return { key: us.key, fail: us.fail && (!d.online || !!(d.codes && d.codes.length)) };
    return { key: devBad(l, d) ? opsKey(l) : "operational", fail: false }; }
  window.STATUS = { DEF: STATUS, ORDER: ORDER, loc: locStatus, plan: planStatus, du: duStatus, dev: devStatus, planStage: planStage, worst: worst,
    labels: function (phase) { return ORDER.filter(function (k) { return STATUS[k].phase === phase; }).map(function (k) { return STATUS[k].label; }); } };
  function lensTag(l) {
    var st = locStatus(l), D = STATUS[st.key], text = "", pct = "", fails = 0;
    if (st.key === "warning" || st.key === "failed") {
      var dt = 0, db = 0;
      l.dus.forEach(function (u) { u.devices.forEach(function (d) { dt++; if (devBad(l, d)) db++; }); });
      pct = Math.max(1, Math.round(db / Math.max(1, dt) * 100)) + "%"; fails = Math.max(1, db);
    }
    return { stage: lifecycle(l).stage, key: st.key, tone: st.key, bg: D.dot, ink: "#fff", icon: D.icon, text: text, pct: pct, fails: fails, dot: st.fail ? "var(--w-red-500)" : "", w: 20 };
  }
  // Which sites each lens shows.
  function lensIn(l, lens) {
    var st = lifecycle(l).stage;
    if (lens === "plan") return st === "new" || st === "deploying" || st === "deployError" || st === "justDeployed";
    if (lens === "health") return st === "operational";
    return true;
  }
  window.LENS_IN = lensIn;
  function lensDevColor(l, d) { var u = d.du || null; if (!u) { for (var i = 0; i < l.dus.length && !u; i++) if (l.dus[i].devices.indexOf(d) >= 0 || l.dus[i].devices.some(function (x) { return x.id === d.id; })) u = l.dus[i]; }
    return STATUS[devStatus(l, d, u).key].dot; }
  window.LENS_DEVCOLOR = lensDevColor;
  window.LENS_LIFECYCLE = lifecycle;
  window.LENS_TAG = lensTag;
  // Printers lenses. Yield: labels printed in the last 24h, w_purple 100 (least) → 700 (most). Operational: ok / warning / error per printer, worst per site.
  var PURPLE = [100, 200, 300, 400, 500, 600, 700];
  function prInfo(x) { var lab = parseInt(x.meta, 10) || 0, h = hash(x.id + "pst") % 100; return { labels: lab, st: h < 80 ? "operational" : h < 91 ? "warning" : "failed" }; }
  var prRank = null;
  function prSite(l) { var its = itemsFor("printers", l), tot = 0, worstK = "operational";
    its.forEach(function (x) { var i = prInfo(x); tot += i.labels; if (STATUS[i.st].sev > STATUS[worstK].sev) worstK = i.st; });
    return { total: tot, key: worstK, n: its.length }; }
  function prShade(v, lo, hi) { var k = hi > lo ? Math.max(0, Math.min(6, Math.floor((v - lo) / (hi - lo) * 7))) : 3; return PURPLE[k]; }
  function prRange() { var D = window.NETWORK_DATA; if (!D) return [0, 1]; if (prRank && prRank.D === D) return prRank.r;
    var v = D.locations.map(function (l) { return prSite(l).total; }); prRank = { D: D, r: [Math.min.apply(null, v), Math.max.apply(null, v)] }; return prRank.r; }
  function fmtN(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n); }
  function purpleTone(n) { return { bg: "var(--w-purple-" + n + ")", ink: n >= 500 ? "#fff" : "var(--w-purple-950)" }; }
  function printerTag(l, lens) { var s = prSite(l);
    if (lens === "ops") { var D = STATUS[s.key]; return { key: s.key, bg: D.dot, ink: "#fff", icon: D.icon, text: "", dot: "", w: 20 }; }
    var r = prRange(), t = purpleTone(prShade(s.total, r[0], r[1])), txt = fmtN(s.total);
    return { key: "yield", bg: t.bg, ink: t.ink, icon: "", text: txt, dot: "", w: Math.max(28, 12 + txt.length * 7.4) }; }
  // Per printer (inside a site): yield shade over the 120–420 labels/day range, or its status colour.
  function printerColor(x, lens) { var i = prInfo(x); if (lens === "ops") return STATUS[i.st].dot; return "var(--w-purple-" + prShade(i.labels, 120, 420) + ")"; }
  window.PRINTER_TAG = printerTag; window.PRINTER_COLOR = printerColor; window.PRINTER_INFO = prInfo;
  window.EXPLORE_METRICS = metrics;
  window.EXPLORE = { metrics: metrics,
    hash: hash, rng: rng, build: build, itemsFor: itemsFor, ZONES: ZONES, CATS: CATS, CONFIG: CONFIG,
    LOC_LABEL: LOC_LABEL, LOC_COLOR: LOC_COLOR, DEV_LABEL: DEV_LABEL, GW_MODELS: GW_MODELS, FW: FW,
  };
})();
