import { DotRows, type Row } from "../charts/DotRows";
import type { ReportPayload, SplitResults } from "../data/types";
import { absPct, auc, int, NBSP, pEq, pct, pp, pval, signedPct, signedPp, years } from "../lib/format";
import {
  b0Row, chosen, classRow, h1Rows, h2Tests, mlpSweep, modelLabel, numberWord, pairedTest, range, ROBUSTNESS_LABEL,
  robustnessFor, SAMPLE_VARIANTS,
} from "../lib/report";
import { DataTable, Figure, Key } from "../ui/Figure";
import { Chapter } from "../ui/Chapter";

const dash = "–";
const opt = <T,>(v: T | null | undefined, f: (x: T) => string) => (v == null ? dash : f(v));

/* ---------------------------------------------------------------- 1. Size of the move (H1) */
export function SizeChapter({ p }: { p: ReportPayload }) {
  const val = p.splits.validation;
  const test = p.splits.test;
  const best = chosen(p).regression;
  const valRows = h1Rows(val);
  const testRows = test ? h1Rows(test) : [];
  const b0v = b0Row(val);
  const b0t = test ? b0Row(test) : undefined;
  const bestT = testRows.find((r) => r.model === best);
  const linearT = testRows.filter((r) => r.family === "linear");
  const linPct = linearT.map((r) => -(r.pct_mae_vs_b0 ?? 0));
  const share = bestT?.share_beats_b0;

  const finding =
    bestT && b0t?.mae != null && bestT.mae != null && bestT.pct_mae_vs_b0 != null
      ? `On the test years the linear models were ${range(linPct).min.toFixed(1)}% to ${range(linPct).max.toFixed(1)}% more accurate than B0, a real but small gain: the error fell from ${pp(b0t.mae)} to ${pp(bestT.mae)} points.`
      : "The test years have not been scored yet.";

  return (
    <Chapter id="size" title="Predicting the size of the move" finding={finding}>
      <p className="body">
        On validation no model was distinguishable from B0. On the test years every model except the full-feature
        neural network beat it on average{share != null ? `, and the chosen linear model was closer than B0 on ${pct(share, 0)} of reports` : ""}.
        The surprise in the earnings themselves, unknown beforehand, drives most of the move, so the stock&rsquo;s own history is
        hard to beat. Adding the 17 market, fundamentals, text and calendar features to the 13 v0 features did not help.
      </p>
      <DataTable
        caption="Regression models on validation and test"
        rows={[...(b0v ? [b0v] : []), ...valRows]}
        rowKey={(r) => r.model}
        strong={(r) => r.model === best}
        columns={[
          { head: "Model", cell: (r) => modelLabel(r) },
          { head: `MAE ${years(val.years)}`, num: true, cell: (r) => opt(r.mae, pp) },
          { head: "p", num: true, cell: (r) => opt(pairedTest(val, r.model)?.p_value, pval) },
          { head: test ? `MAE ${years(test.years)}` : "Test", num: true, cell: (r) => opt(test?.regression.find((t) => t.model === r.model)?.mae, pp) },
          { head: "vs B0", num: true, cell: (r) => (r.family === "b0" ? dash : opt(test?.regression.find((t) => t.model === r.model)?.pct_mae_vs_b0, signedPct)) },
          { head: "R²", num: true, cell: (r) => opt(test?.regression.find((t) => t.model === r.model)?.r2, (x) => x.toFixed(3)) },
          { head: "p", num: true, cell: (r) => (test ? opt(pairedTest(test, r.model)?.p_value, pval) : dash) },
        ]}
      />
      <p className="table-note">
        Mean absolute error in percentage points of price; validation {years(val.years)} (n{NBSP}={NBSP}{int(val.n)}),
        test {test ? `${years(test.years)} (n${NBSP}=${NBSP}${int(test.n)})` : "not yet scored"}. p from the two-sided paired t-test against B0, unadjusted.
      </p>
      {test && best && <RobustnessFigure split={test} model={best} />}
    </Chapter>
  );
}

function RobustnessFigure({ split, model }: { split: SplitResults; model: string }) {
  const rows = robustnessFor(split, model, SAMPLE_VARIANTS);
  const gains = rows.map((r) => -(r.pct_mae_vs_b0 ?? 0));
  const ps = rows.map((r) => r.t_p ?? 1);
  const { min, max } = range(gains);
  const all = ps.every((x) => x < 0.05);
  const title = `The gain held in all ${rows.length} checks: ${min.toFixed(1)}% to ${max.toFixed(1)}% better than B0${all ? `, p between ${pval(Math.min(...ps))} and ${pval(Math.max(...ps))}` : ""}`;
  const chartRows: Row[] = rows.map((r) => ({
    key: r.variant,
    label: ROBUSTNESS_LABEL[r.variant] ?? r.variant,
    value: r.pct_mae_vs_b0 != null && r.t_p != null ? `${signedPct(r.pct_mae_vs_b0)}, p ${pval(r.t_p)}` : undefined,
    marks: r.pct_mae_vs_b0 == null ? [] : [{ value: r.pct_mae_vs_b0, kind: "chosen", title: `${ROBUSTNESS_LABEL[r.variant] ?? r.variant}: ${signedPct(r.pct_mae_vs_b0)} against B0` }],
  }));
  return (
    <Figure
      title={title}
      subtitle="The chosen model refitted with a different target or without part of the sample, scored on the test years. Each dot is its error change against B0 under that check."
      table={
        <DataTable
          caption="Robustness checks, test years"
          rows={rows}
          rowKey={(r) => r.variant}
          columns={[
            { head: "Check", cell: (r) => ROBUSTNESS_LABEL[r.variant] ?? r.variant },
            { head: "Reports", num: true, cell: (r) => int(r.n) },
            { head: "MAE", num: true, cell: (r) => opt(r.mae, pp) },
            { head: "B0", num: true, cell: (r) => opt(r.mae_b0, pp) },
            { head: "vs B0", num: true, cell: (r) => opt(r.pct_mae_vs_b0, signedPct) },
            { head: "p", num: true, cell: (r) => opt(r.t_p, pval) },
          ]}
        />
      }
      note={<>Change in mean absolute error against B0 on the same reports, percent; {modelLabel({ model, family: "linear", feature_set: "v0" })}; test years {years(split.years)}. p from the paired t-test, unadjusted.</>}
    >
      <DotRows rows={chartRows} label={title} axis="Change in error against B0, %" format={(v) => signedPct(v, 0)} reference={{ value: 0, label: "B0" }} include={[0]} />
    </Figure>
  );
}

/* ---------------------------------------------------------------- 2. Technology stocks (H2) */
export function TechChapter({ p }: { p: ReportPayload }) {
  const test = p.splits.test;
  const split = test ?? p.splits.validation;
  const h2 = h2Tests(split);
  const best = chosen(p).regression;
  const tech = best ? robustnessFor(split, best, ["tech_only"])[0] : undefined;
  const non = best ? robustnessFor(split, best, ["non_tech_only"])[0] : undefined;
  const finding =
    h2.move?.mean_diff != null && tech?.pct_mae_vs_b0 != null && non?.pct_mae_vs_b0 != null
      ? `Technology stocks moved ${pp(h2.move.mean_diff)} points more and were harder to predict, and that is where the model helped: ${absPct(tech.pct_mae_vs_b0)} better than B0 on tech, ${absPct(non.pct_mae_vs_b0)} on the rest.`
      : "Technology stocks moved more than the rest.";

  const models = split.regression.filter((r) => r.family !== "b0").map((r) => r.model);
  const chartRows: Row[] = models.map((m) => {
    const t = robustnessFor(split, m, ["tech_only"])[0];
    const n = robustnessFor(split, m, ["non_tech_only"])[0];
    const reg = split.regression.find((r) => r.model === m);
    return {
      key: m,
      label: reg ? modelLabel(reg) : m,
      strong: m === best,
      value: t?.pct_mae_vs_b0 != null && n?.pct_mae_vs_b0 != null ? `${signedPct(t.pct_mae_vs_b0)} / ${signedPct(n.pct_mae_vs_b0)}` : undefined,
      marks: [
        ...(t?.pct_mae_vs_b0 != null ? [{ value: t.pct_mae_vs_b0, kind: m === best ? ("chosen" as const) : ("other" as const), title: `Tech: ${signedPct(t.pct_mae_vs_b0)} (${t.t_p != null ? pEq(t.t_p) : ""})` }] : []),
        ...(n?.pct_mae_vs_b0 != null ? [{ value: n.pct_mae_vs_b0, kind: "hollow" as const, title: `Non-tech: ${signedPct(n.pct_mae_vs_b0)} (${n.t_p != null ? pEq(n.t_p) : ""})` }] : []),
      ],
    };
  });
  const worst = [...chartRows].sort((a, b) => (b.marks[1]?.value ?? 0) - (a.marks[1]?.value ?? 0))[0];
  const pairs = chartRows.filter((r) => r.marks.length === 2);
  const allTechBetter = pairs.length > 0 && pairs.every((r) => (r.marks[0]?.value ?? 0) < (r.marks[1]?.value ?? 0));
  const title =
    tech?.pct_mae_vs_b0 != null && tech.t_p != null
      ? `${allTechBetter ? `All ${numberWord(pairs.length)} models did better against B0 on tech stocks than on the rest` : "The chosen model did better against B0 on tech stocks"}; the chosen one was ${absPct(tech.pct_mae_vs_b0)} better there (${pEq(tech.t_p)})`
      : "Error change against B0, tech and non-tech";

  return (
    <Chapter id="tech" title="Technology stocks" finding={finding}>
      <p className="body">
        For a technology stock the last eight reports are a weaker guide, which leaves room for volatility and timing
        features to add information. The H2 hypothesis, that tech stocks move more and are harder to predict, is supported
        by all three tests below.
      </p>
      <Figure
        title={title}
        subtitle={<>Each model refitted on one group and scored on the {years(split.years)} reports of that group. Filled: technology stocks; ring: the rest.</>}
        legend={<Key items={[{ kind: "chosen", label: "Tech, chosen model" }, { kind: "other", label: "Tech, other models" }, { kind: "hollow", label: "Non-tech" }]} />}
        table={
          <DataTable
            caption="Error change against B0 by group"
            rows={models}
            rowKey={(m) => m}
            strong={(m) => m === best}
            columns={[
              { head: "Model", cell: (m) => { const r = split.regression.find((x) => x.model === m); return r ? modelLabel(r) : m; } },
              { head: "Tech", num: true, cell: (m) => opt(robustnessFor(split, m, ["tech_only"])[0]?.pct_mae_vs_b0, signedPct) },
              { head: "p", num: true, cell: (m) => opt(robustnessFor(split, m, ["tech_only"])[0]?.t_p, pval) },
              { head: "Non-tech", num: true, cell: (m) => opt(robustnessFor(split, m, ["non_tech_only"])[0]?.pct_mae_vs_b0, signedPct) },
              { head: "p", num: true, cell: (m) => opt(robustnessFor(split, m, ["non_tech_only"])[0]?.t_p, pval) },
            ]}
          />
        }
        note={<>Change in mean absolute error against B0 on the same reports, percent; tech n{NBSP}={NBSP}{opt(tech?.n, int)}, non-tech n{NBSP}={NBSP}{opt(non?.n, int)}. Paired t-tests, unadjusted.{worst?.marks[1] && worst.marks[1].value > 0 ? ` The full-feature network was the only model clearly worse than B0 on non-tech stocks.` : ""}</>}
      >
        <DotRows rows={chartRows} label={title} axis="Change in error against B0, %" format={(v) => signedPct(v, 0)} reference={{ value: 0, label: "B0" }} include={[0]} />
      </Figure>
      <DataTable
        caption="Two-sample t-tests, tech minus non-tech"
        rows={h2.all}
        rowKey={(t) => t.comparison}
        columns={[
          { head: "Tech minus non-tech", cell: (t) => H2_LABEL(t.comparison, split) },
          { head: "Reports, tech / other", num: true, cell: (t) => (t.n != null && t.n2 != null ? `${int(t.n)} / ${int(t.n2)}` : dash) },
          { head: "Difference", num: true, cell: (t) => opt(t.mean_diff, (x) => `${signedPp(x)}${NBSP}pp`) },
          { head: "t", num: true, cell: (t) => opt(t.statistic, (x) => x.toFixed(2)) },
          { head: "p", num: true, cell: (t) => opt(t.p_value, pval) },
        ]}
      />
      <p className="table-note">Independent two-sample t-tests with equal variances; pp = percentage points of price. Unadjusted p-values, exploratory.</p>
    </Chapter>
  );
}

const H2_LABEL = (c: string, split: SplitResults) => {
  if (c.startsWith("abs_move")) return "Absolute move, all events";
  const m = /\|error\| of ([^:\s]+)/.exec(c)?.[1];
  const row = m ? split.regression.find((r) => r.model === m) : undefined;
  return `Absolute error of ${row ? modelLabel(row) : m ?? c}, ${years(split.years)}`;
};

/* ---------------------------------------------------------------- 3. Overfitting */
export function OverfitChapter({ p }: { p: ReportPayload }) {
  const sweep = mlpSweep(p);
  const val = p.splits.validation;
  const b0 = b0Row(val);
  const full = sweep.filter((g) => g.feature_set === "full");
  const small = sweep.find((g) => g.feature_set === "v0" && g.selected);
  const test = p.splits.test;
  const mlpFullTest = test?.regression.find((r) => r.model === "mlp_full");
  const worstTest = test ? [...test.regression].sort((a, b) => (b.mae ?? 0) - (a.mae ?? 0))[0] : undefined;
  const mlpValTest = pairedTest(val, "mlp_full");
  const fullMaes = full.map((g) => pp(g.val_score));
  const finding = `On validation the network got worse as it grew: ${fullMaes.join(", ")} points on the full features${small ? `, against ${pp(small.val_score)} for the small network on v0` : ""}.`;
  const title = `The largest network was the worst model tried: ${pp(Math.max(...sweep.map((g) => g.val_score)))} points against B0\u2019s ${b0?.mae != null ? pp(b0.mae) : dash}`;

  const chartRows: Row[] = sweep.map((g) => ({
    key: `${g.model}${g.size}`,
    label: `${g.feature_set === "v0" ? "v0, 13 features" : "Full, 30 features"}, hidden layers ${g.size}`,
    strong: g.selected,
    value: pp(g.val_score),
    marks: [{ value: g.val_score * 100, kind: "other", title: `${g.feature_set} ${g.size}: ${pp(g.val_score)}` }],
  }));

  return (
    <Chapter id="overfitting" title="Overfitting: the neural network" finding={finding}>
      <Figure
        title={title}
        subtitle="Validation error of every network size tried, on the 13 v0 features and on all 30. The line is B0 on the same reports."
        table={
          <DataTable
            caption="Neural-network sizes on validation"
            rows={sweep}
            rowKey={(g) => `${g.model}${g.size}`}
            strong={(g) => g.selected}
            columns={[
              { head: "Features", cell: (g) => g.feature_set },
              { head: "Hidden layers", cell: (g) => g.size },
              { head: "MAE", num: true, cell: (g) => pp(g.val_score) },
              { head: "Selected", cell: (g) => (g.selected ? "yes" : "") },
            ]}
          />
        }
        note={<>Mean absolute error on validation {years(val.years)} (n{NBSP}={NBSP}{int(val.n)}), percentage points of price; the axis starts at zero. ReLU networks trained by gradient descent on squared error; only the hidden-layer size was tuned.</>}
      >
        <DotRows
          rows={chartRows}
          label={title}
          axis="Mean absolute error, percentage points"
          format={(v) => v.toFixed(0)}
          reference={b0?.mae != null ? { value: b0.mae * 100, label: `B0 ${pp(b0.mae)}` } : undefined}
          include={[0]}
        />
      </Figure>
      <p className="body">
        The small network on all 30 features was the only model clearly worse than B0 on validation
        {mlpValTest?.p_value != null && mlpValTest.mean_diff != null ? ` (${signedPp(mlpValTest.mean_diff)} points, ${pEq(mlpValTest.p_value)})` : ""}.
        {mlpFullTest && worstTest?.model === "mlp_full" && mlpFullTest.pct_mae_vs_b0 != null
          ? ` On the test years it was again the worst model and the only one that lost to B0 (${signedPct(mlpFullTest.pct_mae_vs_b0)}).`
          : ""}{" "}
        With hundreds to thousands of weights and about {int(test ? test.regression[1]?.n_fit ?? 0 : val.regression[1]?.n_fit ?? 0)} noisy training
        reports, a larger network learns patterns from the training years that do not repeat. A straight line on a few strong
        features generalises better.
      </p>
    </Chapter>
  );
}

/* ---------------------------------------------------------------- 4. Big moves (classification) */
export function BigMoveChapter({ p }: { p: ReportPayload }) {
  const test = p.splits.test;
  const split = test ?? p.splits.validation;
  const val = p.splits.validation;
  const best = chosen(p).classification;
  const rule = classRow(split, "b0_rule");
  const model = best ? classRow(split, best) : undefined;
  const label = test ? "test years" : "validation years";
  const finding =
    rule?.roc_auc != null && model?.roc_auc != null
      ? `Whether a big move happens is predictable well above chance: logistic regression and the B0 rule rank a big-move report above a quiet one about two times in three (AUC ${auc(model.roc_auc)} and ${auc(rule.roc_auc)}).`
      : "Big moves are predictable above chance.";
  const tie = rule?.roc_auc != null && model?.roc_auc != null && Math.abs(rule.roc_auc - model.roc_auc) < 0.001;
  const title =
    rule?.roc_auc != null && model?.roc_auc != null
      ? tie
        ? `On the ${label}, logistic regression and the B0 rule tie at AUC ${auc(rule.roc_auc)}${split.classification.filter((r) => r.family !== "majority").every((r) => (r.roc_auc ?? 0) > 0.5) ? "; every fitted model is above chance" : ""}`
        : `On the ${label}, the best AUC is ${auc(Math.max(...split.classification.map((r) => r.roc_auc ?? 0)))}`
      : "AUC by model";

  const rows = split.classification;
  const chartRows: Row[] = rows.map((r) => ({
    key: r.model,
    label: modelLabel(r),
    strong: r.model === best,
    value: opt(r.roc_auc, auc),
    marks:
      r.roc_auc == null
        ? []
        : [{ value: r.roc_auc, kind: r.model === best ? "chosen" : r.model === "b0_rule" ? "b0" : "other", title: `${modelLabel(r)}: AUC ${auc(r.roc_auc)}` }],
  }));

  return (
    <Chapter id="big-moves" title="Predicting whether a big move happens" finding={finding}>
      <p className="body">
        A move is big when it exceeds twice the stock&rsquo;s 20-day daily standard deviation, so 4% is big for a utility but not
        for a chip maker. The two use the history differently: the B0 rule calls &ldquo;big&rdquo; often and catches most big moves;
        logistic regression is more selective, with fewer false alarms and higher precision.
      </p>
      <Figure
        title={title}
        subtitle="ROC-AUC: the chance that a random big-move report gets a higher score than a random quiet one. The axis starts at 0.5, guessing."
        legend={<Key items={[{ kind: "chosen", label: "Model chosen on validation" }, { kind: "b0", label: "B0 rule" }, { kind: "other", label: "Other models" }]} />}
        table={
          <DataTable
            caption={`Classification of big moves, ${label}`}
            rows={rows}
            rowKey={(r) => r.model}
            strong={(r) => r.model === best}
            columns={[
              { head: "Model", cell: (r) => modelLabel(r) },
              { head: "Accuracy", num: true, cell: (r) => opt(r.accuracy, (x) => pct(x)) },
              { head: "Precision", num: true, cell: (r) => opt(r.precision, (x) => pct(x)) },
              { head: "Recall", num: true, cell: (r) => opt(r.recall, (x) => pct(x)) },
              { head: "AUC", num: true, cell: (r) => opt(r.roc_auc, auc) },
              { head: "Validation AUC", num: true, cell: (r) => opt(classRow(val, r.model)?.roc_auc, auc) },
            ]}
          />
        }
        note={<>{years(split.years)}, n{NBSP}={NBSP}{int(split.n)} reports, {rows[0] ? int(rows[0].n_positive) : dash} of them big. ROC-AUC is the one method here beyond the course.</>}
      >
        <DotRows rows={chartRows} label={title} axis="ROC-AUC" format={(v) => v.toFixed(2)} fixed={[0.5, 0.7]} reference={{ value: 0.5, label: "Chance", tone: "neutral" }} />
      </Figure>
      {rule && model && (
        <>
          <DataTable
            caption="Confusion counts"
            rows={CONFUSION}
            rowKey={(c) => c.label}
            columns={[
              { head: years(split.years), cell: (c) => c.label },
              { head: "B0 rule", num: true, cell: (c) => int(rule[c.key]) },
              { head: modelLabel(model), num: true, cell: (c) => int(model[c.key]) },
            ]}
          />
          <p className="table-note">
            The B0 rule calls &ldquo;big&rdquo; when the mean of the last 8 moves exceeds 2σ20; logistic regression when its probability
            exceeds {model.threshold}. False alarms: {int(model.fp)} against {int(rule.fp)}.
          </p>
        </>
      )}
    </Chapter>
  );
}

const CONFUSION: { label: string; key: "tp" | "fp" | "fn" | "tn" }[] = [
  { label: "Big, called big", key: "tp" },
  { label: "Quiet, called big (false alarm)", key: "fp" },
  { label: "Big, missed", key: "fn" },
  { label: "Quiet, called quiet", key: "tn" },
];

/* ---------------------------------------------------------------- 5. Company profiles (k-means) */
export function ProfilesChapter({ p }: { p: ReportPayload }) {
  const { clusters, companies, elbow } = p.kmeans;
  const sorted = [...clusters].sort((a, b) => a.mean_abs_move - b.mean_abs_move);
  const top = sorted[sorted.length - 1];
  const nonTechAboveTech = sorted.some((c) => c.tech_share === 0 && sorted.some((d) => d.tech_share === 1 && c.mean_abs_move > d.mean_abs_move));
  const k = elbow.find((e) => e.chosen)?.k ?? clusters.length;
  const describe = (share: number) => (share === 0 ? "no tech" : share === 1 ? "all tech" : `${Math.round(share * 100)}% tech`);
  const finding = nonTechAboveTech
    ? "Companies group by how much they move, not by sector: a non-tech group moves more than the tech group, and “tech” is a rough stand-in for “high-growth”."
    : "Companies group mainly by how much they move.";
  const title = top
    ? `The group that moves most (${top.n_companies} companies, ${pct(top.mean_abs_move)} a report on average) is ${describe(top.tech_share)}`
    : "Company groups";

  const chartRows: Row[] = sorted.map((c) => ({
    key: String(c.cluster),
    label: `${c.n_companies} companies, ${describe(c.tech_share)}`,
    value: pct(c.mean_abs_move),
    marks: companies
      .filter((co) => co.cluster === c.cluster)
      .map((co) => ({ value: co.mean_abs_move * 100, kind: co.tech ? ("other" as const) : ("hollow" as const), title: `${co.ticker}: ${pct(co.mean_abs_move)}` })),
  }));

  return (
    <Chapter id="profiles" title="Company profiles" finding={finding}>
      <Figure
        title={title}
        subtitle={<>k-means (k{NBSP}={NBSP}{k}, chosen by the elbow) on each company&rsquo;s mean and spread of earnings-day moves, its typical daily volatility and its tech flag. Each dot is one company&rsquo;s mean absolute move; filled dots are tech.</>}
        legend={<Key items={[{ kind: "other", label: "Tech" }, { kind: "hollow", label: "Non-tech" }]} />}
        table={
          <DataTable
            caption="k-means clusters"
            rows={sorted}
            rowKey={(c) => String(c.cluster)}
            columns={[
              { head: "Companies", cell: (c) => int(c.n_companies) },
              { head: "Tech share", num: true, cell: (c) => pct(c.tech_share, 0) },
              { head: "Mean |move|", num: true, cell: (c) => pct(c.mean_abs_move) },
              { head: "Mean σ20", num: true, cell: (c) => pct(c.mean_sigma20) },
              { head: "Examples", mono: true, cell: (c) => c.tickers.slice(0, 4).join(" ") },
            ]}
          />
        }
        note={<>Mean absolute earnings-day move per company over its reports, percent of price; {int(companies.length)} companies with enough history. Inertia {elbow.map((e) => e.inertia.toFixed(0)).join(", ")} for k{NBSP}={NBSP}{elbow[0]?.k}{dash}{elbow[elbow.length - 1]?.k}.</>}
      >
        <DotRows rows={chartRows} label={title} axis="Mean absolute move per report, %" format={(v) => `${v.toFixed(0)}%`} include={[0]} dense />
      </Figure>
    </Chapter>
  );
}

