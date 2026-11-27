import { describe, expect, it } from "vitest";
import { absPct, auc, moment, pEq, pct, pp, pval, signedPct, signedPp, years } from "./format";

describe("format", () => {
  it("prints fractions of price as percentage points", () => {
    expect(pp(0.0403632)).toBe("4.04");
    expect(pp(0.0392431)).toBe("3.92");
    expect(pp(-0.00112008, 2)).toBe("−0.11");
    expect(pp(-0.00001, 2)).toBe("0.00");
  });
  it("prints percents with U+2212 and an explicit plus", () => {
    expect(signedPct(-2.775)).toBe("−2.8%");
    expect(signedPct(0.673195)).toBe("+0.7%");
    expect(signedPct(0)).toBe("0.0%");
    expect(absPct(-5.10522)).toBe("5.1%");
    expect(pct(0.643432)).toBe("64.3%");
    expect(signedPp(0.0106918)).toBe("+1.07");
  });
  it("prints p-values the way the written report does", () => {
    expect(pval(0.010049)).toBe("0.010");
    expect(pval(0.234055)).toBe("0.23");
    expect(pval(0.00349605)).toBe("0.003");
    expect(pval(1.5e-17)).toBe("< 0.001");
    expect(pEq(0.0147584)).toBe("p = 0.015");
  });
  it("prints AUC, spans and moments", () => {
    expect(auc(0.663067)).toBe("0.663");
    expect(years("2024-2026")).toBe("2024–26");
    expect(moment("2026-11-27T16:37:42Z")).toBe("Nov 27, 2026, 16:37 UTC");
  });
});
