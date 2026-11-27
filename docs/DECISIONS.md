# Decisions

Each entry: the choice, then why. Newest decisions are added at the end.

## D1. Stack: Vite + React + TypeScript, plain CSS, d3-scale
- The house site (earnings.remypost.me, `app/web` in data-science) is Vite + React + TS. Same toolchain,
  same versions where the packages overlap, so one mental model covers both.
- One page, so no router and no query library: a single `fetch` with a fallback is enough.
- Plain CSS with custom properties instead of Tailwind: the page has one layout and a handful of
  components; tokens on `:root` are all the system it needs.
- Charts are hand-drawn SVG positioned by `d3-scale` (a small, standard scale library), so every mark is
  placed by a unit-tested scale (DESIGN.md section 6, accuracy). No chart framework: the forms here
  (dot-and-interval, dot strip, small line) are a few dozen lines each.
- TypeScript 6 for both `tsc` and `typescript-eslint` (the house app runs TS 7 with a TS 6 shim for
  linting; one version is simpler for a new repo).

## D2. Design source: data-science `app/web/DESIGN.md`
Typography (Source Serif 4, Hanken Grotesk, JetBrains Mono for tickers only), colour tokens (Porcelain
light, Vault dark), rem type and spacing scales, 45rem plate, phone first, verdict first, charts accurate
before pretty. The tokens file is copied from the house app unchanged.

**The one bold thing** for this report: the opening figure is the verdict itself, a dot-and-interval
chart of every regression model's error change against the baseline B0 on the held-out test years,
with 95% confidence intervals around a zero line. Everything around it stays quiet.

Entity colours follow the house rule: B0 is blue (circle) and linear_v0, the model frozen for the live
test, is vermillion (square). Other models are neutral ink. No other hues, so nothing depends on hue alone.

## D3. Data only from the backend
Rule from Remy: this repository holds frontend resources only. The site fetches `GET /api/v1/report`
same-origin; if that fails (the API runs on the project Mac and answers 502 while it sleeps) it reads the
offline copy `/data/v1/report.json`. The fixture in `src/data/fixture.json` is used by `npm run dev` and
the tests only and is never imported by production code (a test checks the built bundle for it).

Prose numbers are computed from the payload by small formatters, so the text can never disagree with
the tables.

## D4. Statistics wording
Methods were trimmed to the course topics: no multiple-testing adjustment, no effect sizes, no RMSE.
Every p-value on the site is the unadjusted two-sided p from the project's tables and is labelled
exploratory, as in the written report. ROC-AUC is the one method beyond the course and is labelled so.
95% confidence intervals of paired differences are derived from mean difference, t statistic and n
(Student t, n - 1 degrees of freedom), the same derivation as the house API's `ci95_low/high`.

## D5. Requested endpoint `GET /api/v1/report`
Shape (fractions of price, every field present, nullable where noted). Full text in the shared notes
(`report-site-endpoint.md`) and mirrored by `src/data/types.ts`:
- `generated_at_utc`, `source`, `data_as_of`, `run` (test run log, nullable)
- `splits.validation` and `splits.test` (nullable): `years`, `n`, `regression[]`, `classification[]`
  (with confusion counts), `tests[]` (with `ci95_low/high`), `robustness[]`
- `grid[]` (validation tuning grid), `kmeans` (`clusters`, `elbow`, `companies`), `feature_sets[]`,
  `selected` (selected specs)

## D6. Hosting: Caddy block on the Oracle box, static releases
- `~/sites/report/releases/<UTC time>` with a relative `current` symlink, five kept: the same layout as
  `~/sites/earnings` and `~/sites/remypost`, so rollback is one `ln`.
- The box's `~/bin/publish-report` reads a gzipped tarball on stdin (tar over SSH), refuses an upload
  without `index.html`, and repoints `current` atomically.
- Caddy serves the release with the house security headers and a strict CSP, and proxies exactly
  `GET|HEAD /api/v1/report` to `earnings-relay:8765` (same backend as earnings.remypost.me), plus
  `/data/v1/report.json` from the earnings offline-copy folder. Nothing else under `/api` is reachable from
  this host: earnings.remypost.me was made tailnet-only on 2026-11-27, and the report needs one read.

## D7. Deploy key: reuse `~/.ssh/oci_n8n` (Remy's choice)
Remy chose to reuse the existing box key as the `OCI_SSH_KEY` secret, with `OCI_KNOWN_HOSTS` pinned.
The workflow always runs the single command `~/bin/publish-report`, so it also works unchanged with a
dedicated key restricted by `restrict,command="/home/ubuntu/bin/publish-report"` in
`~/.ssh/authorized_keys`, the pattern the box already uses for remypost.me and specs. That is the
safer option if the shared key is ever rotated.

## D8. Repository workflow
`main` is protected: changes land through pull requests with the `checks` CI job passing, merged by
Remy with merge commits. One pull request per piece of work. No attribution or model names in commit
messages or pull request bodies.
