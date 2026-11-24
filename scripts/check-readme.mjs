#!/usr/bin/env node
// README checks: lowercase name and headings, image alt text and dark variants,
// self-contained SVGs, required brand assets, repo links, no social-proof badges.
// Usage: node scripts/check-readme.mjs   (exit 1 on any failure)
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";

const fails = [];
const fail = (ac, msg) => fails.push(`${msg}`);

if (!existsSync("README.md")) {
  console.error("FAIL: README.md missing");
  process.exit(1);
}
const md = readFileSync("README.md", "utf8");
const noUrls = md.replace(/https?:\/\/\S+/g, "");

// name always lowercase, headings lowercase (markdown and HTML <h1>-<h6>)
for (const h of md.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g) ?? [])
  if (h !== h.toLowerCase()) fail(3, `HTML heading not lowercase: ${h}`);
if (/Blackbelt|BLACKBELT/.test(noUrls)) fail(3, "capitalised product name outside a URL");
for (const h of md.match(/^#{1,6} .+$/gm) ?? [])
  if (h !== h.toLowerCase()) fail(3, `heading not lowercase: ${h}`);

// no template leftovers
if (md.includes("{{")) fail(9, "found '{{'");

// no blackbelt-ai, repo links point to thomas-moerman/blackbelt
if (/blackbelt-ai/i.test(md)) fail(18, "README mentions blackbelt-ai");
const ghLinks = md.match(/github\.com\/[\w.-]+\/blackbelt/g) ?? [];
for (const l of ghLinks) if (!l.endsWith("thomas-moerman/blackbelt")) fail(18, `wrong repo link ${l}`);

// no stars / trendshift / ranking badges before launch
if (/shields\.io\/github\/stars|trendshift|star-history/i.test(md)) fail(16, "social-proof badge present");

// every <img> has alt; every local image in a <picture> has a -dark source
const imgs = [...md.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
if (imgs.length === 0) fail(4, "no images in README");
for (const tag of imgs) {
  const alt = tag.match(/\balt="([^"]*)"/);
  if (!alt || !alt[1].trim()) fail(4, `img without alt: ${tag.slice(0, 80)}`);
}
for (const pic of md.match(/<picture>[\s\S]*?<\/picture>/g) ?? [])
  if (!/prefers-color-scheme:\s*dark/.test(pic) || !/-dark\.(svg|png)/.test(pic))
    fail(2, "picture without a dark source");
const localSrcs = [...md.matchAll(/(?:src|srcset)="(assets\/[^"]+)"/g)].map((m) => m[1]);
for (const s of localSrcs) if (!existsSync(s)) fail(4, `missing asset ${s}`);

// required brand assets exist
const required = [
  "belts-light.svg", "belts-dark.svg",
  "logo-light.svg", "logo-dark.svg", "sensei-mono.svg", "favicon.svg",
  "favicon-16.png", "favicon-32.png", "social-preview.png", "avatar.png",
  ...["white", "yellow", "green", "brown", "black"].flatMap((b) => [
    `sensei-${b}.svg`, `mark-${b}.svg`, `badge-${b}.svg`,
  ]),
];
for (const f of required) if (!existsSync(`assets/${f}`)) fail(14, `missing assets/${f}`);

// SVGs self-contained (no external refs, no live <text>) and < 150 KB
if (existsSync("assets"))
  for (const f of readdirSync("assets").filter((f) => f.endsWith(".svg"))) {
    const p = `assets/${f}`;
    const svg = readFileSync(p, "utf8");
    if (statSync(p).size > 150 * 1024) fail(5, `${p} over 150 KB`);
    if (/<text\b/.test(svg)) fail(5, `${p} has live <text> (outline it)`);
    if (/(?:href|src)="https?:/.test(svg) || /@import|url\(\s*['"]?https?:/.test(svg)) fail(5, `${p} has an external reference`);
    if (/blackbelt-ai/i.test(svg)) fail(18, `${p} mentions blackbelt-ai`);
  }

// social preview under 1 MB
if (existsSync("assets/social-preview.png") && statSync("assets/social-preview.png").size > 1024 * 1024)
  fail(11, "social-preview.png over 1 MB");

if (fails.length) {
  console.error(fails.map((f) => `FAIL ${f}`).join("\n"));
  console.error(`${fails.length} failure(s)`);
  process.exit(1);
}
console.log("check-readme: all checks passed");
