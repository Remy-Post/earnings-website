import type { ReportState } from "../data/useReport";

export function Footer({ state }: { state: ReportState }) {
  const from = state.status === "ready" ? state.loaded.from : null;
  return (
    <footer className="footer">
      <p>
        COMP&#8209;4112 Introduction to Data Science, term project by Remy Post, Lakehead University. Code and data:{" "}
        <a href="https://github.com/Remy-Post/data-science">Remy-Post/data-science</a>; this site:{" "}
        <a href="https://github.com/Remy-Post/earnings-website">Remy-Post/earnings-website</a>.
      </p>
      {from && (
        <p className="footer-source">
          Numbers from {from === "/api/v1/report" ? "the project’s API" : "the API’s last offline copy"}.
        </p>
      )}
    </footer>
  );
}
