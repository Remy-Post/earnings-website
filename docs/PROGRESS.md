# Progress

Newest first. Times are dates in Eastern time.

## 2026-11-27
- `GET /api/v1/report` built in Remy-Post/data-science#27 with the requested shape (plus `frozen_for_live_test`
  on regression rows). Its offline copy is `/data/v1/report.json` (written by `app.api.publish`, carried by the
  existing `sync.sh`), so the site's fallback and the Caddy rule now point there; Caddy block reinstalled.
- Created the public repository Remy-Post/earnings-website (name chosen by Remy), merge commits only,
  branches deleted on merge, `main` protected (pull request and the `checks` CI job required).
  Pull requests, stacked: [#1 scaffold](https://github.com/Remy-Post/earnings-website/pull/1),
  [#2 report](https://github.com/Remy-Post/earnings-website/pull/2),
  [#3 deploy](https://github.com/Remy-Post/earnings-website/pull/3); CI green on all three.
- Box (branch `deploy`): `deploy/install-box.sh` installed `~/bin/publish-report` and the `# BEGIN report`
  Caddy block right after `# END earnings` (backup `Caddyfile.bak-report-20261127-172249`, validated, reloaded;
  a guard refuses any edit outside the block). A test upload published release `20261127-172305`.
  Caddy cannot get a certificate until the `report` DNS record exists (NXDOMAIN at Let's Encrypt).
- Deploy workflow `deploy.yml`: on push to `main`, `npm run check`, then `tar | ssh ~/bin/publish-report`
  with `OCI_SSH_KEY` and a pinned `OCI_KNOWN_HOSTS`, then a check that the site serves the new build.
- Report content (branch `report-content`): verdict-first single page with the H1 interval chart as the
  opening figure (test and validation), robustness checks, technology split (H2), the neural-network sweep,
  big-move classification (AUC and confusion counts), k-means company profiles, methods by course week, limits.
  Titles and prose numbers are computed from the payload. Checked with `npm run shots`: no overflow and no
  axe violations at 320, 360, 390, 768, 1024, 1440 and 1920 px in light and dark.
- Scaffold (branch `scaffold`): Vite 8, React 19, TypeScript 6, house tokens and fonts, report loader
  with offline fallback, CI (lint, typecheck, tests, build, dist check).
- Created the repository with the four tracking documents (this commit).
- Requested `GET /api/v1/report` (and its offline copy) from the data-science sessions; fields in
  `docs/DECISIONS.md` (D5).
- Built the fixture `src/data/fixture.json` from `reports/tables/*.csv` at data-science commit c8bbe74
  (validation 2022-23 and the one-time held-out test 2024-26 run on 2026-11-27).
