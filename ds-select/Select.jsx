const PATHS = { "chevron-down": "m6 9 6 6 6-6", "search": "m21 21-4.34-4.34M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0", "check": "M20 6 9 17l-5-5" };
const Icon = ({ name, size = 16, style }) => React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style }, React.createElement("path", { d: PATHS[name] }));

/**
 * Select — filter/sort dropdown. The trigger matches the platform filters
 * (36px, slate-200 border, soft shadow, slate-400 chevron). Clicking it opens a
 * popover laid out like the open part of a Shadcn combobox (Popover + Command), in Wiliot colors:
 *   • 1px slate-200 border, 6px radius, shadow-2, white fill, fade + zoom-in-95 (150ms)
 *   • search row: 16px search icon at 50% opacity + borderless input, 40px, border-bottom
 *   • list: 4px padding, max 300px scroll; items 14px, 6×8 padding, 4px radius,
 *     highlighted = slate-100; selected shows a check on the right
 *   • "No results found." empty state; ↑/↓/Enter/Esc keyboard; click-outside closes
 * onChange receives a select-like event ({ target: { value } }) plus the value.
 */

function Select({
  size = "md",
  options = [],
  value,
  onChange,
  placeholder = "Select…",
  searchable = true,
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  variant = "outline",      // outline (filter trigger) | ghost (inline text trigger, e.g. "200 Per Page ⌄")
  placement = "bottom",     // bottom | top (open upward, e.g. in a paging row)
  align = "start",          // start | end
  renderValue,              // (option) => node — custom trigger label
  multiple = false,         // value is an array; items render DS checkboxes; an "All" master row is prepended
  allLabel = "All",
  disabled = false,
  className = "",
  style = {},
  ...rest
}) {
  const h = size === "sm" ? 30 : 36;
  const opts = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const [local, setLocal] = React.useState((value == null ? "" : value));
  React.useEffect(() => { if (!onChange) setLocal((value == null ? "" : value)); }, [value]);
  const current = onChange ? value : local;

  const [open, setOpen] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const rootRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  const filtered = opts.filter((o) => String(o.label).toLowerCase().includes(q.trim().toLowerCase()));
  const selArr = multiple ? (Array.isArray(current) ? current : []) : null;
  const allOn = multiple && selArr.length > 0 && selArr.length === opts.length;
  const noneOn = multiple && selArr.length === 0;
  const selected = multiple ? (noneOn || allOn ? null : { label: selArr.length === 1 ? (opts.find((o) => o.value === selArr[0]) || {}).label : selArr.length + " selected" }) : opts.find((o) => o.value === current);
  const list = multiple ? [{ label: allLabel, value: "__all__" }, ...filtered] : filtered;
  const hasIcons = opts.some((o) => o.icon);
  const IconSlot = ({ o }) => hasIcons ? <span style={{ display: "inline-flex", width: 16, height: 16, flex: "none", color: "var(--w-slate-600)" }}>{o && o.icon}</span> : null;

  const openMenu = () => {
    if (disabled) return;
    setQ(""); setOpen(true);
    const i = Math.max(0, opts.findIndex((o) => o.value === current));
    setHi(i);
    requestAnimationFrame(() => { setShown(true); inputRef.current && inputRef.current.focus(); });
  };
  const close = () => { setShown(false); setOpen(false); };
  const pick = (o) => {
    if (!o) return;
    if (multiple) {
      let next;
      if (o.value === "__all__") next = allOn ? [] : opts.map((x) => x.value);
      else next = selArr.includes(o.value) ? selArr.filter((v) => v !== o.value) : [...selArr, o.value];
      if (onChange) onChange({ target: { value: next } }, next); else setLocal(next);
      return;
    }
    if (onChange) onChange({ target: { value: o.value } }, o.value); else setLocal(o.value);
    close();
  };
  const Box = ({ on }) => React.createElement("span", { role: "checkbox", "aria-checked": on, style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, flex: "none", borderRadius: "var(--radius-xs)", border: "1.5px solid " + (on ? "var(--primary)" : "var(--border-strong)"), background: on ? "var(--primary)" : "var(--background)", transition: "background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)" } },
    on ? React.createElement("svg", { width: 11, height: 11, viewBox: "0 0 24 24", fill: "none", stroke: "var(--primary-foreground)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M20 6 9 17l-5-5" })) : null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) close(); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  React.useEffect(() => { setHi(0); }, [q]);
  React.useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('[data-hi="true"]');
    if (el && el.scrollIntoView === undefined) return;
    if (el) { const p = listRef.current; if (el.offsetTop < p.scrollTop) p.scrollTop = el.offsetTop - 4; else if (el.offsetTop + el.offsetHeight > p.scrollTop + p.clientHeight) p.scrollTop = el.offsetTop + el.offsetHeight - p.clientHeight + 4; }
  }, [hi, open]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(list.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(list[hi]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  };

  return (
    <div ref={rootRef} className={className}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", height: h, ...style }} {...rest}>
      <button type="button" role="combobox" aria-expanded={open} aria-haspopup="listbox" disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => { if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); openMenu(); } }}
        style={variant === "ghost" ? {
          display: "inline-flex", alignItems: "center", gap: 4, height: h, padding: 0, border: "none", background: "transparent",
          fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: "var(--w-slate-950)",
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, outline: "none",
        } : {
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          width: "100%", height: h, padding: "0 12px", boxSizing: "border-box",
          fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 400, textAlign: "left",
          color: selected ? "var(--w-slate-950)" : "var(--w-slate-500)",
          background: "var(--background)", border: "1px solid var(--w-slate-200)", borderRadius: "var(--radius-sm)",
          boxShadow: open ? "var(--ring-focus, 0 0 0 2px rgb(var(--w-slate-950-rgb) / .12))" : "var(--shadow-control, var(--shadow-1, 0 1px 3px rgb(15 29 42 / .06)))",
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, outline: "none",
          transition: "box-shadow var(--dur-fast) var(--ease-standard)",
        }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {selected && selected.icon && <IconSlot o={selected} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? (renderValue ? renderValue(selected) : selected.label) : placeholder}</span>
        </span>
        <Icon name="chevron-down" size={16} style={{ color: variant === "ghost" ? "var(--w-slate-950)" : "var(--w-slate-400)" }} />
      </button>

      {open && (
        <div role="dialog"
          style={{
            position: "absolute", zIndex: 50,
            ...(placement === "top" ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }),
            ...(align === "end" ? { right: 0 } : { left: 0 }),
            width: variant === "ghost" ? "auto" : "100%", minWidth: variant === "ghost" ? 160 : 200, boxSizing: "border-box",
            background: "var(--background)", border: "1px solid var(--w-slate-200)", borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-2)", overflow: "hidden",
            fontFamily: "var(--font-sans)", color: "var(--w-slate-950)",
            transformOrigin: `${placement === "top" ? "bottom" : "top"} ${align === "end" ? "right" : "left"}`,
            opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(0.95)",
            transition: "opacity 150ms var(--ease-out), transform 150ms var(--ease-out)",
          }}>
          {searchable && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 12px", borderBottom: "1px solid var(--w-slate-200)" }}>
              <Icon name="search" size={16} style={{ opacity: 0.5 }} />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
                placeholder={searchPlaceholder} aria-autocomplete="list"
                style={{ flex: 1, minWidth: 0, height: "100%", border: "none", outline: "none", background: "transparent",
                  fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--w-slate-950)" }} />
            </div>
          )}
          <div ref={listRef} role="listbox" tabIndex={-1} onKeyDown={!searchable ? onKey : undefined}
            style={{ maxHeight: 300, overflowY: "auto", padding: 4, position: "relative" }}>
            {list.length === 0 || (multiple && filtered.length === 0) ? (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: 14, color: "var(--w-slate-500)" }}>{emptyText}</div>
            ) : list.map((o, i) => {
              const isSel = multiple ? (o.value === "__all__" ? allOn : selArr.includes(o.value)) : o.value === current, isHi = i === hi;
              return (
                <div key={o.value} role="option" aria-selected={isSel} data-hi={isHi ? "true" : "false"}
                  onMouseEnter={() => setHi(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4,
                    fontSize: 14, lineHeight: "20px", cursor: "pointer", userSelect: "none",
                    background: isHi ? "var(--w-slate-100)" : "transparent", color: "var(--w-slate-950)" }}>
                  {multiple && <Box on={isSel} />}
                  <IconSlot o={o} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                  {!multiple && <Icon name="check" size={16} style={{ opacity: isSel ? 1 : 0, color: "var(--w-slate-950)" }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

window.DSSelect = Select;
if (typeof module !== "undefined") module.exports = { Select };
