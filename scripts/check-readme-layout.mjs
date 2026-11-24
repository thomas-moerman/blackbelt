#!/usr/bin/env node
// Rendered-layout check at phone width (375 px): nothing scrolls sideways, the belts section stays short.
// Usage: node scripts/check-readme-layout.mjs <rendered.html>   (from scripts/render-readme.sh)
// shortcut: Playwright is resolved from PLAYWRIGHT_MODULE or the npx cache; move to a devDependency when package.json exists (#3).
import { createRequire } from "node:module";
import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const html = resolve(process.argv[2] ?? "");
if (!existsSync(html)) { console.error("FAIL: rendered HTML not found; run scripts/render-readme.sh first"); process.exit(1); }
let mod = process.env.PLAYWRIGHT_MODULE;
if (!mod) {
  const base = `${process.env.HOME}/.npm/_npx`;
  for (const d of existsSync(base) ? readdirSync(base) : []) if (existsSync(`${base}/${d}/node_modules/playwright`)) mod = `${base}/${d}/node_modules/playwright`;
}
if (!mod) { console.error("FAIL: Playwright not found; set PLAYWRIGHT_MODULE"); process.exit(1); }
const { chromium } = createRequire(import.meta.url)(mod);

const fails = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto("file://" + html);
await page.waitForTimeout(500);
const r = await page.evaluate(() => {
  const over = [];
  document.querySelectorAll("article table, article pre").forEach((el) => {
    if (el.closest("details")) return; // collapsed text alternatives may scroll
    if (el.scrollWidth > el.clientWidth + 1) over.push(`${el.tagName} ${el.scrollWidth}>${el.clientWidth}: ${el.innerText.slice(0, 40).replace(/\n/g, " / ")}`);
  });
  const hs = [...document.querySelectorAll("article h2, article .markdown-heading h2")];
  const belts = hs.find((h) => /the belts/.test(h.textContent));
  let beltsH = 0;
  if (belts) {
    const next = hs[hs.indexOf(belts) + 1];
    const top = belts.getBoundingClientRect().top;
    const end = next ? next.getBoundingClientRect().top : document.body.scrollHeight;
    beltsH = Math.round(end - top);
  }
  return { over, docW: document.documentElement.scrollWidth, beltsH, hasBelts: !!belts };
});
await browser.close();

for (const o of r.over) fails.push(`block wider than the 375 px column: ${o}`);
if (r.docW > 375) fails.push(`page scrolls sideways (${r.docW}px)`);
if (!r.hasBelts) fails.push("no 'the belts' section found");
else if (r.beltsH >= 1200) fails.push(`belts section ${r.beltsH}px tall at 375 (want < 1200)`);

if (fails.length) { console.error(fails.map((f) => `FAIL ${f}`).join("\n")); console.error(`${fails.length} failure(s)`); process.exit(1); }
console.log(`check-readme-layout: all checks passed (belts ${r.beltsH}px)`);
