import { describe, expect, it } from "vitest";
import { ticks, xScale } from "./scale";

describe("xScale", () => {
  it("places known values on the pixel range", () => {
    const s = xScale([-0.2, 0.1], [0, 300], { include: [0] });
    expect(s.domain()).toEqual([-0.2, 0.1]);
    expect(s(0)).toBeCloseTo(200);
    expect(s(-0.2)).toBe(0);
    expect(s(0.1)).toBe(300);
  });
  it("starts a magnitude axis at zero when asked", () => {
    const s = xScale([3.3, 4.5], [0, 100], { include: [0] });
    expect(s.domain()[0]).toBe(0);
    expect(s(0)).toBe(0);
  });
  it("keeps a fixed domain as given", () => {
    const s = xScale([0.6], [0, 250], { fixed: [0.5, 0.75] });
    expect(s(0.5)).toBe(0);
    expect(s(0.625)).toBeCloseTo(125);
  });
  it("returns three to five ticks", () => {
    for (const d of [[0, 1], [-0.27, 0.11], [0, 9.4], [0.5, 0.75]] as [number, number][]) {
      const n = ticks(xScale(d, [0, 300])).length;
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
  });
});

import { lanes } from "./DotRows";

describe("lanes", () => {
  it("keeps separate marks on the line and moves overlapping ones to alternating lanes", () => {
    expect(lanes([0, 100, 200], 9)).toEqual([0, 0, 0]);
    expect(lanes([0, 3, 6, 50], 9)).toEqual([0, -1, 1, 0]);
  });
});
