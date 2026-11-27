# earnings-website

The web report of the COMP-4112 (Introduction to Data Science) term project *Can free data predict
earnings-day stock moves?*, served at **https://report.remypost.me**.

This repository holds the **frontend only**: a static site (Vite, React, TypeScript). Every number it
shows comes from the project's read-only API in
[Remy-Post/data-science](https://github.com/Remy-Post/data-science) (`GET /api/v1/report`), which the
site calls on its own origin. No data, model or backend code lives here; `src/data/fixture.json` is a copy
of that payload used for local development and tests only, and is not shipped in the build.

## Develop

```bash
npm ci
npm run dev        # http://localhost:5173, /api/v1/report answered from the fixture
API=http://127.0.0.1:8765 npm run dev   # or proxy /api to a running data-science API
npm run check      # lint, typecheck, tests, build: what CI runs
```

Node 26 (see `.nvmrc`).

## How changes ship

1. A feature branch and one pull request per piece of work. CI (`.github/workflows/ci.yml`) runs lint,
   typecheck, tests and the build on every pull request.
2. Remy reviews and merges with a merge commit. `main` only moves through pull requests.
3. Every push to `main` runs `.github/workflows/deploy.yml`: the same checks, then the built `dist/` is
   streamed as a tarball over SSH to the Oracle box, where `~/bin/publish-report` unpacks it into
   `~/sites/report/releases/<UTC time>` and repoints `~/sites/report/current`. Five releases are kept.

Rollback on the box: `ln -sfn releases/<name> ~/sites/report/current.tmp && mv -Tf ~/sites/report/current.tmp ~/sites/report/current`.

Caddy (`~/n8n/caddy/Caddyfile`, block `# BEGIN report`) serves the release and proxies only
`GET /api/v1/report` to the same API as earnings.remypost.me. The block is kept in `deploy/report.caddy`.

## Docs

- [docs/PLAN.md](docs/PLAN.md): milestones
- [docs/PROGRESS.md](docs/PROGRESS.md): dated log with pull request links
- [docs/DECISIONS.md](docs/DECISIONS.md): stack and design choices with reasons
