// Screenshots of the page at the widths DESIGN.md section 11 lists, in both themes, against the fixture
// (a Vite dev server started in-process). Also fails on horizontal overflow and runs axe on each width.
// Usage: npm run shots [-- 390 1440]   -> .shots/<width>-<theme>.png
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createServer } from "vite";

const widths = process.argv.slice(2).map(Number).filter(Boolean);
const WIDTHS = widths.length ? widths : [320, 360, 390, 768, 1024, 1440, 1920];
mkdirSync(".shots", { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();
let failed = false;
try {
  for (const theme of ["light", "dark"]) {
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme });
      const page = await ctx.newPage();
      await page.goto("http://localhost:5199/", { waitUntil: "networkidle" });
      await page.waitForSelector(".chapter");
      await page.evaluate(() => document.fonts.ready);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (over > 0) { console.error(`FAIL ${w}px ${theme}: page overflows by ${over}px`); failed = true; }
      if (theme === "light") {
        const axe = await new AxeBuilder({ page }).analyze();
        for (const v of axe.violations) { console.error(`AXE ${w}px ${v.id}: ${v.help} (${v.nodes.length})`); failed = true; }
      }
      await page.screenshot({ path: `.shots/${w}-${theme}.png`, fullPage: true });
      // Readable slices of the full page, one per 1600px of height.
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0, i = 0; y < h; y += 1600, i++) {
        await page.screenshot({ path: `.shots/${w}-${theme}-${i}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(1600, h - y) } });
      }
      await ctx.close();
      console.log(`ok ${w}px ${theme}`);
    }
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
