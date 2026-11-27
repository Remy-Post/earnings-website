import { useState } from "react";
import { DotRows, type Row } from "../charts/DotRows";
import type { ReportPayload, SplitResults } from "../data/types";
import { MINUS, pEq, pp, pval, signedPct, signedPp, years } from "../lib/format";
import { chosen, h1Rows, h1Title, modelLabel } from "../lib/report";
import { DataTable, Figure, Key } from "../ui/Figure";

type SplitKey = "test" | "validation";

/** The opening figure: each model's mean absolute error minus B0's on the same events, with its 95% interval,
 *  around a zero line that is B0. Left of the line is better than the stock's own history. */
export function H1Figure({ p }: { p: ReportPayload }) {
  const hasTest = p.splits.test !== null;
  const [which, setWhich] = useState<SplitKey>(hasTest ? "test" : "validation");
  const split: SplitResults = which === "test" && p.splits.test ? p.splits.test : p.splits.validation;
  const label = which === "test" ? "test years" : "validation years";
  const best = chosen(p).regression;
  const rows = h1Rows(split);

  const chartRows: Row[] = rows.map((r) => ({
    key: r.model,
    label: modelLabel(r),
    strong: r.model === best,
    value: r.test?.p_value != null && r.delta_mae_vs_b0 != null ? `${signedPp(r.delta_mae_vs_b0)}, p ${pval(r.test.p_value)}` : undefined,
    marks:
      r.delta_mae_vs_b0 == null
        ? []
        : [{
            value: r.delta_mae_vs_b0,
            low: r.test?.ci95_low,
            high: r.test?.ci95_high,
            kind: r.model === best ? "chosen" : "other",
            title: `${modelLabel(r)}: ${pp(r.delta_mae_vs_b0)} points against B0 (${r.test?.p_value != null ? pEq(r.test.p_value) : "no test"})`,
          }],
  }));

  const title = h1Title(split, label);

  return (
    <Figure
      level={2}
      title={title}
      subtitle={
        <>
          Each dot is a model&rsquo;s mean absolute error minus the baseline&rsquo;s on the same {split.n.toLocaleString("en-US")} reports
          of {years(split.years)}, in percentage points of price; the line through it is the 95% confidence interval. Left of
          zero is closer than B0.
        </>
      }
      controls={
        hasTest ? (
          <div className="segmented" role="group" aria-label="Years scored">
            {(["test", "validation"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={which === k} onClick={() => { setWhich(k); }}>
                {k === "test" ? `Test ${years(p.splits.test?.years ?? "")}` : `Validation ${years(p.splits.validation.years)}`}
              </button>
            ))}
          </div>
        ) : null
      }
      legend={<Key items={[{ kind: "chosen", label: "Model chosen on validation" }, { kind: "other", label: "Other models" }]} />}
      table={
        <DataTable
          caption={`Error against B0, ${label}`}
          rows={rows}
          rowKey={(r) => r.model}
          strong={(r) => r.model === best}
          columns={[
            { head: "Model", cell: (r) => modelLabel(r) },
            { head: "MAE", num: true, cell: (r) => (r.mae == null ? "–" : pp(r.mae)) },
            { head: "vs B0", num: true, cell: (r) => (r.pct_mae_vs_b0 == null ? "–" : signedPct(r.pct_mae_vs_b0)) },
            { head: "Difference", num: true, cell: (r) => (r.delta_mae_vs_b0 == null ? "–" : pp(r.delta_mae_vs_b0)) },
            {
              head: "95% interval",
              num: true,
              cell: (r) => (r.test?.ci95_low != null && r.test.ci95_high != null ? `${pp(r.test.ci95_low)} to ${pp(r.test.ci95_high)}` : "–"),
            },
            { head: "p", num: true, cell: (r) => (r.test?.p_value != null ? pval(r.test.p_value) : "–") },
          ]}
        />
      }
      note={
        <>
          Mean absolute error (MAE) of the predicted absolute earnings-day move, percentage points of price; B0 is the mean
          absolute move of the company&rsquo;s last 8 reports. Two-sided paired t-test on absolute errors, unadjusted for the
          many tests run, so p-values are exploratory. Negative values ({MINUS}) are better than B0.
        </>
      }
    >
      <DotRows
        rows={chartRows}
        label={title}
        axis="Mean absolute error minus B0’s, percentage points"
        format={(v) => pp(v)}
        reference={{ value: 0, label: "B0" }}
        include={[0]}
      />
    </Figure>
  );
}
