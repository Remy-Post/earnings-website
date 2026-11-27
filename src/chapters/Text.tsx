import type { ReportPayload } from "../data/types";
import { int, NBSP, pEq, pp, years } from "../lib/format";
import { b0Row, chosen, pairedTest, totalEvents } from "../lib/report";
import { Chapter } from "../ui/Chapter";
import { DataTable } from "../ui/Figure";

/** The opening verdict, computed from the payload (DESIGN.md section 1a: the verdict is a sentence). */
export function verdict(p: ReportPayload): string {
  const best = chosen(p).regression;
  const test = p.splits.test;
  const val = p.splits.validation;
  if (!best || !test) {
    return "The held-out test years have not been scored yet; on the validation years no model was clearly better than the stock’s own history.";
  }
  const row = test.regression.find((r) => r.model === best);
  const b0 = b0Row(test);
  const t = pairedTest(test, best);
  const tv = pairedTest(val, best);
  if (!row?.mae || !b0?.mae || row.pct_mae_vs_b0 == null || !t?.p_value) return "The results are incomplete.";
  const valPart = tv?.p_value != null && tv.p_value >= 0.05 ? `; on the validation years the difference was within the noise (${pEq(tv.p_value)})` : "";
  return `A stock’s own history does most of the work. On the held-out test years ${years(test.years)}, a linear regression cut the error of the history baseline by ${Math.abs(row.pct_mae_vs_b0).toFixed(1)}%, from ${pp(b0.mae)} to ${pp(row.mae)} percentage points (${pEq(t.p_value)})${valPart}.`;
}

export function QuestionChapter({ p }: { p: ReportPayload }) {
  const val = p.splits.validation;
  const test = p.splits.test;
  const events = test ? totalEvents(test) : totalEvents(val);
  const train = val.regression.find((r) => r.family !== "b0")?.n_fit;
  const v0 = p.feature_sets.filter((f) => f.in_v0).length;
  const full = p.feature_sets.filter((f) => f.in_full).length;
  return (
    <Chapter id="question" title="The question and the test">
      <p className="body">
        Four times a year a company reports its earnings, and its share price often moves more on the next day than in the
        whole month before. Using only information available before the release, how well can that move be predicted, and is
        the prediction better than the stock&rsquo;s own history and the options market&rsquo;s implied move?
      </p>
      <ul className="hypotheses">
        <li><strong>H1.</strong> A model on pre-release features beats the baseline B0, the mean absolute move of the company&rsquo;s last 8 reports, on later years.</li>
        <li><strong>H2.</strong> Technology stocks move more and are harder to predict than other Nasdaq&#8209;100 stocks.</li>
        <li><strong>H3.</strong> Options imply larger moves than actually happen, except for AI-heavy companies (the live test, Nov&nbsp;4 to Dec&nbsp;10, 2026).</li>
      </ul>
      <p className="body">
        {events ? `The data set holds ${int(events.all)} earnings releases (${int(events.tech)} from technology stocks) of the 2026 Nasdaq‑100, 2004 to 2026, ` : "The data set holds the earnings releases of the 2026 Nasdaq‑100, 2004 to 2026, "}
        built from free sources: SEC filings for the release times, daily prices, filed fundamentals, and option chains the
        project recorded itself. The split is by time: models are fitted on 2004{"–"}21
        {train ? ` (${int(train)} reports)` : ""}, tuned on {years(val.years)} ({int(val.n)}), and scored once on the held-out
        {test ? ` ${years(test.years)} (${int(test.n)}), after refitting on everything before` : " test years, which have not been scored yet"}.
      </p>
      <p className="body">
        The question has two forms. The <em>size</em> of the move (absolute move, regression) is scored by mean absolute error.
        Whether the move is <em>big</em>, more than twice the stock&rsquo;s 20-day daily standard deviation (classification), is
        scored by accuracy, precision, recall and ROC-AUC. The v0 feature set holds {v0} history, volatility and release-timing
        features; the full set adds market, fundamentals, text and calendar features, {full} in all, each known at the last
        close before the release.
      </p>
    </Chapter>
  );
}

const METHODS: [string, string][] = [
  ["Cleaning, median imputation, percentile clipping, standardisation", "1, Data preparation"],
  ["Mean, standard deviation, MAE, R²", "2, Statistics"],
  ["k-nearest neighbours; validation split; confusion matrix, accuracy, precision, recall", "4, Supervised learning"],
  ["k-means and the elbow method", "5, Unsupervised learning"],
  ["Linear regression; paired and two-sample t-tests", "8, Linear functions, hypothesis testing"],
  ["Logistic (sigmoid) function; gradient descent", "9, Nonlinear functions"],
  ["Multi-layer perceptron", "10, Neural networks"],
  ["Gaussian naive Bayes", "11, Distributions, naive Bayes"],
  ["Principal component analysis", "12, Data reduction"],
  ["ROC curve and AUC", "Beyond the course"],
];

export function MethodsChapter() {
  return (
    <Chapter id="methods" title="Methods">
      <p className="body">
        Every method was taught in COMP&#8209;4112 except ROC-AUC, added on purpose because it compares classifiers without
        fixing a threshold. Every model sits in one scikit-learn pipeline, so clipping, imputation and scaling are learned from
        the training rows only. Hyperparameters and the best model in each family were chosen on validation; the test years
        were scored once.
      </p>
      <DataTable
        caption="Methods by course week"
        rows={METHODS}
        rowKey={(r) => r[0]}
        columns={[
          { head: "Method", cell: (r) => r[0] },
          { head: "Course week", cell: (r) => r[1] },
        ]}
      />
      <p className="body">
        H1 uses a two-sided paired t-test on the absolute errors of a model and B0 for the same reports; H2 uses an
        independent two-sample t-test with equal variances. Reports in the same quarter are not independent and many tests
        were run without adjustment, so every p-value here is exploratory, not confirmatory.
      </p>
    </Chapter>
  );
}

export function LimitsChapter() {
  return (
    <Chapter id="limits" title="Limits and the live test">
      <p className="body">
        The biggest limit is the information itself: the size of an earnings move depends on the results and guidance in the
        release, which no pre-release data can see, so the small gain on the test years may be close to the ceiling for free
        data. The universe is the 2026 Nasdaq&#8209;100, so companies that left the index earlier are missing (survivorship
        bias), which probably understates large moves. The SEC acceptance time stands in for the press-release time.
        Reports in the same week share market moves, so the t-tests overstate the effective sample size.
      </p>
      <p className="body">
        The third hypothesis is tested live: from Nov{NBSP}4 to Dec{NBSP}10, 2026 the project recorded option chains twice a
        day and committed a prediction before each report, so git timestamps prove it came first. About 35 reports make it a
        pilot. It is scored after Dec{NBSP}11 and its results will be added here then; the running scoreboard is on the
        project&rsquo;s dashboard.
      </p>
    </Chapter>
  );
}
