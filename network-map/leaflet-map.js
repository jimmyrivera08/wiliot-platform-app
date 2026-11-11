(function () {
  var lastView = null;
  window.__nmResetView = function () { lastView = null; window.__nmBaseZoom = null; window.__nmPre = null; };
  function ensureCss() {
    if (document.getElementById("nm-style")) return;
    var s = document.createElement("style");
    s.id = "nm-style";
    s.textContent =
"" +
      ".nm-map .leaflet-control-attribution{font:10px/1.5 var(--font-sans,sans-serif);color:var(--muted-foreground);background:var(--background);opacity:.85;padding:1px 6px;margin-right:52px;border-radius:4px 0 0 0;}" +
      ".nm-map .leaflet-control-attribution a{color:var(--muted-foreground);}" +
      ".nm-pin{transition:scale 120ms ease;transform-origin:center;}" +
      ".nm-map{transition:background-color 240ms ease;}" +
      ".nm-lbl{pointer-events:none;}" +
      ".nm-lbl span{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font:500 10px/1 var(--font-sans,sans-serif);letter-spacing:.14em;text-transform:uppercase;transition:opacity 240ms ease;}" +
      ".nm-map[data-lbl=off] .nm-lbl span{opacity:0;}";
    document.head.appendChild(s);
  }
  var LU = {"status-warn":"<path d=\"M12 4.5v10\"/><path d=\"M12 19.5h.01\"/>","x":"<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>","pen":"<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"/>","check-check":"<path d=\"M18 6 7 17l-5-5\"/><path d=\"m22 10-7.5 7.5L13 16\"/>","pencil":"<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"/><path d=\"m15 5 4 4\"/>","store":"<path d=\"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5\"/><path d=\"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244\"/><path d=\"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05\"/>","warehouse":"<path d=\"M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11\"/><path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z\"/><path d=\"M6 13h12\"/><path d=\"M6 17h12\"/>","printer":"<path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\"/><path d=\"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6\"/><rect x=\"6\" y=\"14\" width=\"12\" height=\"8\" rx=\"1\"/>","router":"<rect width=\"20\" height=\"8\" x=\"2\" y=\"14\" rx=\"2\"/><path d=\"M6.01 18H6\"/><path d=\"M10.01 18H10\"/><path d=\"M15 10v4\"/><path d=\"M17.84 7.17a4 4 0 0 0-5.66 0\"/><path d=\"M20.66 4.34a8 8 0 0 0-11.31 0\"/>","radio":"<path d=\"M16.247 7.761a6 6 0 0 1 0 8.478\"/><path d=\"M19.075 4.933a10 10 0 0 1 0 14.134\"/><path d=\"M4.925 19.067a10 10 0 0 1 0-14.134\"/><path d=\"M7.753 16.239a6 6 0 0 1 0-8.478\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/>","tag":"<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\"/>","thermometer":"<path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\"/>","package":"<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\"/><path d=\"M12 22V12\"/><polyline points=\"3.29 7 12 12 20.71 7\"/><path d=\"m7.5 4.27 9 5.15\"/>"};
  function lu(n, s) { s = s || 12; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">' + (LU[n] || "") + '</svg>'; }
  var STORE_SVG = lu("store"), DC_SVG = lu("warehouse");
  function hsh(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  window.NM_METRICS = function (l) {
    var h = hsh(l.id), gw = 0, br = 0;
    l.dus.forEach(function (u) { u.devices.forEach(function (d) { if (d.kind === "gateway") gw++; else br++; }); });
    var n = l.dus.length;
    return { gateways: gw, bridges: br, devices: gw + br, printers: 1 + (h % 4), printersDown: ((h >> 3) % 6 === 0) ? 1 : 0, pixels: n * 900 + (h % 4000), temp: 2 + ((h >> 5) % 95) / 10, assets: n * 40 + ((h >> 7) % 300) };
  };
  function fmtK(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n); }
  var PRINTER_SVG = lu("printer");
  var SH = "0 1px 4px rgba(15,29,42,0.28), 0 0 1px rgba(15,29,42,0.18)";
  var TONES = { neutral: ["var(--card)", "var(--foreground)"], healthy: ["var(--ns-tag-success-bg)", "var(--ns-tag-success-fg)"], degraded: ["var(--ns-tag-warning-bg)", "var(--ns-tag-warning-fg)"], down: ["var(--ns-tag-danger-bg)", "var(--ns-tag-danger-fg)"], brand: ["var(--ns-tag-brand-bg)", "var(--ns-tag-brand-fg)"], info: ["var(--ns-tag-info-bg)", "var(--ns-tag-info-fg)"], muted: ["var(--surface-muted)", "var(--foreground)"], proper: ["var(--ns-tag-brand-bg)", "var(--ns-tag-brand-fg)"], elevated: ["var(--ns-tag-warning-bg)", "var(--ns-tag-warning-fg)"], high: ["var(--ns-tag-high-bg)", "var(--ns-tag-high-fg)"], excursion: ["var(--ns-tag-danger-bg)", "var(--ns-tag-danger-fg)"] };
  function tempTone(t) { return t > 10 ? "down" : t > 8 ? "degraded" : "healthy"; }
  window.NM_DEV_SPLIT = function (l) { var S = window.STATUS, o = { g: 0, y: 0, r: 0 }; if (!S) return o;
    l.dus.forEach(function (u) { u.devices.forEach(function (d) { var st = S.dev(l, d, u); if (st.fail || st.key === "failed") o.r++; else if (st.key === "warning") o.y++; else o.g++; }); }); return o; };
  function layerPin(l, layer, mode, chip, cOv) {
    var M = (window.EXPLORE_METRICS || window.NM_METRICS)(l);
    var tag = function (txt, tone, icon, dot) {
      var tn = TONES[tone] || TONES.neutral;
      var inner = icon ? lu(icon, 12) : '<span>' + txt + '</span>';
      if (dot) inner += '<span style="position:absolute;right:-3px;bottom:-3px;width:8px;height:8px;border-radius:999px;background:' + dot + '"></span>';
      return { w: 0, html: '<div class="nm-pin" style="position:relative;display:inline-flex;align-items:center;justify-content:center;height:20px;min-width:20px;box-sizing:border-box;padding:0 ' + (icon ? "0" : "6px") + ';border-radius:4px;background:' + tn[0] + ';color:' + tn[1] + ';font:500 12px/1 var(--font-data,monospace);font-variant-numeric:tabular-nums;letter-spacing:0;white-space:nowrap;box-shadow:var(--ns-pin-shadow, var(--shadow-2));cursor:pointer;transform:translateX(-50%)">' + inner + '</div>' };
    };
    if (layer === "devices") { if (l.state === "healthy") return tag("", "healthy", "check"); var dt = 0, db = 0; l.dus.forEach(function (u) { u.devices.forEach(function (d) { dt++; if (!d.online || (d.codes && d.codes.length)) db++; }); }); return tag(Math.max(1, Math.round(db / Math.max(1, dt) * 100)) + "%", l.state); }
    if (layer === "devpie" && window.STATUS) {
      // Per site: share of devices that are operational / warning / failed, as a small pie.
      var sp = window.NM_DEV_SPLIT(l), tot = Math.max(1, sp.g + sp.y + sp.r), Dd = window.STATUS.DEF, C = 2 * Math.PI * 4.5, off = 0, segs = "";
      [[sp.g, Dd.operational.dot], [sp.y, Dd.warning.dot], [sp.r, Dd.failed.dot]].forEach(function (x) { if (!x[0]) return; var len = x[0] / tot * C;
        segs += '<circle cx="11" cy="11" r="4.5" fill="none" stroke="' + x[1] + '" stroke-width="9" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 11 11)"/>'; off += len; });
      return { w: 22, h: 22, html: '<svg class="nm-pin" width="22" height="22" viewBox="0 0 22 22" style="display:block;overflow:visible;cursor:pointer;filter:drop-shadow(0 1px 2px rgba(15,29,42,.3))"><circle cx="11" cy="11" r="10" fill="#fff"/>' + segs + '</svg>' };
    }
    if (layer === "devmap") {
      // Every device as a dot, coloured by the lens status family, inside a subtle near-rectangular site footprint.
      var hs = hsh(l.id), rr = function () { hs = (Math.imul(hs, 1664525) + 1013904223) >>> 0; return hs / 4294967296; };
      var all = []; l.dus.forEach(function (u) { u.devices.forEach(function (d) { all.push(d); }); });
      var n = Math.max(1, all.length), gap = 4.6, pad = 4, cols = Math.max(3, Math.ceil(Math.sqrt(n * 1.5))), rows = Math.ceil(n / cols);
      var W = Math.round(cols * gap + pad * 2), H = Math.round(rows * gap + pad * 2), j = function (v) { return (v + (rr() - 0.5) * 2.4).toFixed(1); };
      var poly = [j(0.5) + "," + j(0.5), j(W - 0.5) + "," + j(0.5), j(W - 0.5) + "," + j(H - 0.5), j(0.5) + "," + j(H - 0.5)].join(" ");
      var col = window.LENS_DEVCOLOR || function () { return "var(--w-blue-500)"; }, dots = "";
      all.forEach(function (d, i) { var cx = pad + gap * (i % cols) + gap / 2 + (rr() - 0.5) * 1.2, cy = pad + gap * Math.floor(i / cols) + gap / 2 + (rr() - 0.5) * 1.2;
        dots += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="1.6" fill="' + col(l, d) + '"/>'; });
      return { w: W, h: H, html: '<svg class="nm-pin" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;overflow:visible;cursor:pointer"><polygon points="' + poly + '" fill="color-mix(in srgb, var(--background) 55%, transparent)" stroke="var(--w-slate-300)" stroke-width="0.75" stroke-linejoin="round"/>' + dots + '</svg>' };
    }
    var prL = layer.indexOf("printers-") === 0 && window.PRINTER_TAG;
    if (((layer === "health" || layer === "plan-life") && window.LENS_TAG) || prL) {
      var t = prL ? window.PRINTER_TAG(l, layer.slice(9)) : window.LENS_TAG(l), N = (window.DesignSystem_0d72f4 && window.DesignSystem_0d72f4.LUCIDE_NODES) || {};
      var ic = !t.icon ? "" : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">' + (N[t.icon] || LU[t.icon] || "") + '</svg>';
      return { w: 0, html: '<div class="nm-pin" style="position:relative;display:inline-flex;align-items:center;justify-content:center;gap:2px;height:20px;width:' + t.w + 'px;box-sizing:border-box;padding:0;border-radius:999px;background:' + t.bg + ';color:' + t.ink + ';font:400 12px/1 var(--font-data,monospace);font-variant-numeric:tabular-nums;white-space:nowrap;box-shadow:var(--ns-pin-shadow, var(--shadow-2));cursor:pointer;transform:translateX(-50%)">' + ic + (t.text ? '<span style="display:block;line-height:1;transform:translateY(-0.8px)">' + t.text + '</span>' : '') + (t.dot ? '<span style="position:absolute;right:-3px;bottom:-3px;width:8px;height:8px;border-radius:999px;background:' + t.dot + '"></span>' : '') + '</div>' };
    }
    if (layer === "printers") return tag(String(M.printers), "neutral");
    if (layer === "sensors") return tag(M.temp.toFixed(1) + "°", M.tempBand || "proper");
    if (layer === "assets") return tag(fmtK(M.assets), "info");
    if (layer === "pixels") return tag(fmtK(M.pixels), "brand");
    return tag("", "neutral", l.kind === "store" ? "store" : "warehouse", COLORS[l.state]);
  }
  function mkIcon(l, layer, mode, chip, cOv) {
    var p = layerPin(l, layer, mode, chip, cOv);
    if (!p.w) return L.divIcon({ className: "", html: p.html, iconSize: [0, 22], iconAnchor: [0, 11] });
    var ph = p.h || p.w;
    return L.divIcon({ className: "", html: p.html, iconSize: [p.w, ph], iconAnchor: [p.w / 2, ph / 2] });
  }
  var COLORS = { healthy: "var(--w-green-600,#06B36C)", degraded: "var(--w-yellow-500,#FFCC14)", down: "var(--w-red-500,#FF3337)" };

  var GLYPH = {
    healthy: '<svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    degraded: '<svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M12 5v9M12 18.5v.5" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>',
    down: '<svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>',
  };
  var CHIPS = {
    "Slate 100": { bg: "var(--w-slate-100,#F1F5F9)", txt: "var(--foreground,#1E2D3B)", bd: "1px solid var(--border,#E2E9F0)" },
    "Slate 200": { bg: "var(--w-slate-200,#E2E9F0)", txt: "var(--foreground,#1E2D3B)", bd: "none" },
    "Slate 300": { bg: "var(--w-slate-300,#CBD6E1)", txt: "var(--foreground,#1E2D3B)", bd: "none" },
    "Dark slate": { bg: "var(--primary,#0F1D2A)", txt: "#FFFFFF", bd: "none" },
    "White": { bg: "#FFFFFF", txt: "var(--foreground,#1E2D3B)", bd: "1px solid var(--border,#E2E9F0)" },
  };
  function pinHtml(l, mode, chipName, cOv) {
    var size = 22, c = cOv || COLORS[l.state], glyph = l.kind === "store" ? STORE_SVG : DC_SVG;
    var ch = CHIPS[chipName] || CHIPS["Slate 200"];
    var chipBg = ch.bg, chipTxt = ch.txt, border = ch.bd;
    var ring = "0 1px 4px rgba(15,29,42,0.28), 0 0 1px rgba(15,29,42,0.18)", badge = "";
    var badgeTxt = l.state === "degraded" ? "var(--w-yellow-950,#613510)" : "#fff";
    var dot = '<span style="position:absolute;right:-2px;bottom:-2px;width:9px;height:9px;border-radius:999px;background:' + c + ';box-shadow:0 1px 3px rgba(15,29,42,0.3)"></span>';
    if (mode === "Outline chip + dot") { chipBg = "#fff"; border = "1px solid var(--border,#E2E9F0)"; chipTxt = "var(--muted-foreground,#637587)"; badge = dot; }
    else if (mode === "Bare glyph + dot") { chipBg = "#fff"; chipTxt = "var(--muted-foreground,#637587)"; badge = dot; }
    else if (mode === "Chip + status glyph") { badge = '<span style="position:absolute;right:-3px;bottom:-3px;width:12px;height:12px;border-radius:999px;background:' + c + ';color:' + badgeTxt + ';display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(15,29,42,0.3)">' + GLYPH[l.state] + '</span>'; }
    else if (mode === "Chip + status ring") { ring = "0 0 0 2px " + c + ", 0 1px 4px rgba(15,29,42,0.28)"; }
    else if (mode === "Chip + status bar") { badge = '<span style="position:absolute;left:3px;right:3px;bottom:-3px;height:3px;border-radius:2px;background:' + c + ';box-shadow:0 1px 3px rgba(15,29,42,0.3)"></span>'; }
    else badge = dot;
    return '<div class="nm-pin" style="position:relative;width:' + size + 'px;height:' + size + 'px;cursor:pointer">' +
      '<span style="position:absolute;inset:0;border-radius:7px;background:' + chipBg + ';border:' + border + ';color:' + chipTxt + ';display:flex;align-items:center;justify-content:center;box-shadow:' + ring + '">' + glyph + '</span>' + badge + '</div>';
  }

  // ---- Offline vector basemap (window.WL_BASEMAP from data/basemap.js) ----
  // External tile servers are blocked where this runs, so the map draws its own land, coastlines and borders.
  var MAPS = { "Auto (match theme)": { auto: true }, "Light": { mode: "light" }, "Dark": { mode: "dark" } };
  function styleName(n) { if (n && MAPS[n]) return n; if (n && /dark|night|matter/i.test(n)) return "Dark"; if (n && n !== "Light grey") return "Light"; return "Auto (match theme)"; }
  function cssv(n, fb) { try { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; } catch (e) { return fb; } }
  function palette(mode) {
    if (mode === "dark") return { water: cssv("--w-natural-1000", "#0A0A0A"), world: "#121212", land: cssv("--w-natural-950", "#171717"), county: cssv("--w-natural-900", "#262626"), state: cssv("--w-natural-800", "#404040"), coast: cssv("--w-natural-700", "#525252"), label: cssv("--w-natural-600", "#666666") };
    return { water: "#E2E9F0", world: "#EEF2F6", land: "#FFFFFF", county: "#E6ECF2", state: "#CBD6E1", coast: "#ABBCCC", label: "#8191A1" };
  }
  var GEO = null;
  function geo() {
    if (GEO) return GEO;
    var B = window.WL_BASEMAP, T = window.WL_TOPO || window.topojson;
    if (!B || !T) return null;
    var stF = T.feature(B.us, B.us.objects.states);
    GEO = {
      world: T.feature(B.world, B.world.objects.countries),
      borders: T.mesh(B.world, B.world.objects.countries, function (x, y) { return x !== y; }),
      nation: T.feature(B.us, B.us.objects.nation),
      counties: T.mesh(B.us, B.us.objects.counties, function (x, y) { return x !== y && ((x.id / 1000) | 0) === ((y.id / 1000) | 0); }),
      states: T.mesh(B.us, B.us.objects.states, function (x, y) { return x !== y; }),
      labels: stF.features.map(function (f) { return { name: f.properties.name, at: centroid(f.geometry) }; }).filter(function (l) { return l.at; }),
    };
    return GEO;
  }
  // Area-weighted centroid of the largest polygon (keeps labels on land, e.g. Florida's peninsula).
  function centroid(g) {
    var polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    var best = null, bestA = 0;
    polys.forEach(function (pl) {
      var r = pl[0], A = 0, cx = 0, cy = 0;
      for (var i = 0, j = r.length - 1; i < r.length; j = i++) { var f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; A += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f; }
      if (Math.abs(A) > bestA) { bestA = Math.abs(A); best = [cy / (3 * A), cx / (3 * A)]; }
    });
    return best;
  }
  function drawBasemap(self, mode) {
    var map = self._map, P = palette(mode), G = geo();
    (self._base || []).forEach(function (l) { map.removeLayer(l); });
    self._base = [];
    self._box.style.background = P.water;
    self._box.setAttribute("data-basemap", mode);
    if (!G) { clearTimeout(self._baseT); self._baseT = setTimeout(function () { if (!self._dead && self._map) drawBasemap(self, mode); }, 150); return; }
    if (!map.getPane("nmBase")) { map.createPane("nmBase").style.zIndex = 200; map.createPane("nmLabels").style.zIndex = 450; map.getPane("nmLabels").style.pointerEvents = "none"; }
    var R = self._baseR || (self._baseR = L.canvas({ pane: "nmBase", padding: 0.6 }));
    var add = function (data, st) { var l = L.geoJSON(data, Object.assign({ pane: "nmBase", renderer: R, interactive: false }, { style: function () { return st; } })).addTo(map); self._base.push(l); };
    add(G.world, { stroke: false, fill: true, fillColor: P.world, fillOpacity: 1 });
    add(G.borders, { color: P.state, weight: 0.8, opacity: 0.8, fill: false });
    add(G.nation, { stroke: false, fill: true, fillColor: P.land, fillOpacity: 1 });
    add(G.counties, { color: P.county, weight: 0.7, opacity: 1, fill: false });
    add(G.states, { color: P.state, weight: 1.1, opacity: 1, fill: false });
    add(G.nation, { color: P.coast, weight: 1, opacity: 0.9, fill: false });
    var lbl = L.layerGroup(G.labels.map(function (l) {
      return L.marker(l.at, { pane: "nmLabels", interactive: false, keyboard: false, icon: L.divIcon({ className: "nm-lbl", iconSize: [0, 0], html: '<span style="color:' + P.label + '">' + l.name + "</span>" }) });
    })).addTo(map);
    self._base.push(lbl);
    var zl = function () { self._box.setAttribute("data-lbl", map.getZoom() <= 8.5 ? "on" : "off"); };
    if (!self._zlOn) { self._zlOn = true; map.on("zoomend", zl); }
    zl();
  }

  class NetworkMap extends HTMLElement {
    static get observedAttributes() { return ["layer", "theme", "mapbox-token", "status-filter", "hover-id", "icon-mode", "map-style", "colors", "hidden-ids", "statusfilter", "hoverid", "iconmode", "mapstyle", "hiddenids"]; }
    set hiddenIds(v) { this._setHidden(v); }
    _setHidden(v) { this._hidden = {}; String(v || "").split(",").filter(Boolean).forEach((k) => { this._hidden[k] = 1; }); this._applyHidden(); }
    _applyHidden() {
      var self = this, map = this._map; if (!this._markers || !map) return;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      Object.keys(this._markers).forEach(function (k) {
        var mk = self._markers[k], hide = !!(self._hidden || {})[k];
        if (hide && map.hasLayer(mk) && !mk._leaving) {
          var el = mk.getElement() && mk.getElement().firstChild;
          if (!el || reduce || !self._animOk) { map.removeLayer(mk); return; }
          mk._leaving = true;
          var an = el.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6 }], { duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
          an.onfinish = function () { mk._leaving = false; if ((self._hidden || {})[k]) map.removeLayer(mk); an.cancel(); };
        } else if (!hide && (!map.hasLayer(mk) || mk._leaving)) {
          mk._leaving = false;
          if (!map.hasLayer(mk)) mk.addTo(map);
          var el2 = mk.getElement() && mk.getElement().firstChild;
          if (el2 && !reduce && self._animOk) { el2.getAnimations().forEach(function (a) { a.cancel(); }); el2.animate([{ opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1 }], { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" }); }
        }
      });
    }
    set colors(v) { this._setColors(v); }
    _setColors(v) { try { this._colors = v ? (typeof v === "string" ? JSON.parse(v) : v) : {}; } catch (e) { this._colors = {}; } this._reicon(); }
    set statusFilter(v) { this._filter = v || ""; this._refresh(); }
    set hoverId(v) { this._setHover(v || ""); }
    set iconMode(v) { this._mode = v || "Filled chip + dot"; this._reicon(); }
    set chipTone(v) { this._chip = v || "Slate 200"; this._reicon(); }
    set mapStyle(v) { this._setBasemap(v); }
    attributeChangedCallback(n, o, v) {
      if (o === v) return;
      n = { statusfilter: "status-filter", hoverid: "hover-id", iconmode: "icon-mode", mapstyle: "map-style", hiddenids: "hidden-ids" }[n] || n;
      if (n === "layer") { this._layer = v || "locations"; this._reicon(); }
      else if (n === "status-filter") { this._filter = v || ""; this._refresh(); }
      else if (n === "icon-mode") { this._mode = v || "Filled chip + dot"; this._reicon(); }
      else if (n === "map-style") { this._setBasemap(v); }
      else if (n === "theme" || n === "mapbox-token") { this._setBasemap(this._style); }
      else if (n === "colors") { this._setColors(v); }
      else if (n === "hidden-ids") { this._setHidden(v); }
      else this._setHover(v || "");
    }
    _setBasemap(name) {
      this._style = styleName(name);
      var mode = MAPS[this._style].mode || ((this.getAttribute("theme") || document.documentElement.getAttribute("data-ns-theme")) === "dark" ? "dark" : "light");
      if (!this._map) return;
      drawBasemap(this, mode);
    }
    _reicon() {
      var self2 = this, ms = this._markers, mode = this._mode, locById = window.NETWORK_DATA && window.NETWORK_DATA.locById;
      if (!ms || !locById) return;
      Object.keys(ms).forEach(function (k) {
        var l = locById[k];
        if (!l) return;
        ms[k].setIcon(mkIcon(l, self2._layer, mode, self2._chip, (self2._colors || {})[k]));
      });
      this._hover = "";
      this._refresh();
    }
    connectedCallback() {
      if (this._inited) return;
      this._inited = true;
      ensureCss();
      this.style.cssText += ";display:block;position:absolute;inset:0;";
      this._box = document.createElement("div");
      this._box.className = "nm-map";
      this._box.style.cssText = "position:absolute;inset:0;background:var(--w-slate-100,#F1F5F9);";
      this.appendChild(this._box);
      this._markers = {}; var selfS0 = this;
      this._filter = this.getAttribute("status-filter") || this.getAttribute("statusfilter") || this._filter || "";
      if (!this._hidden) { this._hidden = {}; String(this.getAttribute("hidden-ids") || this.getAttribute("hiddenids") || "").split(",").filter(Boolean).forEach(function (k) { selfS0._hidden[k] = 1; }); }
      try { this._colors = this._colors || JSON.parse(this.getAttribute("colors") || "{}"); } catch (e) { this._colors = {}; }
      var selfS = this;
      this._styleFn = function (e) {
        if (!e.detail) return;
        selfS._mode = e.detail.mode || selfS._mode;
        selfS._chip = e.detail.chip || selfS._chip;
        if (e.detail.map && e.detail.map !== selfS._style) selfS._setBasemap(e.detail.map);
        selfS._reicon();
      };
      window.addEventListener("nm-icon-style", this._styleFn);
      window.dispatchEvent(new CustomEvent("nm-icon-style-request"));
      this._mode = this.getAttribute("icon-mode") || this.getAttribute("iconmode") || this._mode || "Filled chip + dot";
      this._chip = this._chip || "Slate 200";
      this._layer = this.getAttribute("layer") || this._layer || "locations";
      this._style = styleName(this.getAttribute("map-style") || this.getAttribute("mapstyle") || this._style);

      this._dead = false;
      this._boot();
    }
    _boot() {
      var self = this;
      if (this._dead) return;
      if (!window.L || !window.NETWORK_DATA) { setTimeout(function () { self._boot(); }, 80); return; }
      // Google-Maps-style zoom: wheel notch / +,- / buttons = exactly one level (animated, snapped to whole levels);
      // trackpad pinch and two-finger scroll = continuous, centred on the pointer.
      var map = L.map(this._box, { zoomControl: false, attributionControl: false, zoomSnap: 0, zoomDelta: 1, scrollWheelZoom: false, keyboard: false });
      this._map = map;
      var stepTarget = function (dir) { var z = map.getZoom(); return dir > 0 ? Math.floor(z + 1e-3) + 1 : Math.ceil(z - 1e-3) - 1; };
      var clampZ = function (z) { return Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), z)); };
      this._stepZoom = function (dir, pt) { var t = clampZ(stepTarget(dir)); if (pt) map.setZoomAround(pt, t, { animate: true }); else map.setZoom(t, { animate: true }); };
      var lastNotch = 0;
      this._wheelFn = function (e) {
        e.preventDefault();
        var pt = map.mouseEventToContainerPoint(e), dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        var notch = !e.ctrlKey && (e.deltaMode === 1 || (Math.abs(dy) >= 50 && Math.abs(e.deltaX) < 1 && Math.abs(dy - Math.round(dy)) < 0.01));
        if (notch) { var now = Date.now(); if (now - lastNotch < 180) return; lastNotch = now; self._stepZoom(dy < 0 ? 1 : -1, pt); return; }
        var dz = -dy * (e.ctrlKey ? 0.0145 : 0.0075);
        map.setZoomAround(pt, clampZ(map.getZoom() + dz), { animate: false });
      };
      this._box.addEventListener("wheel", this._wheelFn, { passive: false });
      this._panFn = function (e) { map.panBy([e.detail.dx, e.detail.dy], { animate: true, duration: 0.2 }); };
      window.addEventListener("nm-pan", this._panFn);
      this._setBasemap(this._style);
      var locs = window.NETWORK_DATA.locations;
      var fitAll = function () { map.fitBounds(L.latLngBounds(locs.map(function (l) { return [l.lat, l.lon]; })), { padding: [56, 56] }); };
      // A board can mount while its box is still 0×0 (canvas thumbnails, hidden tabs); fitting then
      // picks a nonsense zoom. Defer the first fit until the box has a real size.
      var boxOk = function () { return self._box.clientWidth > 80 && self._box.clientHeight > 80; };
      this._needFit = !boxOk();
      if (lastView && !this._needFit) map.setView(lastView.center, lastView.zoom);
      else if (this._needFit) map.setView([39, -96], 4);
      else map.fitBounds(L.latLngBounds(locs.map(function (l) { return [l.lat, l.lon]; })), { padding: [56, 56] });
      if (window.__nmBaseZoom == null && !this._needFit) window.__nmBaseZoom = map.getZoom();
      var emitZ = function () { var z = map.getZoom(); if (!isFinite(z)) return; if (window.__nmBaseZoom == null || !isFinite(window.__nmBaseZoom)) window.__nmBaseZoom = z; var zMin = window.__nmBaseZoom + Math.log2(0.05); if (map.getMinZoom() !== zMin) map.setMinZoom(zMin); /* never zoom out past 5% */ window.dispatchEvent(new CustomEvent("nm-zoomed", { detail: Math.round(Math.pow(2, z - window.__nmBaseZoom) * 100) })); };
      map.on("zoomend", emitZ); setTimeout(emitZ, 0);
      map.on("moveend", function () { lastView = { center: map.getCenter(), zoom: map.getZoom() }; });
      // Reports how far a pan moved (px) so a host page can react to it.
      var moveFrom = null;
      map.on("movestart", function () { moveFrom = map.getCenter(); });
      map.on("moveend", function () { if (!moveFrom) return; var a = map.latLngToContainerPoint(moveFrom), s = map.getSize(); var d = Math.round(Math.hypot(a.x - s.x / 2, a.y - s.y / 2)); moveFrom = null; window.dispatchEvent(new CustomEvent("nm-moved", { detail: d })); });
      locs.forEach(function (l) {
        var size = 22;
        var html = pinHtml(l, self._mode, self._chip, (self._colors || {})[l.id]);
        var m = L.marker([l.lat, l.lon], {
          icon: mkIcon(l, self._layer, self._mode, self._chip, (self._colors || {})[l.id]),
          riseOnHover: true,
          zIndexOffset: l.state === "down" ? 2000 : l.state === "degraded" ? 1000 : 0,
        }).addTo(map);
        m._state = l.state;
        m._z = l.state === "down" ? 2000 : l.state === "degraded" ? 1000 : 0;
        m.on("click", function () { window.dispatchEvent(new CustomEvent("nm-select", { detail: l.id })); });
        m.on("mouseover", function () { var r = self._box.getBoundingClientRect(), p = map.latLngToContainerPoint(m.getLatLng()); window.dispatchEvent(new CustomEvent("nm-hover", { detail: { id: l.id, x: r.left + p.x, y: r.top + p.y } })); });
        m.on("mouseout", function () { window.dispatchEvent(new CustomEvent("nm-hover", { detail: null })); });
        self._markers[l.id] = m;
      });
      this._ro = new ResizeObserver(function () {
        if (!self._map) return;
        self._map.invalidateSize();
        if (self._needFit && boxOk()) { self._needFit = false; lastView = null; fitAll(); window.__nmBaseZoom = map.getZoom(); emitZ(); }
      });
      this._ro.observe(this._box);
      this._zoomFn = function (e) { if (e.detail === 0) { var ms = Object.keys(self._markers).map(function (k) { return self._markers[k]; }); if (ms.length) map.fitBounds(L.featureGroup(ms).getBounds().pad(0.1)); } else self._stepZoom(e.detail > 0 ? 1 : -1); };
      setTimeout(function () { self._animOk = true; }, 600);
      var lerp = function (a, b, t) { return L.latLng(a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t); };
      this._drillFn = function (e) {
        var l = window.NETWORK_DATA.locById[e.detail && e.detail.id]; if (!l) return;
        window.__nmPre = { center: map.getCenter(), zoom: map.getZoom() };
        var tgt = L.latLng(l.lat, l.lon);
        // soft zoom toward the chosen site — "going into" it
        var z = map.getZoom();
        map.flyTo(lerp(map.getCenter(), tgt, 0.35), Math.min(15, z + 0.6), { duration: 0.28, easeLinearity: 0.5 });
      };
      this._undrillFn = function () {
        var pre = window.__nmPre; if (!pre) return;
        map.flyTo(pre.center, pre.zoom, { duration: 0.24, easeLinearity: 0.5 });
        window.__nmPre = null;
      };
      window.addEventListener("nm-drill", this._drillFn);
      window.addEventListener("nm-undrill", this._undrillFn);
      var autoT = null;
      map.on("movestart zoomstart", function () { clearTimeout(autoT); });
      map.on("moveend zoomend", function () {
        clearTimeout(autoT);
        if (map.getZoom() < 14) return;
        var b = map.getBounds(), inView = Object.keys(self._markers).filter(function (k) { return map.hasLayer(self._markers[k]) && b.contains(self._markers[k].getLatLng()); });
        if (inView.length === 1) autoT = setTimeout(function () { window.dispatchEvent(new CustomEvent("nm-select", { detail: inView[0] })); }, 1500);
      });
      window.addEventListener("nm-zoom", this._zoomFn);
      this._refresh();
    }
    _refresh() {
      var f = this._filter, ms = this._markers;
      if (!ms) return;
      Object.keys(ms).forEach(function (k) { ms[k].setOpacity(f && ms[k]._state !== f ? 0.3 : 1); });
      this._applyHidden();
    }
    _setHover(id) {
      if (id === this._hover) return;
      var ms = this._markers || {};
      if (this._hover && ms[this._hover]) {
        var e0 = ms[this._hover].getElement();
        if (e0 && e0.firstChild) { e0.firstChild.style.scale = ""; e0.firstChild.style.boxShadow = e0.firstChild.hasAttribute("data-shadow") ? e0.firstChild.getAttribute("data-shadow") : ""; }
        ms[this._hover].setZIndexOffset(ms[this._hover]._z || 0);
      }
      this._hover = id;
      if (id && ms[id]) {
        var m = ms[id], e1 = m.getElement();
        if (e1 && e1.firstChild) {
          if (!e1.firstChild.hasAttribute("data-shadow")) e1.firstChild.setAttribute("data-shadow", e1.firstChild.style.boxShadow);
          e1.firstChild.style.scale = "1.15";
          e1.firstChild.style.boxShadow = "0 0 0 2px var(--background, #fff), 0 0 0 3.5px var(--foreground, #0F1D2A), 0 4px 10px rgba(15,29,42,0.35)"; e1.firstChild.style.transition = "scale 160ms cubic-bezier(.2,0,0,1), box-shadow 160ms";
        }
        m.setZIndexOffset(5000);

      }
    }
    disconnectedCallback() {
      this._dead = true;
      window.removeEventListener("nm-zoom", this._zoomFn);
      if (this._panFn) window.removeEventListener("nm-pan", this._panFn);
      if (this._wheelFn && this._box) this._box.removeEventListener("wheel", this._wheelFn);
      window.removeEventListener("nm-drill", this._drillFn);
      window.removeEventListener("nm-undrill", this._undrillFn);
      if (this._styleFn) window.removeEventListener("nm-icon-style", this._styleFn);
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      if (this._map) { this._map.remove(); this._map = null; }
      if (this._box) { this._box.remove(); this._box = null; }
      this._markers = null;
      this._inited = false;
    }
  }
  if (!customElements.get("network-map")) customElements.define("network-map", NetworkMap);
})();
