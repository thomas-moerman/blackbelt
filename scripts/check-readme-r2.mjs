#!/usr/bin/env node
// README checks for the story and copy: before/after table, example data, pre-release line, links.
// Run together with check-readme.mjs.
import { readFileSync, existsSync } from "node:fs";

const md = readFileSync("README.md", "utf8");
const plain = md.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // markdown links -> their text
const lines = md.split("\n");
const fails = [];
const fail = (id, msg) => fails.push(`${id}: ${msg}`);

// Key copy
if (!md.includes("He watches. He trains. Nobody gets a belt for showing up.")) fail("copy", "tagline is not the training variant");
if (/He grades\./.test(md)) fail("copy", "old tagline 'He grades.' still present");
if (!md.includes("Four weeks of practice")) fail("copy", "punchline 'Four weeks of practice' missing");
if (!/blackbelt trains your AI agent on its own mistakes/.test(md)) fail("copy", "bold line does not say 'trains ... on its own mistakes'");
if (!plain.includes("he'll be ready when he's ready. watch the repo to know first.")) fail("copy", "pre-release footnote missing");

// before/after block lines <= 34 chars (311 px phone column), labels on their own lines
// the story is an HTML table; each visual line <= 34 chars
const table = (md.match(/<table\b[\s\S]*?<\/table>/g) ?? []).find((b) => /week 0/.test(b));
if (!table) fail("readme", "no week 0 / week 4 table");
else for (const cell of table.split(/<\/t[hd]>/))
  for (const l of cell.split(/<br\s*\/?>/).map((s) => s.replace(/<[^>]+>/g, "").trim()).filter(Boolean))
    if (l.length > 34) fail("readme", `line over 34 chars: "${l}"`);

// Consent wording must match the decision (one manifest per run), not per item
if (/item by item/i.test(md)) fail("consent", "README promises item-by-item consent; decision is one manifest per run");
if (!md.includes("hire for docs and tests")) fail("readme", "verdict 'hire for docs and tests' missing");

// one example dataset
for (const s of ["green belt · docs and tests", "11.2%", "7 of 23", "252"])
  if (!md.includes(s)) fail("readme", `example value missing: ${s}`);

// pre-release on first screen, no install <details>
if (!/pre-release/i.test(lines.slice(0, 40).join("\n"))) fail("readme", "first screen does not say pre-release");
for (const d of md.match(/<details>[\s\S]*?<\/details>/g) ?? [])
  if (/npm install|plugin (install|marketplace)/.test(d)) fail("readme", "install <details> block present");
if (!/0\.1 \(in progress\)/.test(md)) fail("readme", "nothing marked '0.1 (in progress)'");

// every relative link target exists
const rel = [...md.matchAll(/\]\((?!https?:|#|mailto:)([^)\s]+)\)|href="(?!https?:|#|mailto:)([^"]+)"/g)]
  .map((m) => (m[1] ?? m[2]).replace(/^\.\//, "").split("#")[0]).filter(Boolean);
for (const r of rel) if (!existsSync(r)) fail("readme", `relative link to missing file: ${r}`);

// coach story, intake wording, no neighbour named
if (!/intake/i.test(md)) fail("readme", "report card not called the intake");
if (!/how he trains/i.test(md)) fail("readme", "no 'how he trains' section");
if (/AgentLint|CodeBurn|\/insights/.test(md)) fail("readme", "a neighbouring product is named");

// roadmap lists the four releases
for (const v of ["0.1", "0.2", "0.3", "0.4"]) if (!md.includes(v)) fail("readme", `roadmap misses ${v}`);

if (fails.length) {
  console.error(fails.map((f) => `FAIL ${f}`).join("\n"));
  console.error(`${fails.length} failure(s)`);
  process.exit(1);
}
console.log("check-readme-r2: all checks passed");
