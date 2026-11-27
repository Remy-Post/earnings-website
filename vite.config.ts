import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// In development the report payload comes from the local fixture (a copy of the API's answer), unless API
// points at a running data-science API, which is then proxied. Production never sees the fixture: it calls
// /api/v1/report on its own origin (DECISIONS.md, D3).
const api = process.env.API;

function fixtureApi(): Plugin {
  return {
    name: "fixture-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/v1/report", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(readFileSync(new URL("./src/data/fixture.json", import.meta.url)));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ...(api ? [] : [fixtureApi()])],
  server: api ? { proxy: { "/api": { target: api, changeOrigin: true } } } : {},
  build: { target: "es2023", sourcemap: false },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    css: false,
  },
});
