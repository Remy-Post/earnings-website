# Plan

Goal: a public report site at https://report.remypost.me that presents the project's findings to the
COMP-4112 grader, consistent with the written report (Google Doc), every number read from the API.

| # | Milestone | Done when | Status |
|---|---|---|---|
| M0 | Repository | Public repo `Remy-Post/earnings-website`, docs in place, `main` protected (pull requests + CI) | done 2026-11-27 |
| M1 | Scaffold and CI | Vite + React + TS, house tokens and fonts, fixture, data client; CI runs lint, typecheck, tests, build on every PR | in review: [#1](https://github.com/Remy-Post/earnings-website/pull/1) |
| M2 | Report content | Verdict-first single page: H1 forest plot (hero), robustness, technology split (H2), overfitting sweep, big-move classification, company profiles, methods and limits; every chart with a table view; phone first, both themes | in review: [#2](https://github.com/Remy-Post/earnings-website/pull/2) |
| M3 | Box and Caddy | `~/bin/publish-report`, `~/sites/report/{releases,current}`, `# BEGIN report` Caddy block after `# END earnings` (backed up, validated, reloaded) | done 2026-11-27 |
| M4 | Deploy workflow | `deploy.yml` on push to `main` ships `dist/` over SSH; proven by a real push | in review: [#3](https://github.com/Remy-Post/earnings-website/pull/3); needs the two secrets |
| M5 | Live data | `GET /api/v1/report` in data-science and its offline copy `/data/report.json`; site reads it in production | requested from data-science |
| M6 | DNS | `report` A record at Namecheap; Caddy certificate issued; `curl --resolve` check from the box passes | waiting on Remy |
| M7 | Live test chapter | After Dec 11: the H3 live-test results, once the API exposes them | later |

Out of scope here: any backend or data code (it belongs in Remy-Post/data-science).
