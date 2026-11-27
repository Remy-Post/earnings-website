import type { ReportPayload } from "./types";

/** Where the payload is read from, in order: the API on this origin, then the offline copy the project Mac
 *  pushes to the box (the API answers 502 while the Mac sleeps). */
export const SOURCES = ["/api/v1/report", "/data/report.json"] as const;

export type Loaded = { payload: ReportPayload; from: (typeof SOURCES)[number] };

const obj = (v: unknown): Record<string, unknown> | null =>
  typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;

/** The smallest check that a body is a report payload: the fields every chapter reads. */
export function isReport(body: unknown): body is ReportPayload {
  const b = obj(body);
  const splits = obj(b?.splits);
  const validation = obj(splits?.validation);
  const kmeans = obj(b?.kmeans);
  return (
    typeof b?.generated_at_utc === "string" &&
    Array.isArray(validation?.regression) &&
    Array.isArray(b.grid) &&
    Array.isArray(kmeans?.clusters)
  );
}

export async function loadReport(fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<Loaded> {
  let last: unknown = null;
  for (const url of SOURCES) {
    try {
      const res = await fetcher(url, { headers: { Accept: "application/json" }, signal });
      if (!res.ok) {
        last = new Error(`${url} answered ${res.status}`);
        continue;
      }
      const body: unknown = await res.json();
      if (isReport(body)) return { payload: body, from: url };
      last = new Error(`${url} did not return a report`);
    } catch (err) {
      if (signal?.aborted) throw err;
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("The report could not be loaded");
}
