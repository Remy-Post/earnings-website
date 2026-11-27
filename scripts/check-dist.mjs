// Checks the production build: the fixture is not shipped (data comes only from the API, DECISIONS.md D3),
// and first-load JavaScript stays under 180 kB gzip (DESIGN.md section 11).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const dist = new URL("../dist/", import.meta.url).pathname;
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(dist);

let failed = false;
const fail = (msg) => { console.error(`FAIL ${msg}`); failed = true; };

// A string that only the fixture holds (its generation time); it must not appear in any shipped file.
const marker = JSON.parse(readFileSync(new URL("../src/data/fixture.json", import.meta.url))).generated_at_utc;
for (const f of files) {
  if (/\.(js|html|json|css)$/.test(f) && readFileSync(f, "utf8").includes(marker)) fail(`fixture data shipped in ${f}`);
}

const js = files.filter((f) => f.endsWith(".js") && f.includes("/assets/"));
const gz = js.reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0);
console.log(`first-load JS: ${(gz / 1024).toFixed(1)} kB gzip in ${js.length} file(s)`);
if (gz > 180 * 1024) fail("first-load JS over 180 kB gzip");
if (!files.some((f) => f.endsWith("index.html"))) fail("no index.html");

process.exit(failed ? 1 : 0);
