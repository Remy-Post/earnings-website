import { describe, expect, it } from "vitest";
import fixture from "../data/fixture.json";
import type { ReportPayload } from "../data/types";
import { chosen, h1Summary, h1Title, h2Tests, mlpSweep, modelLabel, pairedTest, robustnessFor, SAMPLE_VARIANTS, totalEvents } from "./report";

const p = fixture as unknown as ReportPayload;
const test = p.splits.test!;
const val = p.splits.validation;

describe("report derivations", () => {
  it("labels models the way the written report does", () => {
    expect(modelLabel({ model: "b0", family: "b0", feature_set: "history" })).toBe("B0, last‑8 mean");
    expect(modelLabel({ model: "linear_full+pca", family: "linear", feature_set: "full" })).toBe("Linear regression + PCA, full");
    expect(modelLabel({ model: "knn_clf_v0", family: "knn_clf", feature_set: "v0" })).toBe("k‑nearest neighbours, v0");
  });

  it("finds the chosen models", () => {
    expect(chosen(p)).toEqual({ regression: "linear_v0", classification: "logistic_v0" });
  });

  it("joins each model with its paired test and interval", () => {
    const t = pairedTest(test, "linear_v0")!;
    expect(t.p_value).toBeCloseTo(0.010049, 6);
    expect(t.ci95_low!).toBeLessThan(t.mean_diff!);
    expect(t.ci95_high!).toBeLessThan(0);
  });

  it("states the test-years finding: 6 of 7 better, the three linear models clearly", () => {
    const s = h1Summary(test);
    expect(s.total).toBe(7);
    expect(s.better.length).toBe(6);
    expect(s.clearlyBetter.map((r) => r.model)).toEqual(["linear_v0", "linear_full", "linear_full+pca"]);
    expect(h1Title(test, "test years")).toBe(
      "On the test years, 6 of 7 models beat B0 on average, and the three linear models by more than the noise",
    );
  });

  it("states the validation finding: none better, the full-feature network worse", () => {
    expect(h1Summary(val).clearlyWorse.map((r) => r.model)).toEqual(["mlp_full"]);
    expect(h1Title(val, "validation years")).toBe(
      "On the validation years, no model beat B0 by more than the noise; one model was clearly worse",
    );
  });

  it("reads robustness, H2 and the sweep", () => {
    const rows = robustnessFor(test, "linear_v0", SAMPLE_VARIANTS);
    expect(rows).toHaveLength(6);
    expect(Math.min(...rows.map((r) => -r.pct_mae_vs_b0!))).toBeCloseTo(2.59, 1);
    expect(h2Tests(test).b0Error!.mean_diff).toBeCloseTo(0.0115385, 6);
    expect(totalEvents(test)).toEqual({ tech: 2649, nonTech: 4369, all: 7018 });
    const full = mlpSweep(p).filter((g) => g.feature_set === "full").map((g) => [g.size, +(g.val_score * 100).toFixed(2)]);
    expect(full).toEqual([["(8)", 3.57], ["(16)", 3.65], ["(32, 16)", 4.52]]);
  });
});
