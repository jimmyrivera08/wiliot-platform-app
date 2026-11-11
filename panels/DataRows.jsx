/* Bundled from the Wiliot DS components/panels (DataRow, DataRowList, vizParts) — the DS bundle copy here predates them. */
const { Icon } = window.DesignSystem_0d72f4;
/* ---- vizParts.jsx ---- */
// Internal viz parts + helpers for DataRow / DataRowList. Lowercase exports stay off the DS namespace.



const rowListCtx = React.createContext(null);

function scaleRatio(v, max, scale = "linear") {
  if (!max || !(v > 0)) return 0;
  let r;
  if (scale === "sqrt") r = Math.sqrt(v) / Math.sqrt(max);
  else if (scale === "log") r = Math.log10(v + 1) / Math.log10(max + 1);
  else r = v / max;
  return Math.max(0, Math.min(1, r));
}
function autoShade(r) {
  return r >= 0.66 ? "var(--w-purple-500)" : r >= 0.4 ? "var(--w-purple-600)" : r >= 0.2 ? "var(--w-purple-800)" : "var(--w-purple-900)";
}
const tempColors = { cold: "var(--temp-cold)", warn: "var(--temp-warn)", high: "var(--temp-high)", critical: "var(--temp-critical)" };
const defaultTempThresholds = { warn: 0.7, high: 0.82, critical: 0.94 };
function tempColorAt(t, th = defaultTempThresholds) {
  return t >= th.critical ? tempColors.critical : t >= th.high ? tempColors.high : t >= th.warn ? tempColors.warn : tempColors.cold;
}
function tempGradient(th = defaultTempThresholds) {
  const p = (x) => (Math.max(0, Math.min(1, x)) * 100).toFixed(1) + "%";
  return `linear-gradient(90deg, ${tempColors.cold} 0%, ${tempColors.cold} ${p(th.warn - 0.12)}, ${tempColors.warn} ${p(th.warn)}, ${tempColors.high} ${p(th.high)}, ${tempColors.critical} ${p(th.critical)}, ${tempColors.critical} 100%)`;
}
function accessor(acc, item, fallback) {
  if (typeof acc === "function") return acc(item);
  if (acc == null) return fallback;
  return item?.[acc];
}

const panelCss = `
.wdr{border-radius:var(--radius-md)}
.wdr[data-layout=cells],.wdr[data-layout=label-start]{border-radius:0}
.wdr[data-interactive=true]{cursor:pointer}
.wdr[data-interactive=true]:hover{background:var(--sidebar-hover)}
.wdr[data-selected=true],.wdr[data-selected=true]:hover{background:var(--sidebar-accent)}
.wdr:focus-visible{outline:2px solid var(--ring);outline-offset:-2px}
.wdr-sort{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;padding:0;font:inherit;color:inherit;cursor:pointer}
.wdr-sort:hover{color:var(--foreground)}
.w-dark,[data-theme="dark"],[data-ns-theme="dark"]{--viz-dock-track:var(--w-slate-800);--viz-dock-fill:var(--w-purple-500);--viz-dock-done:var(--w-purple-700);--viz-dock-done-fg:var(--w-purple-100);--viz-rail:var(--w-slate-800);--viz-rail-strong:var(--w-slate-700)}
`;
function injectPanelStyles() {
  if (typeof document === "undefined" || document.getElementById("wdr-styles")) return;
  const el = document.createElement("style");
  el.id = "wdr-styles";
  el.textContent = panelCss;
  document.head.appendChild(el);
}

function StatusMark({ status }) {
  if (status === "critical") return (
    <span aria-label="Critical" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16,
      flex: "none", borderRadius: "50%", background: "var(--w-red-500)", color: "var(--w-white)", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>!</span>
  );
  if (status === "warning") return (
    <span aria-label="Warning" style={{ display: "inline-flex", alignItems: "flex-end", justifyContent: "center", width: 18, height: 16,
      flex: "none", clipPath: "polygon(50% 0, 100% 100%, 0 100%)", background: "var(--w-yellow-500)", color: "var(--w-yellow-950)",
      fontSize: 10, fontWeight: 700, lineHeight: "13px" }}>!</span>
  );
  return null;
}

function barViz({ value = 0, max, scale = "linear", display, status = null, color = "auto", barHeight = 30, minBar = 10, insideThreshold = 0.14 }) {
  const r = scaleRatio(value, max ?? value, scale);
  const fill = color === "auto" ? autoShade(r) : color;
  const text = display ?? value;
  const barRef = React.useRef(null);
  const measRef = React.useRef(null);
  const [fits, setFits] = React.useState(true);
  React.useLayoutEffect(() => {
    const bar = barRef.current, meas = measRef.current;
    if (!bar || !meas || typeof ResizeObserver === "undefined") return;
    const check = () => setFits(bar.offsetWidth >= meas.offsetWidth + 20);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(bar);
    return () => ro.disconnect();
  }, [text, status]);
  const inside = r >= insideThreshold && fits;
  const content = (
    <>
      <span style={{ fontFamily: "var(--font-data)", fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 500, lineHeight: 1 }}>{text}</span>
      <StatusMark status={status} />
    </>
  );
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, width: "100%", minWidth: 0 }}>
      <span ref={measRef} aria-hidden="true" style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>{content}</span>
      <div ref={barRef} title={String(value)} style={{ width: `${r * 100}%`, minWidth: minBar, height: barHeight, flex: "none", boxSizing: "border-box",
        borderRadius: "var(--radius-sm)", background: fill, color: "var(--w-white)",
        display: "flex", alignItems: "center", gap: 6, padding: inside ? "0 10px" : 0, overflow: "hidden" }}>
        {inside && content}
      </div>
      {!inside && <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none", color: "var(--foreground)" }}>{content}</div>}
    </div>
  );
}

function spectrumViz({ bins = [], max, scale = "linear", thresholds = defaultTempThresholds, colors, height = 30, gap = 4, railWidth = 6.25, minBar = 8, rail = "var(--viz-rail)", binLabel }) {
  const m = max ?? Math.max(0, ...bins);
  const n = bins.length;
  return (
    <div role="img" style={{ display: "flex", alignItems: "stretch", gap, flex: "none", height }}>
      {bins.map((c, i) => {
        const r = scaleRatio(c, m, scale);
        const t = n > 1 ? i / (n - 1) : 0;
        return (
          <div key={i} title={binLabel ? binLabel(i, c) : `${c} assets`}
            style={{ flex: "none", width: railWidth, borderRadius: "var(--radius-pill)", background: rail,
                     display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
            {c > 0 && <div style={{ width: "100%", height: `${r * 100}%`, minHeight: minBar, borderRadius: "var(--radius-pill)",
                                     background: colors?.[i] || tempColorAt(t, thresholds) }} />}
          </div>
        );
      })}
    </div>
  );
}

function rangeViz({ min = 0, max = 100, low, high, thresholds, height = 15, unit = "" }) {
  const span = max - min || 1;
  const f = (v) => Math.max(0, Math.min(1, (v - min) / span));
  const th = thresholds ? { warn: f(thresholds.warn), high: f(thresholds.high), critical: f(thresholds.critical) } : defaultTempThresholds;
  const l = f(low ?? min), h = f(high ?? max);
  const w = Math.max(h - l, 0.02);
  return (
    <div role="img" aria-label={`${low}${unit} to ${high}${unit}`} title={`${low}${unit} – ${high}${unit}`}
      style={{ position: "relative", width: "100%", height, borderRadius: "var(--radius-pill)", background: "var(--viz-rail)" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${l * 100}%`, width: `${w * 100}%`, borderRadius: "var(--radius-pill)",
                    backgroundImage: tempGradient(th), backgroundSize: `${100 / w}% 100%`,
                    backgroundPosition: `${w < 1 ? (l / (1 - w)) * 100 : 0}% 0` }} />
    </div>
  );
}

function tempScaleLabel({ min, max, unit = "°F" }) {
  const fmt = (v) => (v < 0 ? "−" + Math.abs(v) : v) + unit;
  return (
    <span style={{ display: "flex", justifyContent: "space-between", width: "100%", fontFamily: "var(--font-data)", fontVariantNumeric: "tabular-nums" }}>
      <span>{fmt(min)}</span><span>{fmt(max)}</span>
    </span>
  );
}

const chipTones = {
  green: ["var(--w-green-500)", "var(--w-green-950)"], blue: ["var(--w-blue-500)", "var(--w-white)"],
  purple: ["var(--w-purple-500)", "var(--w-white)"], yellow: ["var(--w-yellow-500)", "var(--w-yellow-950)"],
  pink: ["var(--w-pink-500)", "var(--w-white)"], cyan: ["var(--w-cyan-500)", "var(--w-slate-950)"],
  lavender: ["var(--w-purple-200)", "var(--w-purple-950)"], slate: ["var(--w-slate-400)", "var(--w-slate-950)"],
  orange: ["var(--temp-high)", "var(--w-slate-950)"],
};
function assetChip({ letter = "P", tone = "green", size = 22 }) {
  const [bg, fg] = chipTones[tone] || chipTones.green;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flex: "none",
      borderRadius: "var(--radius-xs)", background: bg, color: fg, fontFamily: "var(--font-data)", fontSize: Math.round(size * 0.5),
      fontWeight: 500, lineHeight: 1 }}>{letter}</span>
  );
}

// ---- Receiving / verification ----
const defaultReceiptThresholds = { good: 100, warn: 85 };
function receiptTone(pct, th = defaultReceiptThresholds) {
  return pct >= th.good ? "good" : pct >= th.warn ? "warn" : "critical";
}
const toneFill = { good: "var(--ns-receipt-good, var(--w-purple-100))", warn: "var(--w-yellow-500)", critical: "var(--w-red-500)" };
const tileBase = (size) => ({ width: size, height: size, flex: "none", borderRadius: "var(--radius-xs)", position: "relative", overflow: "hidden",
  display: "flex", alignItems: "center", justifyContent: "center" });

// Dock doors: done (✓), loading (partial fill), warning, error, idle.
function docksViz({ docks = [], size = 30, gap = 4 }) {
  return (
    <div style={{ display: "flex", gap }}>
      {docks.map((d, i) => {
        const st = d?.status || "idle";
        const title = d?.label ? d.label + " · " + st : st;
        if (st === "warning" || st === "error")
          return <div key={i} title={title} style={{ ...tileBase(size), background: st === "error" ? "var(--w-red-500)" : "var(--w-yellow-500)" }} />;
        if (st === "done")
          return <div key={i} title={title} style={{ ...tileBase(size), background: "var(--viz-dock-done, var(--w-purple-200))", color: "var(--viz-dock-done-fg, var(--w-purple-700))" }}><Icon name="check" size={12} strokeWidth={2.5} /></div>;
        const p = Math.max(0, Math.min(1, d?.progress ?? 0));
        return (
          <div key={i} title={title + " · " + Math.round(p * 100) + "%"} style={{ ...tileBase(size), background: "var(--viz-dock-track, var(--w-purple-50))" }}>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: (p * 100) + "%", background: "var(--viz-dock-fill, var(--w-purple-200))", transition: "height .9s cubic-bezier(.16,1,.3,1)" }} />
          </div>
        );
      })}
    </div>
  );
}

// Last N days of receipts: null = no shipment; number = % match with manifest.
function receivingViz({ days = [], thresholds = defaultReceiptThresholds, size = 30, gap = 4, rail = "var(--viz-rail)", dayLabel }) {
  return (
    <div style={{ display: "flex", gap }}>
      {days.map((v, i) => {
        const title = dayLabel ? dayLabel(i, v) : v == null ? "No shipment" : v + "% match";
        if (v == null) return <div key={i} title={title} style={{ ...tileBase(size), background: rail }} />;
        const tone = receiptTone(v, thresholds);
        return (
          <div key={i} title={title} style={{ ...tileBase(size), background: toneFill[tone], color: "var(--ns-receipt-good-ink, var(--w-purple-500))" }}>
            {tone === "good" && <Icon name="check" size={12} strokeWidth={2.5} />}
          </div>
        );
      })}
    </div>
  );
}

// Single receipt as a progress bar: length = % match, ✓ at 100, else the % beside it.
function receiptViz({ value = 0, thresholds = defaultReceiptThresholds, height = 16 }) {
  const pct = Math.max(0, Math.min(100, value));
  const tone = receiptTone(pct, thresholds);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minWidth: 0 }} title={pct + "% match with manifest"}>
      <div style={{ width: `calc((100% - 44px) * ${pct / 100})`, minWidth: 6, height, flex: "none", borderRadius: "var(--radius-xs)", background: toneFill[tone] }} />
      {tone === "good"
        ? <span style={{ display: "inline-flex", color: "var(--w-purple-500)" }}><Icon name="check" size={12} strokeWidth={2.5} /></span>
        : <span style={{ fontFamily: "var(--font-data)", fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>{Math.round(pct)}%</span>}
    </div>
  );
}

// Cycle count: one category's stock as % of par — same scale as receipt rows; purple ramp + low-stock marks.
const defaultStockThresholds = { warn: 20, critical: 5 };
function stockViz({ value = 0, status, thresholds = defaultStockThresholds, height = 16, color = "auto" }) {
  const pct = Math.max(0, Math.min(100, value));
  const st = status !== undefined ? status : pct <= thresholds.critical ? "critical" : pct <= thresholds.warn ? "warning" : null;
  const fill = color === "auto" ? autoShade(pct / 100) : color;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minWidth: 0 }} title={pct + "% of par"}>
      <div style={{ width: `calc((100% - 72px) * ${pct / 100})`, minWidth: 8, height, flex: "none", borderRadius: "var(--radius-xs)", background: fill }} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-data)", fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 500, color: "var(--foreground)", whiteSpace: "nowrap" }}>
        {Math.round(pct)}%<StatusMark status={st} />
      </span>
    </div>
  );
}

/* ---- DataRow.jsx ---- */
const BarViz = barViz, SpectrumViz = spectrumViz, RangeViz = rangeViz, DocksViz = docksViz, ReceivingViz = receivingViz, ReceiptViz = receiptViz, StockViz = stockViz, AssetChip = assetChip, TempScaleLabel = tempScaleLabel;



const JUSTIFY = { start: "start", center: "center", end: "end" };
const truncate = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 };

/**
 * DataRow — one row type for every panel list. `variant` picks the datapoint viz:
 *  - "list"               cells in a column grid (shipments, assets, summaries)
 *  - "availability"       scaled inventory bar + label
 *  - "temperature-aggregation"  assets-per-temp spectrum per location (rails, cold → hot) + label
 *  - "temperature-range"  label + low → high temperature range bar
 *  - "dockdoor-verification-aggregation"  dock doors: done ✓ / loading (partial) / warning / error
 *  - "receipt-aggregation"  last 7 days of receipts as tiles (✓ 100%, yellow, red)
 *  - "receipt-percentage"   label + one receipt as a % progress bar
 *  - "stock"              label + category stock as % of par (cycle count), low-stock marks
 */
function DataRow({
  variant: variantProp = "list",
  label,
  leading = null,
  asset,                  // letter for the asset-type chip, e.g. "P"
  assetTone = "green",
  cells,
  layout,                 // "viz-start" | "label-start" — default per variant
  vizWidth: vizWidthProp,
  template,
  // availability
  value, max, scale = "linear", display, status = null, color = "auto", barHeight = 30, insideThreshold,
  // temperature
  bins, thresholds, binLabel, spectrumHeight = 30, binColors, minBar,
  // temperature-range
  domain = [-22, 32], range, unit = "°F",
  // verification / receiving / receipt
  docks, days, receiptThresholds, dayLabel, stockThresholds,
  size = "md",
  divider,
  selected = false,
  onClick,
  className = "",
  style = {},
  ...rest
}) {
  injectPanelStyles();
  const ALIAS = { temperature: "temperature-aggregation", "temperature-aggregated": "temperature-aggregation", receiving: "receipt-aggregation", receipt: "receipt-percentage", verification: "dockdoor-verification-aggregation" };
  const variant = ALIAS[variantProp] || variantProp; // legacy aliases
  const ctx = React.useContext(rowListCtx);
  const cols = ctx?.columns;
  // Temperature spectra keep fixed 8px rails, so their column sizes to content unless a width is given.
  // Measured from the reference panels (3x): availability viz column 220px, tile/rail vizzes size to content.
  const vizWidth = vizWidthProp ?? (["temperature-aggregation", "dockdoor-verification-aggregation", "receipt-aggregation"].includes(variant) ? "max-content" : variant === "availability" ? "220px" : "50%");
  const compact = variant === "receipt-percentage" || variant === "stock";
  const labelStart = variant === "temperature-range" || compact;
  const lay = variant === "list" ? "cells" : layout || (labelStart ? "label-start" : "viz-start");

  let viz = null;
  if (variant === "availability")
    viz = <BarViz value={value} max={max} scale={scale} display={display} status={status} color={color} barHeight={barHeight} insideThreshold={insideThreshold} />;
  else if (variant === "temperature-aggregation")
    viz = <SpectrumViz bins={bins} max={max} scale={scale} thresholds={thresholds} binLabel={binLabel} height={spectrumHeight} colors={binColors} minBar={minBar ?? 8}
            rail={selected ? "var(--viz-rail-strong)" : "var(--viz-rail)"} />;
  else if (variant === "temperature-range")
    viz = <RangeViz min={domain[0]} max={domain[1]} low={range?.[0]} high={range?.[1]} thresholds={thresholds} unit={unit} />;
  else if (variant === "dockdoor-verification-aggregation")
    viz = <DocksViz docks={docks} />;
  else if (variant === "receipt-aggregation")
    viz = <ReceivingViz days={days} thresholds={receiptThresholds} dayLabel={dayLabel} rail={selected ? "var(--viz-rail-strong)" : "var(--viz-rail)"} />;
  else if (variant === "receipt-percentage")
    viz = <ReceiptViz value={value} thresholds={receiptThresholds} />;
  else if (variant === "stock")
    viz = <StockViz value={value} status={status ?? undefined} thresholds={stockThresholds} color={color} />;

  const lead = asset ? <AssetChip letter={asset} tone={assetTone} /> : leading;
  const withLead = (node) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      {lead}
      {typeof node === "string" || typeof node === "number" ? <span style={truncate}>{node}</span> : node}
    </div>
  );

  const interactive = !!onClick;
  const common = {
    className: "wdr " + className,
    "data-layout": lay,
    "data-selected": selected ? "true" : undefined,
    "data-interactive": interactive ? "true" : undefined,
    role: "row",
    tabIndex: interactive ? 0 : undefined,
    onClick,
    onKeyDown: interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } } : undefined,
    ...rest,
  };

  if (lay === "viz-start") {
    const showDivider = divider ?? false;
    return (
      <div {...common} style={{ display: "grid", gridTemplateColumns: `${vizWidth === "max-content" ? "max-content" : `minmax(0, ${vizWidth})`} minmax(0, 1fr)`, alignItems: "center", columnGap: 16,
                                minHeight: variant === "temperature-aggregation" ? spectrumHeight : variant === "availability" ? barHeight : 30, paddingRight: 12,
                                borderBottom: showDivider ? "1px solid var(--border)" : "none", ...style }}>
        <div role="cell" style={{ minWidth: 0, display: "flex", alignItems: "center" }}>{viz}</div>
        <div role="cell" style={{ ...truncate, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10,
                                  fontSize: 12, fontWeight: selected ? 500 : 400, color: "var(--foreground)" }}>
          {lead}<span style={truncate}>{label}</span>
        </div>
      </div>
    );
  }

  const list = lay === "label-start" ? [label, viz] : (cells ?? [label]);
  const tpl = template || ctx?.template ||
    (lay === "label-start" ? `minmax(0,1fr) minmax(0, ${vizWidth})` : list.length === 2 ? "minmax(0,1fr) auto" : `repeat(${Math.max(list.length, 1)}, minmax(0,1fr))`);
  const showDivider = divider ?? !compact;
  return (
    <div {...common} style={{ display: "grid", gridTemplateColumns: tpl, columnGap: 16, alignItems: "center",
                              minHeight: compact ? 36 : size === "sm" ? 40 : 52, padding: "0 12px",
                              fontWeight: selected && compact ? 500 : undefined,
                              borderBottom: showDivider ? "1px solid var(--border)" : "none",
                              fontSize: 12, color: "var(--foreground)", fontVariantNumeric: "tabular-nums", ...style }}>
      {list.map((c, i) => (
        <div key={i} role="cell" style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10, overflow: "hidden",
                                          justifySelf: cols?.[i]?.align ? JUSTIFY[cols[i].align] : "stretch",
                                          justifyContent: cols?.[i]?.align === "end" ? "flex-end" : undefined }}>
          {i === 0 ? withLead(c) : (typeof c === "string" || typeof c === "number" ? <span style={truncate}>{c}</span> : c)}
        </div>
      ))}
    </div>
  );
}

/* ---- DataRowList.jsx ---- */





const FLEX = { start: "flex-start", center: "center", end: "flex-end" };

/**
 * DataRowList — the panel block: title, count, meta, actions, optional column
 * header, and a list of DataRows — from `items` + accessors, or as children.
 */
const LIST_ALIAS = { temperature: "temperature-aggregation", "temperature-aggregated": "temperature-aggregation", receiving: "receipt-aggregation", receipt: "receipt-percentage", verification: "dockdoor-verification-aggregation" };

function DataRowList({
  title, count, meta, actions = null,
  columns, sort, onSort,
  items,
  variant: variantProp = "list",
  rowKey,
  label = "label",
  value = "value",
  display, status, cells, asset, leading,
  bins = "bins",
  range = "range",
  docks = "docks",
  days = "days",
  sortBy = "none",
  max = "auto",
  scale,
  vizWidth,
  rowProps = {},
  selectedKey,
  onSelect,
  gap,
  padding = "20px 20px 12px",
  className = "",
  style = {},
  children,
  ...rest
}) {
  injectPanelStyles();
  const variant = LIST_ALIAS[variantProp] || variantProp;
  const template = columns ? columns.map((c) => c.width || "minmax(0,1fr)").join(" ") : null;
  const vizStart = ["availability", "temperature-aggregation", "dockdoor-verification-aggregation", "receipt-aggregation"].includes(variant) && rowProps.layout !== "label-start";
  // Reference: 4px between viz rows; receipt rows are contiguous 36px rows.
  const rowGap = gap ?? (vizStart ? 4 : 0); // divider / compact rows sit flush so hover + selection fill the whole row

  let rows = null;
  if (items) {
    let list = items.map((it, i) => ({ it, key: accessor(rowKey, it, null) ?? accessor(label, it, null) ?? i, v: Number(accessor(value, it, 0)) || 0 }));
    if (sortBy === "desc") list.sort((a, b) => b.v - a.v);
    else if (sortBy === "asc") list.sort((a, b) => a.v - b.v);
    let m = max;
    if (max === "auto") {
      if (variant === "availability") m = Math.max(0, ...list.map((r) => r.v));
      else if (variant === "temperature-aggregation") m = Math.max(0, ...list.flatMap((r) => accessor(bins, r.it, []) || []));
      else m = undefined;
    }
    rows = list.map(({ it, key, v }) => (
      <DataRow key={key} variant={variant} {...rowProps}
        label={accessor(label, it)}
        value={v}
        max={m}
        scale={scale ?? rowProps.scale}
        vizWidth={vizWidth ?? rowProps.vizWidth}
        display={display ? accessor(display, it) : undefined}
        status={status ? accessor(status, it) : variant === "stock" ? undefined : null}
        cells={cells ? accessor(cells, it) : undefined}
        asset={asset ? accessor(asset, it) : undefined}
        leading={leading ? accessor(leading, it) : undefined}
        bins={accessor(bins, it)}
        range={accessor(range, it)}
        docks={accessor(docks, it)}
        days={accessor(days, it)}
        selected={selectedKey != null && key === selectedKey}
        onClick={onSelect ? () => onSelect(key, it) : undefined} />
    ));
  }

  return (
    <rowListCtx.Provider value={{ template, columns }}>
      <section className={className} style={{ padding, ...style }} {...rest}>
        {(title || meta || actions) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, minHeight: 32 }}>
            <h2 style={{ margin: 0, minWidth: 0, fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 20, lineHeight: 1.2,
                         letterSpacing: "-0.01em", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}{count != null && <span> ({count})</span>}
            </h2>
            {(meta || actions) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                {meta && <span style={{ fontFamily: "var(--font-data)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.02em",
                                         color: "var(--muted-foreground)" }}>{meta}</span>}
                {actions}
              </div>
            )}
          </div>
        )}
        {columns && (
          <div role="row" style={{ display: "grid", gridTemplateColumns: template, columnGap: 16, alignItems: "center", height: 36, padding: "0 12px",
                                   borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 500, color: "var(--muted-foreground)" }}>
            {columns.map((c) => {
              const active = sort && sort.key === c.key;
              const text = c.tempScale ? <TempScaleLabel min={c.tempScale.min} max={c.tempScale.max} unit={c.tempScale.unit} /> : c.label;
              const body = c.sortable ? (
                <button type="button" className="wdr-sort" onClick={() => onSort && onSort(c.key)} style={active ? { color: "var(--foreground)" } : undefined}>
                  {text}<Icon name={active ? (sort.dir === "asc" ? "chevron-up" : "chevron-down") : "chevrons-up-down"} size={14} />
                </button>
              ) : text;
              return <div key={c.key} role="columnheader" style={{ display: "flex", minWidth: 0, justifyContent: FLEX[c.align || "start"] }}>{body}</div>;
            })}
          </div>
        )}
        <div role="rowgroup" style={{ display: "flex", flexDirection: "column", gap: rowGap }}>
          {rows}
          {children}
        </div>
      </section>
    </rowListCtx.Provider>
  );
}

window.WDataRow = DataRow; window.WDataRowList = DataRowList;
if (typeof module !== "undefined") module.exports = { DataRow, DataRowList };
