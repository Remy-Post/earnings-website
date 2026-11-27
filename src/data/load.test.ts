import { describe, expect, it, vi } from "vitest";
import fixture from "./fixture.json";
import { isReport, loadReport, SOURCES } from "./load";

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe("loadReport", () => {
  it("accepts the fixture as a report", () => {
    expect(isReport(fixture as unknown)).toBe(true);
    expect(isReport({})).toBe(false);
    expect(isReport(null)).toBe(false);
  });

  it("reads the API first", async () => {
    const f = vi.fn(() => Promise.resolve(ok(fixture)));
    const got = await loadReport(f);
    expect(got.from).toBe(SOURCES[0]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("falls back to the offline copy when the API answers 502", async () => {
    const f = vi.fn((url: string) =>
      Promise.resolve(url === SOURCES[0] ? new Response("", { status: 502 }) : ok(fixture)),
    );
    const got = await loadReport(f as unknown as typeof fetch);
    expect(got.from).toBe(SOURCES[1]);
  });

  it("fails with a reason when neither answers with a report", async () => {
    const f = vi.fn(() => Promise.resolve(ok({ nope: true })));
    await expect(loadReport(f as unknown as typeof fetch)).rejects.toThrow("did not return a report");
  });
});
