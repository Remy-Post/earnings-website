import { useId, useState, type ReactNode } from "react";

type Props = {
  /** The finding, computed from the data. */
  title: string;
  /** How to read it. */
  subtitle?: ReactNode;
  children: ReactNode;
  /** The same numbers as a table (DESIGN.md section 6: every chart has a table alternative). */
  table?: ReactNode;
  /** One note: what was measured, unit, split, source. */
  note: ReactNode;
  /** Key under the picture. */
  legend?: ReactNode;
  controls?: ReactNode;
  /** The opening figure sits directly under the page title, so its title is an h2. */
  level?: 2 | 3;
};

/** Order under every figure: the picture (key and controls included), "View as table", then one note. */
export function Figure({ title, subtitle, children, table, note, legend, controls, level = 3 }: Props) {
  const H = level === 2 ? "h2" : "h3";
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <figure className="figure">
      <H className="figure-title">{title}</H>
      {subtitle && <p className="figure-sub">{subtitle}</p>}
      {controls}
      {children}
      {legend}
      {table && (
        <>
          <button type="button" className="table-toggle" aria-expanded={open} aria-controls={id} onClick={() => { setOpen(!open); }}>
            {open ? "Hide table" : "View as table"}
          </button>
          <div id={id} hidden={!open} className="figure-table">{table}</div>
        </>
      )}
      <figcaption className="figure-note">{note}</figcaption>
    </figure>
  );
}

export type Column<T> = { head: ReactNode; cell: (row: T) => ReactNode; num?: boolean; mono?: boolean };

/** A plain table that scrolls inside its own container, never the page. */
export function DataTable<T>({ rows, columns, caption, rowKey, strong }: {
  rows: T[];
  columns: Column<T>[];
  caption: string;
  rowKey: (row: T) => string;
  strong?: (row: T) => boolean;
}) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col" className={c.num ? "num" : undefined}>{c.head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className={strong?.(r) ? "strong" : undefined}>
              {columns.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className={c.mono ? "mono" : undefined}>{c.cell(r)}</th>
                ) : (
                  <td key={i} className={[c.num ? "num" : "", c.mono ? "mono" : ""].join(" ").trim() || undefined}>{c.cell(r)}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The key: shapes repeat colours so nothing depends on hue alone. */
export function Key({ items }: { items: { kind: "b0" | "chosen" | "other" | "hollow"; label: string }[] }) {
  return (
    <ul className="key">
      {items.map((it) => (
        <li key={it.label}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            {it.kind === "chosen" ? (
              <rect x="2.25" y="2.25" width="7.5" height="7.5" className="mark chosen" />
            ) : (
              <circle cx="6" cy="6" r="4.25" className={`mark ${it.kind}`} />
            )}
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  );
}
