#!/usr/bin/env node
// README checks for the first screen: text-first, copyable install command, linked badges, logo only.
import { readFileSync, existsSync } from "node:fs";

const md = readFileSync("README.md", "utf8");
const first = md.split(/^## /m)[0]; // everything before the first "## " heading
const fails = [];
const fail = (id, msg) => fails.push(`${id}: ${msg}`);

// the command is a fenced code block on the first screen (GitHub copy button)
if (!/```(?:bash|sh|shell)?\nnpx blackbelt report\n```/.test(first)) fail("readme", "no fenced `npx blackbelt report` block before the first ## heading");

// key copy is rendered text, not only alt text
const noAlt = md.replace(/\balt="[^"]*"/g, "");
for (const s of ["your agent is not a black belt. yet.", "He watches. He trains. Nobody gets a belt for showing up.",
  "blackbelt trains your AI agent on its own mistakes", "Same agent. Four weeks of practice."])
  if (!noAlt.includes(s)) fail("readme", `not present as text outside alt: "${s}"`);
if (!/<h1[^>]*>\s*your agent is not a black belt\. yet\.\s*<\/h1>|^# your agent is not a black belt\. yet\.$/m.test(first)) fail("readme", "headline is not an h1 on the first screen");

// pre-release stated exactly once on the first screen (badge text excluded)
const firstText = first.replace(/<img\b[^>]*>/g, "");
const n = (firstText.match(/pre-release/gi) ?? []).length;
if (n !== 1) fail("readme", `"pre-release" appears ${n}x on the first screen (want 1)`);

// no crew-internal notes on the public page
for (const s of ["Transcription rule", "Figma", "T-5", "ADR-0002 §"]) if (md.includes(s)) fail("readme", `internal note in README: "${s}"`);

// every badge image is wrapped in a link (no raw-image tap targets)
for (const m of first.matchAll(/<img\b[^>]*shields\.io[^>]*>/g)) {
  const before = first.slice(0, m.index);
  if (before.lastIndexOf("<a ") <= before.lastIndexOf("</a>")) fail("readme", `badge not inside a link: ${m[0].slice(0, 70)}`);
}

// hero image retired; the logo is the only non-badge image on the first screen
for (const f of ["assets/hero-light.svg", "assets/hero-dark.svg"]) if (existsSync(f)) fail("readme", `${f} still present`);
if (/hero-(light|dark)\.svg/.test(md)) fail("readme", "README references the retired hero image");
const imgs = [...first.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/shields\.io/.test(s));
if (imgs.some((s) => !/logo-(light|dark)\.(svg|png)/.test(s))) fail("readme", `non-logo image on first screen: ${imgs.join(", ")}`);

if (fails.length) {
  console.error(fails.map((f) => `FAIL ${f}`).join("\n"));
  console.error(`${fails.length} failure(s)`);
  process.exit(1);
}
console.log("check-readme-r3: all checks passed");
