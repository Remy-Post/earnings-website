import { ticks, xScale } from "./scale";
import { useWidth } from "./useWidth";

/** Which entity a mark is: the baseline B0 (blue circle), the model validation chose (vermillion square), any
 *  other model (quiet ink circle), or a second reading of the same row (hollow ring, e.g. non-tech stocks). */
export type MarkKind = "b0" | "chosen" | "other" | "hollow";

export type Mark = {
  value: number;
  low?: number | null;
  high?: number | null;
  kind: MarkKind;
  /** Native tooltip and part of the row's accessible text. */
  title: string;
};

export type Row = {
  key: string;
  label: string;
  /** Short right-aligned text on the label line (the row's value). */
  value?: string;
  marks: Mark[];
  strong?: boolean;
};

type Props = {
  rows: Row[];
  /** Accessible name: the finding. */
  label: string;
  /** Unit text under the axis. */
  axis: string;
  format: (v: number) => string;
  /** A reference line: B0 (drawn in B0 blue) or a neutral value such as chance. */
  reference?: { value: number; label: string; tone?: "b0" | "neutral" };
  /** Values the axis must include (0 for magnitudes). */
  include?: number[];
  fixed?: [number, number];
  /** Dots per row can be many (k-means): draw them smaller. */
  dense?: boolean;
};

const ROW = 46;
const DENSE_ROW = 64;

/** A one-dimensional beeswarm: marks that would overlap move to alternating lanes above and below the row's
 *  line (0, -1, +1, -2, +2), so every company stays visible. Returns a lane per mark, in input order. */
export function lanes(xs: number[], gap: number, maxLane = 2): number[] {
  const order = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
  const lastInLane = new Map<number, number>();
  const out = new Array<number>(xs.length).fill(0);
  const seq = [0];
  for (let l = 1; l <= maxLane; l++) seq.push(-l, l);
  for (const [x, i] of order) {
    const lane = seq.find((l) => (lastInLane.get(l) ?? -Infinity) <= x - gap) ?? seq[seq.length - 1] ?? 0;
    lastInLane.set(lane, x);
    out[i] = lane;
  }
  return out;
}
const LABEL_Y = 16;
const DOT_Y = 34;
const AXIS = 40;
const TOP = 22;

export function DotRows({ rows, label, axis, format, reference, include, fixed, dense }: Props) {
  const { ref, width, scale } = useWidth<HTMLDivElement>();
  const k = scale;
  const left = 6 * k;
  const right = width - 6 * k;
  const values = rows.flatMap((r) => r.marks.flatMap((m) => [m.value, m.low ?? m.value, m.high ?? m.value]));
  const x = xScale(values, [left, right], { include: [...(include ?? []), ...(reference ? [reference.value] : [])], fixed });
  const t = ticks(x);
  const rowH = (dense ? DENSE_ROW : ROW) * k;
  const top = TOP * k;
  const height = top + rows.length * rowH + AXIS * k;
  const bottom = top + rows.length * rowH;
  const markK = k * (dense ? 0.75 : 1);

  return (
    <div ref={ref} className="chart">
      {width > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} data-chart>
          {/* gridlines and ticks */}
          {t.map((v) => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={top} y2={bottom} className="grid" />
              <text x={x(v)} y={bottom + 16 * k} className="tick" textAnchor="middle">{format(v)}</text>
            </g>
          ))}
          <text x={left} y={bottom + 34 * k} className="axis-title">{axis}</text>
          {reference && (
            <g>
              <line x1={x(reference.value)} x2={x(reference.value)} y1={top - 4 * k} y2={bottom} className={reference.tone === "neutral" ? "ref neutral" : "ref"} />
              <text
                x={x(reference.value)}
                y={top - 9 * k}
                className="ref-label"
                textAnchor={x(reference.value) > width - 60 * k ? "end" : x(reference.value) < 60 * k ? "start" : "middle"}
              >
                {reference.label}
              </text>
            </g>
          )}
          {rows.map((r, i) => {
            const y0 = top + i * rowH;
            const yd = y0 + (dense ? DOT_Y + 9 : DOT_Y) * k;
            const lane = dense ? lanes(r.marks.map((m) => x(m.value)), 9 * markK) : r.marks.map(() => 0);
            return (
              <g key={r.key}>
                <line x1={left} x2={right} y1={y0 + rowH} y2={y0 + rowH} className="row-rule" />
                <text x={left} y={y0 + LABEL_Y * k} className={r.strong ? "row-label strong" : "row-label"}>{r.label}</text>
                {r.value && (
                  <text x={right} y={y0 + LABEL_Y * k} className="row-value" textAnchor="end">{r.value}</text>
                )}
                {r.marks.map((m, j) =>
                  m.low != null && m.high != null ? (
                    <line key={`i${j}`} x1={x(m.low)} x2={x(m.high)} y1={yd} y2={yd} className={`interval ${m.kind}`} />
                  ) : null,
                )}
                {r.marks.map((m, j) => (
                  <MarkShape key={j} cx={x(m.value)} cy={yd + (lane[j] ?? 0) * 7 * markK} kind={m.kind} k={markK} title={m.title} />
                ))}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Equal-area marks (DESIGN.md section 6): circle 8.5px, square 7.5px, with a 1px ground-colour outline. */
function MarkShape({ cx, cy, kind, k, title }: { cx: number; cy: number; kind: MarkKind; k: number; title: string }) {
  if (kind === "chosen") {
    const s = 7.5 * k;
    return (
      <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} className="mark chosen">
        <title>{title}</title>
      </rect>
    );
  }
  return (
    <circle cx={cx} cy={cy} r={4.25 * k} className={`mark ${kind}`}>
      <title>{title}</title>
    </circle>
  );
}
