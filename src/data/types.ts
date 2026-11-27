// The answer of GET /api/v1/report (Remy-Post/data-science, app/api/v1). Conventions of that API: every
// move and error is a fraction of the price (0.062 = 6.2%), every field is present, and a value that can be
// missing is `null`. Field lists: docs/DECISIONS.md, D5.

export type RegressionRow = {
  model: string;
  family: string;
  feature_set: string;
  n_fit: number;
  n: number;
  mae: number | null;
  r2: number | null;
  pct_mae_vs_b0: number | null;
  delta_mae_vs_b0: number | null;
  share_beats_b0: number | null;
  t_stat: number | null;
  t_p: number | null;
  /** True for the row of the model frozen for the live test (linear_v0). */
  frozen_for_live_test?: boolean;
};

export type ClassificationRow = {
  model: string;
  family: string;
  feature_set: string;
  n: number;
  n_fit?: number;
  n_positive: number;
  threshold: number;
  tn: number;
  fp: number;
  fn: number;
  tp: number;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  roc_auc: number | null;
};

export type HypothesisTest = {
  family: string;
  test: string;
  comparison: string;
  n: number | null;
  n2: number | null;
  mean_diff: number | null;
  statistic: number | null;
  df: number | null;
  p_value: number | null;
  note: string | null;
  ci95_low: number | null;
  ci95_high: number | null;
};

export type RobustnessRow = {
  variant: string;
  model: string;
  n_fit: number;
  n: number;
  mae: number | null;
  mae_b0: number | null;
  pct_mae_vs_b0: number | null;
  r2: number | null;
  share_beats_b0: number | null;
  t_p: number | null;
};

export type SplitResults = {
  years: string;
  n: number;
  regression: RegressionRow[];
  classification: ClassificationRow[];
  tests: HypothesisTest[];
  robustness: RobustnessRow[];
};

export type GridRow = {
  task: "regression" | "classification";
  model: string;
  feature_set: string;
  params: Record<string, unknown>;
  metric: string;
  val_score: number;
  n_fit: number;
  n_val: number;
  selected: boolean;
};

export type Cluster = {
  cluster: number;
  n_companies: number;
  tech_share: number;
  mean_abs_move: number;
  sd_abs_move: number;
  mean_sigma20: number;
  tickers: string[];
};

export type ClusterCompany = {
  ticker: string;
  cluster: number;
  tech: number;
  n_events: number;
  mean_abs_move: number;
  sd_abs_move: number;
  mean_sigma20: number;
};

export type KMeans = {
  clusters: Cluster[];
  elbow: { k: number; inertia: number; chosen: boolean }[];
  companies: ClusterCompany[];
};

export type FeatureRow = {
  feature: string;
  group: string;
  in_v0: boolean;
  in_full: boolean;
  categorical: boolean;
  reason: string;
};

export type TestRun = {
  run_at_utc: string;
  n_fit_rows: number;
  n_test_rows: number;
  best_regression: string;
  scikit_learn: string;
};

export type ReportPayload = {
  generated_at_utc: string;
  source: "live" | "static";
  data_as_of: string | null;
  run: TestRun | null;
  splits: { validation: SplitResults; test: SplitResults | null };
  grid: GridRow[];
  kmeans: KMeans;
  feature_sets: FeatureRow[];
  selected: unknown;
};
