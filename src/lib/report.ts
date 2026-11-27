// Pure derivations from the report payload: labels, joins and the findings the titles state. Every number a
// sentence on the site prints comes through here from the API's answer.
import type { ClassificationRow, HypothesisTest, RegressionRow, ReportPayload, RobustnessRow, SplitResults } from "../data/types";

const FAMILY: Record<string, string> = {
  b0: "B0, last‑8 mean",
  b0_rule: "B0 rule",
  majority: "Majority class",
  linear: "Linear regression",
  knn: "k‑nearest neighbours",
  knn_clf: "k‑nearest neighbours",
  mlp: "Neural network",
  logistic: "Logistic regression",
  gnb: "Naive Bayes",
};

/** "Linear regression, v0", "Linear regression + PCA, full", "B0, last‑8 mean". */
export function modelLabel(row: { model: string; family: string; feature_set: string }) {
  const base = FAMILY[row.family] ?? row.family;
  if (row.family === "b0" || row.family === "b0_rule" || row.family === "majority") return base;
  const pca = row.model.includes("pca") ? " + PCA" : "";
  return `${base}${pca}, ${row.feature_set}`;
}

/** The names validation chose as the best regression and classification models. */
export function chosen(p: ReportPayload): { regression: string | null; classification: string | null } {
  const s = p.selected as { best_regression?: unknown; best_classification?: unknown } | null;
  const reg = p.run?.best_regression ?? (typeof s?.best_regression === "string" ? s.best_regression : null);
  const cls = typeof s?.best_classification === "string" ? s.best_classification : null;
  return { regression: reg, classification: cls };
}

/** The paired t-test of a model's absolute errors against B0's on the same events. */
export function pairedTest(split: SplitResults, model: string): HypothesisTest | undefined {
  return split.tests.find((t) => t.family === "H1" && t.comparison === `${model} vs b0 (|error|)`);
}

export const b0Row = (split: SplitResults) => split.regression.find((r) => r.family === "b0");

export type H1Row = RegressionRow & { test: HypothesisTest | undefined };

/** Every regression model except B0, with its paired test. */
export function h1Rows(split: SplitResults): H1Row[] {
  return split.regression.filter((r) => r.family !== "b0").map((r) => ({ ...r, test: pairedTest(split, r.model) }));
}

const ALPHA = 0.05;

/** Models whose 95% interval of the error difference lies wholly below zero (better than B0 beyond noise),
 *  wholly above (worse), and how many were better on average at all. */
export function h1Summary(split: SplitResults) {
  const rows = h1Rows(split);
  const better = rows.filter((r) => (r.delta_mae_vs_b0 ?? 0) < 0);
  const clearlyBetter = rows.filter((r) => r.test?.ci95_high != null && r.test.ci95_high < 0);
  const clearlyWorse = rows.filter((r) => r.test?.ci95_low != null && r.test.ci95_low > 0);
  return { rows, better, clearlyBetter, clearlyWorse, total: rows.length };
}

export function significant(p: number | null | undefined) {
  return p != null && p < ALPHA;
}

/** The H1 figure's title for a split, computed from the intervals. */
export function h1Title(split: SplitResults, label: string) {
  const s = h1Summary(split);
  const names = s.clearlyBetter.map((r) => r.family);
  const allLinear = names.length > 0 && names.every((f) => f === "linear");
  if (s.clearlyBetter.length === 0) {
    const worse = s.clearlyWorse.length
      ? `; ${s.clearlyWorse.length === 1 ? "one model was" : `${s.clearlyWorse.length} models were`} clearly worse`
      : "";
    return `On the ${label}, no model beat B0 by more than the noise${worse}`;
  }
  const which = allLinear
    ? s.clearlyBetter.length === 1 ? "the linear model" : `the ${numberWord(s.clearlyBetter.length)} linear models`
    : `${s.clearlyBetter.length} of them`;
  return `On the ${label}, ${s.better.length} of ${s.total} models beat B0 on average, and ${which} by more than the noise`;
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const numberWord = (n: number) => WORDS[n] ?? String(n);

/** Robustness variants that re-fit the same models under a different target or sample, in the report's order;
 *  tech/non-tech are the H2 split and shown there. */
export const ROBUSTNESS_LABEL: Record<string, string> = {
  raw_target: "As fitted (raw target)",
  winsorized_target: "Winsorised target",
  abs_abnormal_move_target: "Market-adjusted move",
  excluding_intraday: "Without intraday releases",
  excluding_timing_conflict: "Without conflicting timing",
  excluding_2020: "Without 2020 in training",
  tech_only: "Technology stocks only",
  non_tech_only: "Non-technology stocks only",
};

export function robustnessFor(split: SplitResults, model: string, variants: string[]): RobustnessRow[] {
  return variants
    .map((v) => split.robustness.find((r) => r.variant === v && r.model === model))
    .filter((r): r is RobustnessRow => r !== undefined);
}

export const SAMPLE_VARIANTS = [
  "raw_target",
  "winsorized_target",
  "abs_abnormal_move_target",
  "excluding_intraday",
  "excluding_timing_conflict",
  "excluding_2020",
];

export function range(values: number[]) {
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** H2 tests by comparison text. */
export function h2Tests(split: SplitResults) {
  const find = (prefix: string) => split.tests.find((t) => t.family === "H2" && t.comparison.startsWith(prefix));
  return {
    move: find("abs_move"),
    b0Error: find("|error| of b0"),
    modelError: split.tests.find(
      (t) => t.family === "H2" && t.comparison.startsWith("|error| of") && !t.comparison.startsWith("|error| of b0"),
    ),
    all: split.tests.filter((t) => t.family === "H2"),
  };
}

export const classRow = (split: SplitResults, model: string): ClassificationRow | undefined =>
  split.classification.find((r) => r.model === model);

/** Number of distinct events behind the H2 move test (tech + non-tech), when the payload has it. */
export function totalEvents(split: SplitResults) {
  const t = h2Tests(split).move;
  return t?.n != null && t.n2 != null ? { tech: t.n, nonTech: t.n2, all: t.n + t.n2 } : null;
}

/** The neural-network sweep on validation: every MLP configuration tried, by feature set. */
export function mlpSweep(p: ReportPayload) {
  return p.grid
    .filter((g) => g.task === "regression" && g.model.startsWith("mlp"))
    .map((g) => {
      const sizes = g.params.hidden_layer_sizes;
      const size = Array.isArray(sizes) ? `(${sizes.join(", ")})` : "";
      return { ...g, size, layers: Array.isArray(sizes) ? sizes.length : 0 };
    });
}
