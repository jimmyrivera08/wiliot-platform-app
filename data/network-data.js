/* Wiliot Network Health — deterministic sample dataset.
   Window: last 6h = 24 buckets x 15min, "now" = 14:30. Sets window.NETWORK_DATA. */
(function () {
  var B = 24, START = 8 * 60 + 30;
  function hash(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var t = seed >>> 0; return function () { t += 0x6D2B79F5; var r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function fmtT(bucket) { var m = START + bucket * 15; var h = Math.floor(m / 60) % 24, mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; }
  function fmtDur(mins) { if (mins >= 360) return "6h+"; var h = Math.floor(mins / 60), m = mins % 60; return h ? h + "h" + (m ? " " + m + "m" : "") : m + "m"; }
  function on() { var a = []; for (var i = 0; i < B; i++) a.push(1); return a; }
  function offSince(k) { var a = []; for (var i = 0; i < B; i++) a.push(i >= k ? 0 : 1); return a; }
  function offRange(a0, a1) { var a = []; for (var i = 0; i < B; i++) a.push(i >= a0 && i <= a1 ? 0 : 1); return a; }
  function flap(from, period) { var a = []; for (var i = 0; i < B; i++) a.push(i < from ? 1 : (Math.floor((i - from) / period) % 2 === 0 ? 0 : 1)); return a; }
  function blip(k) { var a = on(); a[k] = 0; return a; }
  function hex4(r) { var s = ""; for (var i = 0; i < 4; i++) s += "0123456789ABCDEF"[Math.floor(r() * 16)]; return s; }

  var TYPES = {
    D: { type: "Dock door, Outbound", gw: 0, brMin: 2, brMax: 2 },
    C: { type: "Conveyor", gw: 0, brMin: 2, brMax: 2 },
    G: { type: "Wall array", gw: 0, brMin: 2, brMax: 2 },
    W: { type: "Work station", gw: 0, brMin: 2, brMax: 2 },
    O: { type: "Overhead array, 4 bridges", gw: 0, brMin: 4, brMax: 4 },
    Y: { type: "Gateway", gw: 1, brMin: 0, brMax: 0 },
  };
  var HERO_DUS = [
    ["Overhead — Outbound West", "O", 12.2, 6.4], ["Workstation — Pack East", "W", 77.1, 7.8],
    ["Gate — Repack", "G", 79.9, 16.7], ["Workstation — IDF 3", "W", 96.3, 17.3],
    ["Workstation — RME West", "W", 3.4, 32], ["Overhead — Finger C", "O", 61, 32.7],
    ["Conveyor A", "C", 12.2, 47.1],
    ["Gateway — IDF North", "Y", 48, 12],
    ["Conveyor B", "C", 32.7, 47.1], ["Gate — West Yard", "G", 1.6, 56],
    ["Gate — Staging South", "G", 32.7, 61.1], ["Gate — HR Hub", "G", 95.6, 46.4],
    ["Dock Door 01", "D", 6.8, 72.2], ["Dock Door 02", "D", 13.3, 72.2],
    ["Dock Door 03", "D", 19.3, 72.2], ["Dock Door 04", "D", 24.8, 72.2],
    ["Dock Door 05", "D", 63, 72.2], ["Dock Door 06", "D", 69.2, 72.2],
    ["Dock Door 07", "D", 75.2, 72.2], ["Dock Door 08", "D", 80.9, 72.2],
  ];
  var SLOT = {
    C: [[12.2, 47.1], [32.7, 47.1], [48, 47.1]],
    G: [[1.6, 56], [32.7, 61.1], [95.6, 46.4], [79.9, 16.7]],
    W: [[77.1, 7.8], [96.3, 17.3], [3.4, 32]],
    O: [[12.2, 6.4], [61, 32.7], [84.6, 28.9]],
    Y: [[48, 12], [92, 58]],
  };
  var GATE_NAMES = ["Gate — West Yard", "Gate — Staging South", "Gate — HR Hub", "Gate — Repack"];
  var WS_NAMES = ["Workstation — Pack East", "Workstation — IDF 3", "Workstation — RME West"];
  var OH_NAMES = ["Overhead — Outbound West", "Overhead — Finger C"];
  var GWDU_NAMES = ["Gateway — IDF North", "Gateway — IDF South"];

  /* name, city, country, cc, lat, lon, size(xs/s/m/l), story */
  var SPECS = [
["Winter Park", "Winter Park, FL", "United States", "US", 28.6, -81.34, "l", "down-morning", "store"],
    ["Sanford", "Sanford, FL", "United States", "US", 28.81, -81.27, "l", "minor", "dc"],
    ["Lake Nona", "Orlando, FL", "United States", "US", 28.38, -81.24, "m", "healthy", "dc"],
    ["Dr. Phillips", "Orlando, FL", "United States", "US", 28.45, -81.49, "l", "healthy", "store"],
    ["Kissimmee", "Kissimmee, FL", "United States", "US", 28.29, -81.41, "m", "minor", "store"],
    ["Altamonte Springs", "Altamonte Springs, FL", "United States", "US", 28.66, -81.36, "m", "healthy", "dc"],
    ["Ocoee", "Ocoee, FL", "United States", "US", 28.57, -81.53, "l", "hero", "dc"],
    ["Winter Garden", "Winter Garden, FL", "United States", "US", 28.57, -81.59, "m", "healthy", "dc"],
    ["Apopka", "Apopka, FL", "United States", "US", 28.68, -81.61, "s", "healthy", "dc"],
    ["Maitland", "Maitland, FL", "United States", "US", 28.63, -81.36, "m", "healthy", "store"],
    ["Casselberry", "Casselberry, FL", "United States", "US", 28.68, -81.32, "s", "healthy", "store"],
    ["Longwood", "Longwood, FL", "United States", "US", 28.7, -81.34, "m", "healthy", "dc"],
    ["Oviedo", "Oviedo, FL", "United States", "US", 28.67, -81.21, "l", "one-blip", "store"],
    ["Clermont", "Clermont, FL", "United States", "US", 28.55, -81.77, "m", "minor", "store"],
    ["Baldwin Park", "Orlando, FL", "United States", "US", 28.57, -81.35, "l", "minor", "dc"],
    ["College Park", "Orlando, FL", "United States", "US", 28.58, -81.39, "l", "degrading", "store"],
    ["Conway", "Orlando, FL", "United States", "US", 28.51, -81.33, "l", "minor", "dc"],
    ["Pine Hills", "Orlando, FL", "United States", "US", 28.57, -81.46, "m", "down-morning", "dc"],
    ["Windermere", "Windermere, FL", "United States", "US", 28.49, -81.53, "m", "healthy", "store"],
    ["Celebration", "Celebration, FL", "United States", "US", 28.32, -81.53, "s", "healthy", "store"],
    ["Lake Buena Vista", "Lake Buena Vista, FL", "United States", "US", 28.38, -81.51, "m", "healthy", "dc"],
    ["Union Park", "Orlando, FL", "United States", "US", 28.55, -81.24, "m", "minor", "store"],
    ["Belle Isle", "Belle Isle, FL", "United States", "US", 28.47, -81.34, "m", "healthy", "dc"],
    ["Edgewood", "Edgewood, FL", "United States", "US", 28.54, -81.36, "s", "healthy", "dc"],
    ["Metrowest", "Orlando, FL", "United States", "US", 28.52, -81.44, "m", "minor", "store"],
    ["Southchase", "Orlando, FL", "United States", "US", 28.38, -81.36, "s", "healthy", "dc"],
    ["Meadow Woods", "Orlando, FL", "United States", "US", 28.36, -81.33, "m", "healthy", "store"],
    ["Hunters Creek", "Orlando, FL", "United States", "US", 28.36, -81.44, "m", "one-blip", "dc"],
    ["Azalea Park", "Orlando, FL", "United States", "US", 28.55, -81.3, "s", "healthy", "dc"],
    ["Goldenrod", "Orlando, FL", "United States", "US", 28.58, -81.28, "m", "minor", "store"],
    ["Wekiva Springs", "Longwood, FL", "United States", "US", 28.71, -81.46, "s", "healthy", "store"],
    ["Sky Lake", "Orlando, FL", "United States", "US", 28.44, -81.38, "s", "minor", "dc"],
    ["Pine Castle", "Orlando, FL", "United States", "US", 28.46, -81.38, "s", "healthy", "dc"],
    ["Downtown Orlando", "Orlando, FL", "United States", "US", 28.54, -81.38, "l", "healthy", "dc"],
    ["Lakeland", "Lakeland, FL", "United States", "US", 28.04, -81.95, "l", "minor", "dc"],
    ["Tampa Westshore", "Tampa, FL", "United States", "US", 27.95, -82.52, "l", "degrading", "dc"],
    ["Brandon", "Brandon, FL", "United States", "US", 27.94, -82.29, "m", "minor", "store"],
    ["Plant City", "Plant City, FL", "United States", "US", 28.02, -82.12, "m", "healthy", "dc"],
    ["Winter Haven", "Winter Haven, FL", "United States", "US", 28.02, -81.73, "m", "one-blip", "store"],
    ["Davenport", "Davenport, FL", "United States", "US", 28.16, -81.6, "m", "minor", "dc"],
    ["Haines City", "Haines City, FL", "United States", "US", 28.11, -81.62, "s", "healthy", "store"],
    ["St. Cloud", "St. Cloud, FL", "United States", "US", 28.25, -81.28, "m", "flapping", "store"],
    ["Deltona", "Deltona, FL", "United States", "US", 28.9, -81.26, "m", "minor", "store"],
    ["DeLand", "DeLand, FL", "United States", "US", 29.03, -81.3, "s", "healthy", "store"],
    ["Daytona Beach", "Daytona Beach, FL", "United States", "US", 29.21, -81.02, "l", "just-broke", "dc"],
    ["Port Orange", "Port Orange, FL", "United States", "US", 29.14, -80.99, "m", "healthy", "store"],
    ["New Smyrna Beach", "New Smyrna Beach, FL", "United States", "US", 29.03, -80.93, "s", "minor", "store"],
    ["Titusville", "Titusville, FL", "United States", "US", 28.61, -80.81, "m", "healthy", "dc"],
    ["Cocoa", "Cocoa, FL", "United States", "US", 28.39, -80.74, "m", "recovered", "store"],
    ["Melbourne", "Melbourne, FL", "United States", "US", 28.08, -80.61, "l", "degrading", "dc"],
    ["Palm Bay", "Palm Bay, FL", "United States", "US", 28.03, -80.59, "m", "minor", "store"],
    ["Leesburg", "Leesburg, FL", "United States", "US", 28.81, -81.88, "m", "healthy", "dc"],
    ["The Villages", "The Villages, FL", "United States", "US", 28.93, -81.96, "m", "one-blip", "store"],
    ["Ocala", "Ocala, FL", "United States", "US", 29.19, -82.14, "l", "minor", "dc"],
    ["Mount Dora", "Mount Dora, FL", "United States", "US", 28.8, -81.64, "s", "healthy", "store"],
    ["Eustis", "Eustis, FL", "United States", "US", 28.85, -81.69, "s", "minor", "dc"],
    ["Poinciana", "Poinciana, FL", "United States", "US", 28.14, -81.46, "m", "down-morning", "store"],
    ["Groveland", "Groveland, FL", "United States", "US", 28.56, -81.85, "s", "healthy", "dc"],
    ["Lake Mary", "Lake Mary, FL", "United States", "US", 28.76, -81.32, "m", "minor", "dc"],
    ["Heathrow", "Heathrow, FL", "United States", "US", 28.78, -81.37, "s", "healthy", "store"],
    ["Wesley Chapel", "Wesley Chapel, FL", "United States", "US", 28.24, -82.33, "m", "minor", "store"],
    ["Brooksville", "Brooksville, FL", "United States", "US", 28.56, -82.39, "s", "recovered", "dc"],
    ["Sebastian","Sebastian, FL","United States","US",27.82,-80.47,"m","healthy","dc"],
    ["Vero Beach","Vero Beach, FL","United States","US",27.64,-80.4,"s","degrading","store"],
    ["Fort Pierce","Fort Pierce, FL","United States","US",27.45,-80.33,"m","flapping","store"],
    ["Port St. Lucie","Port St. Lucie, FL","United States","US",27.27,-80.35,"l","healthy","dc"],
    ["Stuart","Stuart, FL","United States","US",27.2,-80.25,"s","healthy","store"],
    ["Okeechobee","Okeechobee, FL","United States","US",27.24,-80.83,"m","minor","store"],
    ["Sebring","Sebring, FL","United States","US",27.5,-81.44,"m","minor","dc"],
    ["Avon Park","Avon Park, FL","United States","US",27.6,-81.5,"s","minor","store"],
    ["Lake Wales","Lake Wales, FL","United States","US",27.9,-81.59,"m","healthy","store"],
    ["Bartow","Bartow, FL","United States","US",27.9,-81.84,"l","healthy","dc"],
    ["Auburndale","Auburndale, FL","United States","US",28.07,-81.79,"s","recovered","store"],
    ["Mulberry","Mulberry, FL","United States","US",27.9,-81.97,"m","one-blip","store"],
    ["Riverview","Riverview, FL","United States","US",27.87,-82.33,"m","one-blip","dc"],
    ["Apollo Beach","Apollo Beach, FL","United States","US",27.77,-82.4,"s","healthy","store"],
    ["Ruskin","Ruskin, FL","United States","US",27.72,-82.43,"m","healthy","store"],
    ["Sun City Center","Sun City Center, FL","United States","US",27.72,-82.35,"l","minor","dc"],
    ["Temple Terrace","Temple Terrace, FL","United States","US",28.04,-82.39,"s","minor","store"],
    ["Carrollwood","Carrollwood, FL","United States","US",28.05,-82.49,"m","down-morning","store"],
    ["Tampa Ybor","Tampa Ybor, FL","United States","US",27.96,-82.44,"m","healthy","dc"],
    ["Town 'n' Country","Town 'n' Country, FL","United States","US",28.01,-82.58,"s","healthy","store"],
    ["Clearwater","Clearwater, FL","United States","US",27.97,-82.8,"m","healthy","store"],
    ["Largo","Largo, FL","United States","US",27.91,-82.79,"l","degrading","dc"],
    ["St. Petersburg","St. Petersburg, FL","United States","US",27.77,-82.64,"s","flapping","store"],
    ["Pinellas Park","Pinellas Park, FL","United States","US",27.84,-82.7,"m","healthy","store"],
    ["Dunedin","Dunedin, FL","United States","US",28.02,-82.77,"m","healthy","dc"],
    ["Palm Harbor","Palm Harbor, FL","United States","US",28.08,-82.76,"s","minor","store"],
    ["Tarpon Springs","Tarpon Springs, FL","United States","US",28.15,-82.76,"m","minor","store"],
    ["New Port Richey","New Port Richey, FL","United States","US",28.24,-82.72,"l","minor","dc"],
    ["Land O' Lakes","Land O' Lakes, FL","United States","US",28.22,-82.46,"s","healthy","store"],
    ["Zephyrhills","Zephyrhills, FL","United States","US",28.23,-82.18,"m","healthy","store"],
    ["Dade City","Dade City, FL","United States","US",28.36,-82.2,"m","recovered","dc"],
    ["Spring Hill","Spring Hill, FL","United States","US",28.48,-82.53,"s","one-blip","store"],
    ["Inverness","Inverness, FL","United States","US",28.84,-82.33,"m","one-blip","store"],
    ["Crystal River","Crystal River, FL","United States","US",28.9,-82.59,"l","healthy","dc"],
    ["Dunnellon","Dunnellon, FL","United States","US",29.05,-82.46,"s","healthy","store"],
    ["Belleview","Belleview, FL","United States","US",29.06,-82.06,"m","minor","store"],
    ["Silver Springs","Silver Springs, FL","United States","US",29.21,-82.06,"m","minor","dc"],
    ["Palatka","Palatka, FL","United States","US",29.65,-81.64,"s","down-morning","store"],
    ["Palm Coast","Palm Coast, FL","United States","US",29.58,-81.21,"m","healthy","store"],
    ["Flagler Beach","Flagler Beach, FL","United States","US",29.47,-81.13,"l","healthy","dc"],
    ["Ormond Beach","Ormond Beach, FL","United States","US",29.29,-81.06,"s","healthy","store"],
    ["Holly Hill","Holly Hill, FL","United States","US",29.24,-81.04,"m","degrading","store"],
    ["Orange City","Orange City, FL","United States","US",28.95,-81.3,"m","flapping","dc"],
    ["Debary","Debary, FL","United States","US",28.88,-81.31,"s","healthy","store"],
    ["Winter Springs","Winter Springs, FL","United States","US",28.7,-81.28,"m","healthy","store"],
    ["Chuluota","Chuluota, FL","United States","US",28.64,-81.12,"l","minor","dc"],
    ["Christmas","Christmas, FL","United States","US",28.54,-81.02,"s","minor","store"],
    ["Mims","Mims, FL","United States","US",28.67,-80.85,"m","minor","store"],
    ["Merritt Island","Merritt Island, FL","United States","US",28.36,-80.68,"m","healthy","dc"],
    ["Cocoa Beach","Cocoa Beach, FL","United States","US",28.32,-80.61,"s","healthy","store"],
    ["Viera","Viera, FL","United States","US",28.24,-80.73,"m","recovered","store"],
    ["Rockledge","Rockledge, FL","United States","US",28.33,-80.73,"l","one-blip","dc"],
    ["Satellite Beach","Satellite Beach, FL","United States","US",28.18,-80.59,"s","one-blip","store"],
    ["West Melbourne","West Melbourne, FL","United States","US",28.07,-80.65,"m","healthy","store"],
    ["Narcoossee","Narcoossee, FL","United States","US",28.33,-81.22,"m","healthy","dc"],
    ["Harmony","Harmony, FL","United States","US",28.19,-81.14,"s","minor","store"],
    ["Kenansville","Kenansville, FL","United States","US",27.88,-81,"m","minor","store"],
    ["Loughman","Loughman, FL","United States","US",28.24,-81.57,"l","down-morning","dc"],
    ["Minneola","Minneola, FL","United States","US",28.57,-81.75,"s","healthy","store"],
    ["Tavares","Tavares, FL","United States","US",28.8,-81.73,"m","healthy","store"],
    ["Umatilla","Umatilla, FL","United States","US",28.93,-81.66,"m","healthy","dc"],
    ["Sorrento","Sorrento, FL","United States","US",28.8,-81.56,"s","degrading","store"],
    ["Zellwood","Zellwood, FL","United States","US",28.73,-81.6,"m","flapping","store"],
    ["Gotha","Gotha, FL","United States","US",28.53,-81.52,"l","healthy","dc"],
    ["Horizon West","Horizon West, FL","United States","US",28.43,-81.6,"s","healthy","store"],
    ["Four Corners","Four Corners, FL","United States","US",28.33,-81.65,"m","minor","store"],
    ["Reunion","Reunion, FL","United States","US",28.26,-81.59,"m","minor","dc"],
    ["Taft","Taft, FL","United States","US",28.43,-81.36,"s","minor","store"],
    ["Williamsburg","Williamsburg, FL","United States","US",28.41,-81.44,"m","healthy","store"],
    ["Doctor Phillips East","Doctor Phillips East, FL","United States","US",28.46,-81.46,"l","healthy","dc"],
  ];

  function makeDU(name, letter, x, y, r, locId, j) {
    var t = TYPES[letter];
    var devs = [];
    for (var g = 0; g < t.gw; g++) devs.push({ kind: "gateway", name: "Gateway", sn: "GW-" + hex4(r), hist: on() });
    var nb = t.brMin + Math.floor(r() * (t.brMax - t.brMin + 1));
    for (var b = 0; b < nb; b++) devs.push({ kind: "bridge", name: "BR-" + hex4(r), hist: on() });
    devs.forEach(function (d, k) { d.id = locId + "-U" + j + "-D" + k; });
    var type = t.type;
    if (letter === "D") type = j % 2 ? "Dock door, Inbound" : "Dock door, Outbound";
    else if (letter === "O") type = j % 2 ? "Overhead array, V-shape" : "Overhead array, 4 bridges";
    return { id: locId + "-U" + j, name: name, letter: letter, type: type, x: x, y: y, devices: devs };
  }

  function buildDUs(spec, r, locId) {
    if (spec[7] === "hero") return HERO_DUS.map(function (h, j) { return makeDU(h[0], h[1], h[2], h[3], r, locId, j); });
    if (spec[7] === "small-bad") {
      return [makeDU("Dock Door 01", "D", 13.3, 72.2, r, locId, 0), makeDU("Gate — HR Hub", "G", 95.6, 46.4, r, locId, 1)];
    }
    var size = spec[6];
    var nD = size === "l" ? 10 + Math.floor(r() * 3) : size === "m" ? 7 + Math.floor(r() * 2) : 5;
    var nC = size === "l" ? 3 : size === "m" ? 2 + Math.floor(r() * 2) : 2;
    var nG = 2 + Math.floor(r() * (size === "l" ? 3 : 2));
    var nW = size === "s" ? 1 : 2 + Math.floor(r() * 2);
    var nO = size === "l" ? 2 : 1 + Math.floor(r() * 2);
    var dus = [], j = 0, i;
    for (i = 0; i < nD; i++) {
      var half = Math.ceil(nD / 2);
      var x = i < half ? 6.8 + i * 6.1 : 63 + (i - half) * 5.9;
      dus.push(makeDU("Dock Door " + (i < 9 ? "0" : "") + (i + 1), "D", x, 72.2, r, locId, j++));
    }
    for (i = 0; i < nC; i++) dus.push(makeDU("Conveyor " + "ABC"[i], "C", SLOT.C[i][0], SLOT.C[i][1], r, locId, j++));
    for (i = 0; i < nG; i++) dus.push(makeDU(GATE_NAMES[i], "G", SLOT.G[i][0], SLOT.G[i][1], r, locId, j++));
    for (i = 0; i < nW; i++) dus.push(makeDU(WS_NAMES[i], "W", SLOT.W[i][0], SLOT.W[i][1], r, locId, j++));
    for (i = 0; i < nO; i++) dus.push(makeDU(OH_NAMES[i], "O", SLOT.O[i][0], SLOT.O[i][1], r, locId, j++));
    var nY = size === "l" ? 2 : 1;
    for (i = 0; i < nY; i++) dus.push(makeDU(GWDU_NAMES[i], "Y", SLOT.Y[i][0], SLOT.Y[i][1], r, locId, j++));
    return dus;
  }

  function sprinkle(all, r, p) { all.forEach(function (d) { if (r() < p) d.hist = blip(2 + Math.floor(r() * 18)); }); }

  function applyStory(story, dus, r) {
    var all = []; dus.forEach(function (u) { u.devices.forEach(function (d) { all.push(d); }); });
    var bridges = all.filter(function (d) { return d.kind === "bridge"; });
    if (story === "healthy") sprinkle(all, r, 0.05);
    else if (story === "minor") {
      sprinkle(all, r, 0.04);
      var n = 1 + Math.floor(r() * 3);
      for (var i = 0; i < n && i < bridges.length; i++) bridges[Math.floor(r() * bridges.length)].hist = offSince(4 + Math.floor(r() * 14));
    } else if (story === "down-morning") {
      dus.forEach(function (u, di) {
        var roll = di % 3;
        if (roll === 0) {
          u.devices.forEach(function (d) { if (d.kind === "gateway" ? r() < 0.85 : r() < 0.6) d.hist = offSince(0); });
        } else if (roll === 1) {
          var brs = u.devices.filter(function (d) { return d.kind !== "gateway"; });
          if (u.devices.length >= 3 && brs.length) brs[0].hist = offSince(0);
          else u.devices.forEach(function (d) { if (r() < 0.3) d.hist = offSince(0); });
        } else {
          u.devices.forEach(function (d) { if (r() < 0.05) d.hist = offSince(2 + Math.floor(r() * 10)); });
        }
      });
    } else if (story === "just-broke") {
      all.forEach(function (d) { if (r() < 0.42) d.hist = offSince(22); });
      dus[0].devices.forEach(function (d) { d.hist = offSince(21); });
    } else if (story === "degrading") {
      for (var k = 0; k < 9 && k < bridges.length; k++) bridges[k * 3 % bridges.length].hist = offSince(5 + k * 2);
    } else if (story === "recovered") {
      all.forEach(function (d) { if (r() < 0.8) d.hist = offRange(3, 14); });
    } else if (story === "one-blip") {
      sprinkle(all, r, 0.02);
      bridges[Math.floor(r() * bridges.length)].hist = offSince(22);
    } else if (story === "small-bad") {
      dus[0].devices[0].hist = offSince(10);
      dus[0].devices[1].hist = offSince(10);
    } else if (story === "flapping") {
      sprinkle(all, r, 0.03);
      var tgt = dus.filter(function (u) { return u.letter === "C"; })[0] || dus[0];
      var bi = 0;
      tgt.devices.forEach(function (d) {
        if (d.kind === "gateway") d.hist = flap(7, 2);
        else if (bi === 0) { d.hist = offSince(11); bi++; }
        else if (bi < 3) { d.hist = flap(7, 2); bi++; }
      });
    } else if (story === "hero") {
      dus.forEach(function (u) {
        if (u.name === "Overhead — Finger C") {
          u.devices.forEach(function (d, k) {
            if (d.kind === "gateway") d.hist = flap(8, 2);
            else if (k === 1) d.hist = offSince(12);
            else if (k === 2) d.hist = flap(8, 2);
          });
        } else if (u.name === "Dock Door 07") u.devices[1].hist = offSince(21);
        else if (u.name === "Conveyor B") u.devices[1].hist = blip(17);
      });
    }
  }

  function transitions(arr) { var c = 0; for (var i = 1; i < arr.length; i++) if (arr[i] !== arr[i - 1]) c++; return c; }
  function sinceInfo(states) {
    var last = states[B - 1], i = B - 1;
    while (i > 0 && states[i - 1] === last) i--;
    var buckets = B - i;
    return { buckets: buckets, label: i === 0 ? "6h+" : fmtDur(buckets * 15), time: i === 0 ? null : fmtT(i) };
  }
  function duState(off, total, gwOff, gwTotal) {
    if (off === 0) return "healthy";
    if (off / total >= 0.5 || (gwTotal > 0 && gwOff === gwTotal)) return "down";
    return "degraded";
  }

  function deriveDU(du) {
    var t = du.devices.length, states = [], i;
    var gws = du.devices.filter(function (d) { return d.kind === "gateway"; });
    for (i = 0; i < B; i++) {
      var off = 0, gwOff = 0;
      du.devices.forEach(function (d) { if (!d.hist[i]) { off++; if (d.kind === "gateway") gwOff++; } });
      states.push(duState(off, t, gwOff, gws.length));
    }
    du.buckets = states; du.state = states[B - 1];
    du.total = t;
    du.offline = du.devices.filter(function (d) { return !d.hist[B - 1]; }).length;
    du.pct = t ? du.offline / t * 100 : 0;
    du.changes = transitions(states);
    du.flapping = du.changes >= 5;
    du.since = sinceInfo(states);
    du.gw = gws.length; du.br = t - gws.length;
    var ev = null;
    du.devices.forEach(function (d) {
      d.online = !!d.hist[B - 1];
      d.offBuckets = d.hist.filter(function (v) { return !v; }).length;
      d.changes = transitions(d.hist);
      d.flapping = d.changes >= 5;
      var li = -1; for (i = 1; i < B; i++) if (d.hist[i] !== d.hist[i - 1]) li = i;
      if (li >= 0 && (!ev || li > ev.i)) ev = { i: li, name: d.name, on: !!d.hist[li] };
      if (d.online) d.lastSeen = "just now";
      else { var lo = -1; for (i = 0; i < B; i++) if (d.hist[i]) lo = i; d.lastSeen = lo < 0 ? "before 08:30" : fmtT(lo + 1); }
      d.sinceLabel = sinceInfo(d.hist.map(function (v) { return v ? "u" : "d"; })).label;
    });
    du.lastEvent = ev ? ev.name + (ev.on ? " recovered" : " went offline") + " · " + fmtT(ev.i) : "No events in the last 6h";
  }

  function deriveLoc(loc) {
    var states = [], i;
    var devTotal = 0;
    loc.dus.forEach(function (u) { devTotal += u.devices.length; });
    for (i = 0; i < B; i++) {
      var off = 0, duDown = 0;
      loc.dus.forEach(function (u) {
        u.devices.forEach(function (d) { if (!d.hist[i]) off++; });
        if (u.buckets[i] === "down") duDown++;
      });
      var frac = devTotal ? off / devTotal : 0;
      states.push(frac >= 0.3 || duDown / loc.dus.length >= 0.5 ? "down" : off > 0 ? "degraded" : "healthy");
      loc._fracs = loc._fracs || []; loc._fracs.push(frac);
    }
    loc.buckets = states; loc.state = states[B - 1];
    loc.total = devTotal;
    loc.offline = 0;
    loc.dus.forEach(function (u) { loc.offline += u.offline; });
    loc.pct = devTotal ? loc.offline / devTotal * 100 : 0;
    loc.changes = transitions(states);
    loc.flapping = loc.changes >= 5 || loc.dus.some(function (u) { return u.flapping; });
    loc.since = sinceInfo(states);
    loc.duCounts = { healthy: 0, degraded: 0, down: 0 };
    loc.dus.forEach(function (u) { loc.duCounts[u.state]++; });
  }

  function buildAccount(SPECS, ACCT, HERO, PFX) {
  var locations = SPECS.map(function (spec, idx) {
    var r = rng(hash(spec[0]));
    var id = PFX + idx;
    var dus = buildDUs(spec, r, id);
    applyStory(spec[7], dus, r);
    dus.forEach(deriveDU);
    // Guarantee unhealthy locations show a red+yellow DU mix
    var anyBad = dus.some(function (u) { return u.state !== "healthy"; });
    if (anyBad) {
      var totDev = 0, offDev = 0;
      dus.forEach(function (u) { u.devices.forEach(function (d) { totDev++; if (!d.hist[d.hist.length - 1]) offDev++; }); });
      var budget = Math.floor(totDev * 0.26) - offDev; // keep loc.pct under the 30% critical threshold
      var wantEach = dus.length >= 8 ? 2 : 1;
      var nDeg = dus.filter(function (u) { return u.state === "degraded"; }).length;
      var nDown = dus.filter(function (u) { return u.state === "down"; }).length;
      var pool = dus.filter(function (u) { return u.state === "healthy"; })
        .sort(function (a, b) { return a.devices.length - b.devices.length; });
      var hp = 0;
      var alreadyDown = totDev && offDev / totDev >= 0.3; // already critical — a degraded DU can't worsen it
      while (nDeg < wantEach && hp < pool.length && (budget >= 1 || alreadyDown)) {
        var h = pool[hp++];
        if (h.devices.length < 3) continue; // 1 device off must stay under the 50% down threshold
        var br = h.devices.filter(function (d) { return d.kind !== "gateway"; })[0];
        if (!br) continue;
        var keep = br.hist;
        br.hist = offSince(6 + nDeg * 4); deriveDU(h);
        if (h.state === "degraded") { nDeg++; budget--; }
        else { br.hist = keep; deriveDU(h); }
      }
      while (nDown < wantEach && hp < pool.length) {
        var h2 = pool[hp++];
        var gws = h2.devices.filter(function (d) { return d.kind === "gateway"; });
        if (!gws.length || gws.length > budget) continue;
        gws.forEach(function (d) { d.hist = offSince(3); });
        deriveDU(h2); if (h2.state === "down") { nDown++; budget -= gws.length; }
      }
    }
    var loc = {
      id: id, name: spec[0], city: spec[1], country: spec[2], cc: spec[3],
      lat: spec[4], lon: spec[5], story: spec[7], kind: spec[8] || "dc", dus: dus,
    };
    deriveLoc(loc);
    return loc;
  });

  var acct = { name: ACCT, buckets: [], fracs: [], locCounts: { healthy: 0, degraded: 0, down: 0 } };
  var devTotal = 0, devOff = 0, i;
  locations.forEach(function (l) { devTotal += l.total; devOff += l.offline; acct.locCounts[l.state]++; });
  for (i = 0; i < B; i++) {
    var off = 0;
    locations.forEach(function (l) { l.dus.forEach(function (u) { u.devices.forEach(function (d) { if (!d.hist[i]) off++; }); }); });
    var frac = off / devTotal;
    acct.fracs.push(frac);
    acct.buckets.push(frac >= 0.05 ? "down" : frac > 0.004 ? "degraded" : "healthy");
  }
  acct.total = devTotal; acct.offline = devOff;
  acct.online = devTotal - devOff;
  acct.pctOnline = 100 - devOff / devTotal * 100;
  acct.state = acct.buckets[B - 1];
  acct.since = sinceInfo(acct.buckets);

  var CODES = {
    "0x4a": { sev: 2, kind: "bridge", name: "Connectivity", rule: "Operational-time ratio for the window, reconstructed from the pre-window state plus in-window transitions, below 0.95.", fix: "Check the bridge power source is stable. Check connectivity of nearby gateways to see if the issue is isolated to this bridge. If gateways filter data and management packets, verify their Allowed Lists include this bridge." },
    "0x6e": { sev: 2, kind: "bridge", name: "No data packets from online bridge", rule: "Operational for the entire window (ratio = 1.0) with zero packets recorded.", fix: "Check the datapath: RX channel, pattern, packet filter. Verify there are tags within range and nearby bridges are energizing them. Check for an ACL issue." },
    "0x7a": { sev: 2, kind: "bridge", name: "Bridge–gateway link too weak", rule: "Median heartbeat RSSI in the window below −60.", fix: "Add or reposition a bridge or gateway closer to the affected area." },
    "0x0b": { sev: 2, kind: "bridge", name: "Power failure (severe)", rule: "More than 4 reboots in the 24h window without memory overload.", fix: "Check the power source: verify the adapter's voltage and current match the device spec; check for loose or unstable physical connections." },
    "0x2a": { sev: 2, kind: "bridge", name: "Physical tampering", rule: "Tampering signature detected in the window.", fix: "Check the installation: correct orientation, rotation and tilt, and no physical objects blocking or obstructing the device." },
    "0x6c": { sev: 2, kind: "gateway", name: "Gateway online, paired bridge offline", rule: "Gateway online with ≥1 paired bridge offline whose last heartbeat reports uplink RSSI = −1.", fix: "Verify the bridge datapath: RX channel, pattern, packet filter." },
    "0x0a": { sev: 1, kind: "bridge", name: "Power failure (non-optimal)", rule: "More than 4 reboots in the 24h window.", fix: "Check the power source: verify the adapter's voltage and current match the device spec; check for loose or unstable physical connections." },
    "0x1a": { sev: 1, kind: "bridge", name: "High interference", rule: "Max bridge interference in the window above 0.9.", fix: "No remediation defined." },
    "0x1b": { sev: 1, kind: "bridge", name: "Channel blocked by interference (severe)", rule: "Max interference in the window above 0.98.", fix: "From FW 4.6, compare the wlt_bad_crc and non_wlt_bad_crc counters to identify the source. Wiliot interference: switch RX to CH10, then CH21 if it persists; try reducing the Sub-1 GHz duty cycle. Non-Wiliot: switch RX to CH10, then CH21; use a BLE sniffer to find the interfering device." },
    "0x3a": { sev: 1, kind: "bridge", name: "Overload — rate", rule: "Spread of effective_pacer_increment across in-window heartbeats reaches 60 or more.", fix: "Increase the pacer interval, or configure rssiThreshold in the datapath." },
    "0x3b": { sev: 1, kind: "bridge", name: "Overload — memory", rule: "Max connected_tags_count above the ceiling for the board type and firmware version.", fix: "Configure rssiThreshold in the datapath." },
    "0x5a": { sev: 1, kind: "both", name: "Compliance", rule: "compliance_status is not \"compliant\". Single pass/fail.", fix: "Fix to compliance." },
    "0x6b": { sev: 1, kind: "both", name: "Not attached to blueprint", rule: "template_id missing or empty.", fix: "No remediation defined." },
    "0x6d": { sev: 1, kind: "bridge", name: "Old bootloader", rule: "bootloader_version below the minimum for the board type — 50 for ERMV2, 18 otherwise.", fix: "No remediation defined." },
    "0x6a": { sev: 1, kind: "gateway", name: "Gateway not uploading", rule: "Zero heartbeats produced in the window.", fix: "Check RX channel and packet filter config. Check connectivity of nearby bridges to see if it is isolated. Check for an ACL issue." },
    "0x8a": { sev: 1, kind: "gateway", name: "GNSS low quality", rule: "p95 GNSS positional error in the window ≥ 20.0.", fix: "Replace the device." },
    "0x8b": { sev: 1, kind: "gateway", name: "GNSS low sampling rate", rule: "p95 GNSS timestamp error in the window ≥ 30.0s.", fix: "Replace the device." },
  };
  function enrich(loc) {
    loc.dus.forEach(function (u) {
      u.devices.forEach(function (d) {
        var r = rng(hash(d.id + "x"));
        var codes = [];
        var ratio = 1 - d.offBuckets / B;
        if (d.kind === "bridge") {
          if (ratio < 0.95) codes.push("0x4a");
          if (d.flapping) codes.push(d.changes >= 7 ? "0x0b" : "0x0a");
          if (d.offBuckets === 0) {
            if (r() < 0.05) codes.push("0x6e");
            if (r() < 0.04) codes.push("0x7a");
            if (r() < 0.06) codes.push("0x1a");
            if (r() < 0.03) codes.push("0x1b");
            if (r() < 0.03) codes.push("0x5a");
            if (r() < 0.05) codes.push("0x6d");
            if (r() < 0.03) codes.push("0x3a");
            if (r() < 0.02) codes.push("0x2a");
            if (r() < 0.03) codes.push("0x3b");
            if (r() < 0.03) codes.push("0x6b");
          } else if (r() < 0.3) codes.push("0x7a");
        } else {
          if (!d.online) codes.push("0x6a");
          else if (loc.offline > 0 && r() < 0.5) codes.push("0x6c");
          if (r() < 0.12) codes.push("0x8a");
          if (r() < 0.06) codes.push("0x8b");
          if (r() < 0.08) codes.push("0x6b");
          if (r() < 0.06) codes.push("0x5a");
        }
        codes = codes.filter(function (c) { var k = CODES[c] && CODES[c].kind; return !k || k === "both" || (k === "gateway") === (d.kind === "gateway"); });
        if (loc.state === "healthy") codes = [];
        d.codes = codes;
        d.missingInputs = loc.state !== "healthy" && r() < 0.015 ? ["0x3b (board tag ceiling not reported)", "0x1b (interference counters unavailable)"] : null;
        d.health = codes.some(function (c) { return CODES[c].sev === 2; }) ? 2 : (codes.length || d.missingInputs) ? 1 : 0;
        var conn = d.offBuckets === 0 ? "Operational" : d.offBuckets >= B ? "Offline" : d.flapping ? "Partial (flapping)" : "Partial";
        if (d.missingInputs && d.offBuckets === 0) conn = "Unknown";
        var dep = loc.name + " · " + u.name;
        var labels = (u.letter === "D" ? "dock, " : u.letter === "C" ? "conveyor, " : "") + (d.kind === "gateway" ? "gateway" : "bridge");
        if (d.kind === "bridge") {
          var weak = codes.indexOf("0x7a") >= 0;
          var upl = -(weak ? 62 + Math.floor(r() * 9) : 38 + Math.floor(r() * 16));
          var dnl = upl - 2 - Math.floor(r() * 5);
          d.mx = [
            ["Window connectivity", conn],
            ["Bridge type", r() < 0.55 ? "ERMV2" : "Fanstel BWG840"],
            ["RSSI to gateway", "\u2191 " + upl + " / \u2193 " + dnl + " dBm"],
            ["Gateways connected", codes.indexOf("0x4a") >= 0 ? "1 of 2" : "2 of 2"],
            ["Tilt", codes.indexOf("0x2a") >= 0 ? "Misaligned" : "Aligned"],
            ["Orientation", codes.indexOf("0x2a") >= 0 && r() < 0.5 ? "Misaligned" : "Aligned"],
            ["Internal voltage", (3.05 + r() * 0.45).toFixed(2) + " V"],
            ["Labels", labels],
          ];
        } else {
          var cell = ["High", "Medium", "Low"][Math.floor(r() * 3)];
          d.mx = [
            ["Cell signal", cell + (cell === "High" ? " (> −60 dBm)" : cell === "Medium" ? " (−80 to −60 dBm)" : " (< −80 dBm)")],
            ["GNSS", "Low (indoor)"],
            ["External power", (11.6 + r() * 1.1).toFixed(1) + " V"],
            ["Internal power", r() < 0.6 ? "12V" : r() < 0.5 ? "24V" : "USB"],
            ["Bridges connected", (codes.indexOf("0x6c") >= 0 ? "6 of 8" : "8 of 8") + " · ACL 8"],
            ["Tilt", "Aligned"],
            ["Orientation", "Aligned"],
            ["Firmware", "4.4.12 → 4.6.0"],
            ["Device type", "Cellular gateway"],
            ["Device ID", d.sn || d.id],
            ["Labels", labels],
          ];
        }
      });
      if (u.state === "healthy") {
        u.devices.forEach(function (d) { d.codes = []; d.missingInputs = null; d.health = 0; });
      }
    });
  }
  locations.forEach(enrich);
  (function () {
    var ocoee = locations.filter(function (l) { return l.name === HERO; })[0];
    if (!ocoee) return;
    var fc = ocoee.dus.filter(function (u) { return u.name === "Overhead — Finger C"; })[0];
    if (!fc) return;
    if (fc.devices[1]) { fc.devices[1].codes = ["0x4a", "0x0b", "0x7a", "0x1b"]; fc.devices[1].health = 2; }
    if (fc.devices[2]) { var d2 = fc.devices[2]; d2.missingInputs = ["0x3b (board tag ceiling not reported)", "0x1b (interference counters unavailable)"]; if (d2.health === 0) d2.health = 1; if (d2.offBuckets === 0) d2.mx[0][1] = "Unknown"; }
  })();

  var locById = {}, duById = {};
  locations.forEach(function (l) { locById[l.id] = l; l.dus.forEach(function (u) { duById[u.id] = u; u.loc = l; }); });

  return {
    account: acct, locations: locations, locById: locById, duById: duById, codes: CODES,
    fmtT: fmtT, fmtDur: fmtDur, nowLabel: "14:30", startLabel: "08:30", buckets: B,
  };
  }

  /* Other accounts: name, city, lat, lon, size, kind — stories assigned from a cycle */
  var STORY_CYCLE = ["healthy", "minor", "healthy", "one-blip", "healthy", "minor", "degrading", "healthy", "recovered", "minor", "healthy", "down-morning", "healthy", "flapping", "minor", "healthy", "just-broke"];
  function expand(rows, hero) {
    return rows.map(function (r, i) { var st = r[0] === hero ? "hero" : STORY_CYCLE[i % STORY_CYCLE.length]; return [r[0], r[1], "United States", "US", r[2], r[3], r[4], st, r[5]]; });
  }
  var GECKO = expand([
    ["Dallas Design District", "Dallas, TX", 32.8, -96.82, "l", "dc"], ["Irving", "Irving, TX", 32.81, -96.95, "l", "dc"], ["Plano Legacy", "Plano, TX", 33.08, -96.82, "m", "store"],
    ["Frisco", "Frisco, TX", 33.15, -96.82, "m", "store"], ["Arlington", "Arlington, TX", 32.74, -97.11, "l", "dc"], ["Fort Worth Alliance", "Fort Worth, TX", 32.98, -97.32, "l", "dc"],
    ["Grand Prairie", "Grand Prairie, TX", 32.75, -97.0, "m", "dc"], ["Garland", "Garland, TX", 32.91, -96.64, "m", "store"], ["Mesquite", "Mesquite, TX", 32.77, -96.6, "s", "store"],
    ["Richardson", "Richardson, TX", 32.95, -96.73, "m", "store"], ["McKinney", "McKinney, TX", 33.2, -96.62, "m", "store"], ["Denton", "Denton, TX", 33.21, -97.13, "m", "dc"],
    ["Lewisville", "Lewisville, TX", 33.05, -97.0, "s", "store"], ["Carrollton", "Carrollton, TX", 32.98, -96.89, "m", "dc"], ["Grapevine", "Grapevine, TX", 32.93, -97.08, "s", "store"],
    ["Waco", "Waco, TX", 31.55, -97.15, "m", "dc"], ["Temple", "Temple, TX", 31.1, -97.34, "s", "store"], ["Round Rock", "Round Rock, TX", 30.51, -97.68, "l", "dc"],
    ["Austin Mueller", "Austin, TX", 30.3, -97.7, "m", "store"], ["Austin South Congress", "Austin, TX", 30.24, -97.75, "s", "store"], ["Pflugerville", "Pflugerville, TX", 30.44, -97.62, "m", "dc"],
    ["San Marcos", "San Marcos, TX", 29.88, -97.94, "m", "dc"], ["New Braunfels", "New Braunfels, TX", 29.7, -98.12, "s", "store"], ["San Antonio Northside", "San Antonio, TX", 29.55, -98.5, "l", "dc"],
    ["San Antonio Southtown", "San Antonio, TX", 29.4, -98.49, "m", "store"], ["Schertz", "Schertz, TX", 29.55, -98.27, "m", "dc"], ["Houston Westchase", "Houston, TX", 29.73, -95.56, "l", "dc"],
    ["Houston Heights", "Houston, TX", 29.79, -95.4, "m", "store"], ["Katy", "Katy, TX", 29.79, -95.82, "l", "dc"], ["Sugar Land", "Sugar Land, TX", 29.6, -95.62, "m", "store"],
    ["Pearland", "Pearland, TX", 29.56, -95.29, "m", "store"], ["Pasadena", "Pasadena, TX", 29.69, -95.21, "m", "dc"], ["The Woodlands", "The Woodlands, TX", 30.17, -95.46, "m", "store"],
    ["Conroe", "Conroe, TX", 30.31, -95.46, "s", "dc"], ["Baytown", "Baytown, TX", 29.74, -94.98, "m", "dc"], ["Cypress", "Cypress, TX", 29.97, -95.69, "s", "store"],
    ["Bryan", "Bryan, TX", 30.67, -96.37, "s", "store"], ["Killeen", "Killeen, TX", 31.12, -97.73, "m", "store"],
  ], "Fort Worth Alliance");
  var WESTLOOP = expand([
    ["Chicago West Loop", "Chicago, IL", 41.88, -87.65, "l", "dc"], ["Chicago Pilsen", "Chicago, IL", 41.86, -87.66, "m", "dc"], ["Elk Grove Village", "Elk Grove Village, IL", 42.0, -87.97, "l", "dc"],
    ["Bensenville", "Bensenville, IL", 41.96, -87.94, "l", "dc"], ["Bedford Park", "Bedford Park, IL", 41.77, -87.8, "l", "dc"], ["Cicero", "Cicero, IL", 41.85, -87.75, "m", "dc"],
    ["Joliet", "Joliet, IL", 41.53, -88.08, "l", "dc"], ["Romeoville", "Romeoville, IL", 41.65, -88.09, "l", "dc"], ["Aurora", "Aurora, IL", 41.76, -88.32, "m", "dc"],
    ["Naperville", "Naperville, IL", 41.75, -88.15, "m", "store"], ["Schaumburg", "Schaumburg, IL", 42.03, -88.08, "m", "store"], ["Elgin", "Elgin, IL", 42.04, -88.28, "m", "dc"],
    ["Waukegan", "Waukegan, IL", 42.36, -87.84, "s", "dc"], ["Kenosha", "Kenosha, WI", 42.58, -87.82, "l", "dc"], ["Racine", "Racine, WI", 42.73, -87.78, "m", "dc"],
    ["Milwaukee Menomonee Valley", "Milwaukee, WI", 43.03, -87.94, "l", "dc"], ["Oak Creek", "Oak Creek, WI", 42.88, -87.86, "m", "dc"], ["Rockford", "Rockford, IL", 42.27, -89.09, "m", "dc"],
    ["Gary", "Gary, IN", 41.6, -87.35, "m", "dc"], ["Hammond", "Hammond, IN", 41.6, -87.5, "s", "dc"], ["Merrillville", "Merrillville, IN", 41.48, -87.33, "m", "store"],
    ["Valparaiso", "Valparaiso, IN", 41.47, -87.06, "s", "store"], ["South Bend", "South Bend, IN", 41.68, -86.25, "m", "dc"], ["Kankakee", "Kankakee, IL", 41.12, -87.86, "m", "dc"],
    ["Bolingbrook", "Bolingbrook, IL", 41.7, -88.07, "l", "dc"], ["Minooka", "Minooka, IL", 41.45, -88.26, "l", "dc"], ["Elwood", "Elwood, IL", 41.4, -88.11, "l", "dc"],
    ["University Park", "University Park, IL", 41.44, -87.68, "m", "dc"], ["Peoria", "Peoria, IL", 40.69, -89.59, "m", "dc"], ["Bloomington", "Bloomington, IL", 40.48, -88.99, "s", "store"],
  ], "Elk Grove Village");

  var ACCOUNTS = [
    { name: "Acme Inc.", specs: SPECS, hero: "Ocoee", pfx: "L" },
    { name: "Gecko Dynamics", specs: GECKO, hero: "Fort Worth Alliance", pfx: "G" },
    { name: "Westloop Logistics", specs: WESTLOOP, hero: "Elk Grove Village", pfx: "W" },
  ];
  var built = {};
  window.NETWORK_SET = function (i) {
    var a = ACCOUNTS[i] || ACCOUNTS[0];
    if (!built[i]) { built[i] = buildAccount(a.specs, a.name, a.hero, a.pfx); built[i].acctIndex = i; }
    window.NETWORK_DATA = built[i];
    return built[i];
  };
  var saved = 0; try { saved = +(localStorage.getItem("wl-acct") || 0) || 0; } catch (e) {}
  window.NETWORK_SET(saved);
})();
