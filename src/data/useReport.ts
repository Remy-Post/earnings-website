import { useEffect, useState } from "react";
import { loadReport, type Loaded } from "./load";

export type ReportState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; loaded: Loaded };

/** Loads the report once. A failure keeps the room of the loading state (the page does not jump). */
export function useReport(): ReportState {
  const [state, setState] = useState<ReportState>({ status: "loading" });
  useEffect(() => {
    const ctl = new AbortController();
    loadReport(fetch, ctl.signal).then(
      (loaded) => { setState({ status: "ready", loaded }); },
      (err: unknown) => {
        if (ctl.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
      },
    );
    return () => { ctl.abort(); };
  }, []);
  return state;
}
