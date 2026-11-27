// Number formats (DESIGN.md sections 4 and 9): U+2212 for negatives, one decimal for percent in tables,
// fixed decimals, no space before %, and non-breaking spaces between a number and its unit.

export const MINUS = "−";
export const NBSP = " ";

const fixed = (x: number, digits: number) => {
  const s = Math.abs(x).toFixed(digits);
  // -0.0 prints as 0.0
  return (x < 0 && Number(s) !== 0 ? MINUS : "") + s;
};

/** A fraction of price as percentage points: 0.04036 -> "4.04". */
export const pp = (x: number, digits = 2) => fixed(x * 100, digits);

/** A fraction as a percent: 0.643 -> "64.3%". */
export const pct = (x: number, digits = 1) => `${fixed(x * 100, digits)}%`;

/** A percent value that is already in percent units, with its sign: -2.775 -> "−2.8%", 0.67 -> "+0.7%". */
export const signedPct = (x: number, digits = 1) => {
  const s = fixed(x, digits);
  return `${x > 0 && Number(Math.abs(x).toFixed(digits)) !== 0 ? "+" : ""}${s}%`;
};

/** Same, without a sign: -2.775 -> "2.8%". */
export const absPct = (x: number, digits = 1) => `${Math.abs(x).toFixed(digits)}%`;

/** A signed difference in percentage points: 0.0107 -> "+1.07". */
export const signedPp = (x: number, digits = 2) => `${x > 0 ? "+" : ""}${pp(x, digits)}`;

/** A two-sided p-value: three decimals, two significant digits from 0.1 up, "< 0.001" below. */
export const pval = (p: number) => {
  if (p < 0.001) return `<${NBSP}0.001`;
  if (p < 0.1) return p.toFixed(3);
  return p.toFixed(2);
};

/** "p = 0.010" or "p < 0.001". */
export const pEq = (p: number) => (p < 0.001 ? `p${NBSP}<${NBSP}0.001` : `p${NBSP}=${NBSP}${pval(p)}`);

export const int = (n: number) => n.toLocaleString("en-US");

export const auc = (x: number) => x.toFixed(3);

/** "2022-2023" -> "2022–23". */
export const years = (span: string) => {
  const [a, b] = span.split("-");
  return a && b ? `${a}–${b.slice(2)}` : span;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** A moment: "Nov 27, 2026, 16:37 UTC" (the year is kept: the report outlives the calendar year). */
export const moment = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${MONTHS[d.getUTCMonth()] ?? ""}${NBSP}${d.getUTCDate()}, ${d.getUTCFullYear()}, ${hh}:${mm}${NBSP}UTC`;
};
