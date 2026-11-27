import { scaleLinear } from "d3-scale";

/** One linear x scale for a dot-rows chart: the domain covers every value and the reference, is rounded to
 *  nice ticks, and maps to [left, right] in pixels. Magnitude charts pass `zero` so the axis starts at 0. */
export function xScale(values: number[], range: [number, number], opts: { include?: number[]; fixed?: [number, number] } = {}) {
  const all = [...values, ...(opts.include ?? [])].filter((v) => Number.isFinite(v));
  const lo = opts.fixed ? opts.fixed[0] : Math.min(...all);
  const hi = opts.fixed ? opts.fixed[1] : Math.max(...all);
  const s = scaleLinear().domain(lo === hi ? [lo - 1, hi + 1] : [lo, hi]).range(range);
  if (!opts.fixed) s.nice(4);
  return s;
}

/** Three to five ticks (DESIGN.md section 6). */
export function ticks(s: ReturnType<typeof scaleLinear<number, number>>) {
  for (const n of [4, 5, 3, 6]) {
    const t = s.ticks(n);
    if (t.length >= 3 && t.length <= 5) return t;
  }
  return s.ticks(4).slice(0, 5);
}
