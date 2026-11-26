# ADR-0001: Core architecture of the coach

- Status: Accepted (2026-11-24)
- Date: 2026-11-24
- Amended: 2026-11-26 (citations scoped, foundations reworded; #23).
- Related: `docs/research/ingest-formats.md` (transcript and trace formats).
- Supersedes: none (first ADR).

Naming. The product is "the coach". Its command is `blackbelt`. Its home is `~/.blackbelt/` (it renames with the product), overridable with `BLACKBELT_HOME`. The "coached setup" is whatever agents the user runs. A "setup" is one detected source: an adapter plus a root.

Research cited:
- R-FMT: `docs/research/ingest-formats.md`. (checked 2026-11-26 for the claims cited here; its own sources dated 2026-11-24)
- R-GG: "Who Grades the Grader? Co-Evolving Evaluation Metrics and Skills for Self-Improving LLM Agents", [arXiv 2607.12790](https://arxiv.org/abs/2607.12790) (v2, 2026-07-30). In one ablation (report generation, three seeds, one model family: Claude), removing the anchor guards that tie metric selection to a ten-item anchor collapsed the evolved grader into one that passed almost everything. Not a claim about evolved graders in general. (checked 2026-11-26)
- R-RRSI: "RRSI: Regularized Recursive Self-Improvement of Agent Harnesses", [arXiv 2609.24972](https://arxiv.org/abs/2609.24972) (v3, 2026-10-04). Estimates a noise band from repeated runs of the unchanged base, screens diffs with an LLM leakage critic and gates cost against score gain; its paired task-level bootstrap reports final gains and does not accept edits. (checked 2026-11-26)
- R-NOISE: "On Randomness in Agentic Evals", [arXiv 2602.07150](https://arxiv.org/abs/2602.07150) (v3, 2026-03-25). Single-run pass@1 on SWE-bench Verified (500 tasks) ranged over 2.2 to 6.0 points across 10 runs of each of 12 configurations (three open models, two scaffolds, two temperatures). That noise is larger with a few dozen drills is our inference, not the paper's result. (checked 2026-11-26)
- R-ACE: "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models", [arXiv 2510.04618](https://arxiv.org/abs/2510.04618) (v3, 2026-03-29; ICLR 2026). Itemised context, delta updates merged by non-LLM logic, per-item helpful/harmful counters; no full rewrites. (checked 2026-11-26)
- R-SEAL: "Self-Authored Verification Is Unreliable in Heuristic Self-Improving Agents", [arXiv 2607.24300](https://arxiv.org/abs/2607.24300) (v1, 2026-07-27). On Atari policy programs (not coding), a hidden audit the agent cannot author or inspect, returning only accept or reject, mostly beat unprotected self-testing. A variant that showed numeric audit scores after a rejection did no better, and mostly worse, than accept/reject only. Leakage through repeated accept/reject answers is not analysed; see R-HOLD. (checked 2026-11-26)
- R-CHK: "Do They Do as They Are Told? Investigating Coding Agents' Adherence to Explicit Instructions in Context Files", [arXiv 2611.13709](https://arxiv.org/abs/2611.13709) (v1, 2026-11-10). In a manual sample, 71% (67/94) of generated rule-checker scripts that had already passed automated fixture and agreement filters implemented their instruction correctly (one rater, a 14B open model as generator). (checked 2026-11-26)
- R-LING: Liu, Zhang, Choi, "User Feedback in Human-LLM Dialogues: A Lens to Understand Users But Noisy as a Learning Signal", EMNLP 2025, [arXiv 2507.23158](https://arxiv.org/abs/2507.23158) (v2, 2025-10-04). GPT-4o-mini detecting implicit user feedback (positive or negative) in general chat logs reached 81% binary accuracy on a sparse set and 42% on densely annotated conversations; coding-agent corrections were not tested. (checked 2026-11-26)
- R-HOLD: Dwork et al., "The reusable holdout: Preserving validity in adaptive data analysis", Science 349(6248), 2015, https://doi.org/10.1126/science.aaa9375; companion by the same authors, "Generalization in Adaptive Data Analysis and Holdout Reuse", [arXiv 1506.02629](https://arxiv.org/abs/1506.02629) (v2, 2015-09-25; NeurIPS 2015). Adaptive reuse can overfit a holdout, and limiting what each answer reveals slows this. (checked 2026-11-26: Science paper abstract only; companion read in full)
- Argyris, C. & Schön, D. A., Organizational Learning: A Theory of Action Perspective (Addison-Wesley, 1978). A standard reference for double-loop learning, used here as inspiration. (checked 2026-11-26: catalogue record only; text not read)

## 1. Context

The coach is an open-source tool that measures agent systems and improves them with a loop inspired by Argyris & Schön's double-loop learning. It challenges the target itself (evals, rules, roles, the bar), not only the output against it. It grants autonomy on evidence. It must work for any agent setup: the core assumes no roles, no flow and no file layout, and each setup plugs in through adapters.

It ships as a Claude Code plugin around a small harness-agnostic core (plain files plus a CLI), in TypeScript, run via npx. Statistics and the report card are deterministic code. LangGraph.js is used only for the periodic cycle.

The first 60 seconds are a zero-setup `npx` report card built from transcripts that already exist. Everything is local by default, and the share page holds aggregates only.

The v1 blocks, in order, are:
1. the report card;
2. rule fitness: (a) never-fired rules, (b) no-measurable-effect by group ablation;
3. the blind hiring test;
4. the foundation challenge.

Transcript formats are undocumented and change per version. Claude Code deletes transcripts after 30 days by default. The known correction markers also appear falsely on transport loss, `-p` runs and SIGTERM (R-FMT).

## 2. Decision drivers

1. **Setup-agnostic by construction.** No role, flow or layout appears in core types or core logic, and a test enforces this.
2. **Honest measurement.** What a setup cannot measure shows as "not measurable on this setup", never as zero. Every number carries its n, its interval and the version of the detector that produced it.
3. **Privacy by construction (data rules).** The coach is local only. Content leaves the machine only with explicit consent. Share output is aggregates-only by type, not by convention.
4. **First 60 seconds.** No setup, no network, no cost.
5. **Deterministic wherever the answer should be the same twice.** This covers statistics, the report, gates, the ledger and memory merges.
6. **Tested before applied, and reversible always.**
7. **The smallest system that ships the v1 blocks in order.** Contracts for later phases are fixed now so those phases need no redesign. Their implementation is deferred.

All options are costed on complexity, cost per run and per month, security and data protection, operations, latency, and how hard they are to reverse. Prices are estimates until checked.

## 3. Decisions

### 3.1 Canonical event model and adapter contract

**Options**

- **A. OpenTelemetry GenAI semantic conventions as the internal model.**
  - Benefits: a standard, and frameworks already emit it.
  - Costs: the spec is still in Development status. It has no concept of a human turn, a correction or rule provenance, and content is usually off (R-FMT). We would need private extensions anyway and would inherit spec churn.
  - Complexity: medium. Cost: 0.
  - Reversal: hard, because every metric would be keyed to it.
- **B. An own minimal canonical model, versioned, with OTLP-JSON as one import adapter.**
  - Benefits: it carries exactly what correction, rule and autonomy metrics need.
  - Costs: we maintain a schema, a published JSON Schema, and one mapping per adapter.
  - Complexity: medium. Cost: 0.
  - Reversal: medium, because the schema carries a version.
- **C. No canonical model; metrics per harness.**
  - Costs: N×M code, and it breaks setup-agnosticism.
  - Rejected.

**Decision: B.**

**Canonical event, schema v1.** Defined in `src/core/event.ts`. A JSON Schema is published at `schema/event.v1.json`.

```ts
type Actor = "human" | "agent" | "tool" | "system" | "unknown";
type EventKind =
  | "session_start" | "session_end"
  | "message"          // a text turn by a human or an agent
  | "tool_call" | "tool_result"
  | "interrupt"        // raw marker: a human stopped the agent (correction-ness is decided later, 3.2)
  | "tool_rejection"   // raw marker: a human declined a proposed tool call
  | "delegation"       // an agent started another agent or session
  | "rule_load"        // a rule, skill or instruction entered context, with its evidence
  | "usage"            // tokens and cost for one model call
  | "error"
  | "outcome";         // a world signal seen in the source (commit, revert, CI)

interface CoachEvent {
  schema: 1;
  id: string;            // first 32 hex of sha256(adapter.id \0 raw_ref.unit \0 raw_ref.locator); stable on re-ingest
  adapter: { id: string; version: string };
  format: { name: string; version: string; tested: boolean }; // version as read from the source, or "unknown"
  setup: string;         // sha256(adapter.id + root), first 16 hex
  session: string;       // "<adapter.id>:<native session id>"
  agent: { id: string; label?: string };  // opaque; label is display and grouping only, never logic
  parent?: { session?: string; agent?: string; event?: string }; // delegation edge
  actor: Actor;
  kind: EventKind;
  ts: string;            // ISO-8601 UTC with ms
  ts_quality: "exact" | "inferred";
  raw_ref: { unit: string; locator: string; sha256: string }; // file path or db key; line, offset or span id; hash of the raw record
  text?: { sha256: string; chars: number };  // a pointer only; text is never stored (3.4)
  attrs: KindAttrs;      // typed per kind, see below
}
```

`attrs` per kind:

| Kind | Fields |
|---|---|
| `session_start` | `interactive: boolean \| "unknown"`, `entrypoint?`, `harness_version?` |
| `session_end` | `end_reason: "normal" \| "killed" \| "unknown"` |
| `tool_call` | `call_id`, `tool`, `tool_class: "read" \| "write" \| "exec" \| "net" \| "agent" \| "other"`, `paths?: string[]`, `cmd_head?: string` (first token only; never the full command, which may hold secrets) |
| `tool_result` | `call_id`, `status: "ok" \| "error" \| "rejected"` |
| `interrupt`, `tool_rejection` | `marker` (the raw marker kind), `call_id?` |
| `delegation` | `child_session?`, `child_agent`, `via_call_id?` |
| `rule_load` | `path`, `evidence: "load_event" \| "attribution"` |
| `usage` | `model`, `input_tokens`, `output_tokens`, `cache_read?`, `cache_write?`, `cost_usd?` |
| `error` | `class` |
| `outcome` | `type: "commit" \| "revert" \| "ci" \| "incident"`, `ref` |

Rules of the model:

1. **Roles are data, never logic.** Claude Code's `agentType`, a framework's agent name, or a crew's "worker" all land in `agent.label`. Core code may group by label but never branches on its value. CI runs a test that fails if `src/core/` or `src/stats/` contains role or flow identifiers (`planner`, `worker`, `reviewer`, `crew`, and similar). This ratchet enforces setup-agnosticism.
2. **Actor classification belongs to the adapter.** When the adapter is unsure, it emits `actor: "unknown"`. Metrics ignore `unknown` and report its share.
   - In Claude Code, `type: "user"` lines that carry tool results are `actor: "tool"`.
   - Hook-injected or system-reminder content is `system`.
   - Slash-command expansions are `human` with `attrs.via = "command"`.
3. **Derived facts are not events.** Corrections, clusters and rule firings are Findings. Each Finding names its detector id and version, its layer, and the source event ids. Re-running a newer detector never rewrites events.
4. **Format-version tag.** Every event carries `format.version` as read from the source, and `format.tested` is true only when a synthetic fixture covers that version. An untested version parses best-effort and puts a banner on the report: "parsed with an untested format version X".

**Adapter contract.** Built-in adapters implement it in-process.

```ts
interface Adapter {
  id: string; version: string;
  detect(ctx: DetectContext): Promise<Detection[]>;          // stat + sample first lines only; never full reads; never network
  units(d: Detection, since?: Date): AsyncIterable<SourceUnit>;  // file/db unit + size, mtime, prefix sha256
  parse(u: SourceUnit): AsyncIterable<CoachEvent | ParseIssue>;  // streaming, never throws on bad lines
  capabilities(d: Detection): Capabilities;
  readText?(ref: RawRef): Promise<string | null>;            // on-demand text; null once the source is gone
  run?: Runner;          // Phase 2: run a task headlessly in an isolated workspace and config dir
  guard?: Guard;         // Phase 2: install or verify a harness wall around BLACKBELT_HOME
  actuator?: Actuator;   // Phase 4: apply or revert a patch to the setup's rule/config files
}
type Level = "full" | "partial" | "none";
type Capability = "human_turns" | "interrupts" | "tool_rejections" | "tool_calls" | "tool_paths"
  | "delegation" | "rule_load_events" | "usage" | "timestamps" | "interactive_flag" | "outcomes" | "text";
type Capabilities = Record<Capability, { level: Level; note?: string }>;
interface Detection { adapter: string; root: string; confidence: number;
  formatVersions: Record<string, number>; untestedVersions: string[]; sessionsEstimate: number }
```

**Graceful degradation, done in code.**

- Every metric declares `requires: Capability[]` and `min_n`. The result is one of three shapes:

  ```ts
  type MetricValue =
    | { status: "ok"; value: number; n: number; ci?: [number, number]; caveats: string[] }
    | { status: "not_measurable"; missing: Capability[] }
    | { status: "insufficient"; n: number; min_n: number };
  ```

  `value: 0` is impossible unless the capability is present and n ≥ min_n. A test asserts that a fixture adapter without `interrupts` yields `not_measurable` for the correction rate, not 0.
- **Declared vs observed capability.** After parsing, the core measures the observed coverage: the share of sessions with at least one event of the required kind. A `full` declaration with under 50% observed coverage is downgraded to `partial` and given a caveat.
- **Degraded units and adapters.** More than 5% `ParseIssue` lines in a unit marks the unit degraded. More than 20% degraded units marks the adapter degraded. Metrics that depend on a degraded adapter show "not measurable (adapter degraded on format version X)".
- **Tamper check.** Per unit, the ingest manifest stores size, mtime and the sha256 of the previously ingested prefix. If a prefix changes on re-ingest, the unit is flagged `tampered`: a transcript was rewritten (see threat model). It is re-parsed, and the flag stays on the report.

**Adapters in v1:**

- `claude-code`. Subagent parentage comes from the path and `.meta.json`, not from the sidechain `sessionId` (R-FMT).
- `codex` (open question 5).
- `otlp-json` import.
- `canonical` import (JSONL of `CoachEvent`).

**OTLP-JSON mapping.** The input is OTLP/JSON `ExportTraceServiceRequest` and `ExportLogsServiceRequest`, one document per line (collector file exporter) or a single document.

- `gen_ai.operation.name` = `chat` or `text_completion` maps to `usage`, plus `message` when content was captured.
- `execute_tool` maps to `tool_call` + `tool_result` (status from the span status).
- `invoke_agent` maps to `delegation`.
- `session` is `gen_ai.conversation.id`, falling back to the trace id.
- `agent` is `gen_ai.agent.id`, falling back to `.name`.
- `parent` comes from the span parent chain.
- `human_turns` is `none`, or `partial` when user-role input content was captured.
- Claude Code OTel logs `tool_decision` with `source=user_reject` map to `tool_rejection`.
- `format.version` is the `schema_url` when present. Unknown attributes are ignored and counted.

**Community adapters.**

- **v1.** Any program, in any language, that writes canonical JSONL against the published JSON Schema works. It is fed with `blackbelt import --format canonical <file>`. There is no plugin loading.
- **v1.x.** Registered exec adapters. The user names an executable in `~/.blackbelt/config.json` (`adapters.exec: [{name, path, sha256}]`). The executable speaks `detect --json`, `capabilities --json` and `parse <unit>`: canonical JSONL on stdout, ParseIssue JSON on stderr. The sha256 pin is checked on each run, and a changed binary needs re-approval. Exec adapters are never auto-discovered.
- **Not planned.** In-process npm adapter plugins: an arbitrary npm package in our process is a supply-chain path into the user's transcripts. To revisit in v2 if demand shows.

**Rule-source plugin type.** Built-in rule sources are in-process, like adapters.

```ts
interface RuleSource {
  id: string;
  discover(ctx: DetectContext): Promise<RuleFile[]>; // {path, scope: "always"|"path_gated"|"on_demand"|"agent_definition", globs?, agentLabel?}
  split(f: RuleFile): Rule[];   // {ruleId, file, anchor (heading path), textSha256, chars, scope}
  evidence(rule: Rule, events: EventStream): Firing[]; // {strength: "load_event"|"path_gate_match"|"behavioural", eventIds}
}
```

- `ruleId` is sha256(source id + path relative to the root + heading path), so it stays stable across text edits. `textSha256` tracks versions.
- Built-ins in v1:
  - `claude-code`: CLAUDE.md levels, CLAUDE.local.md, `.claude/rules/*.md` with `paths:`, skills, agents, commands;
  - `agents-md`: the AGENTS.md hierarchy;
  - `manifest`: a user-declared `coach.rules.json` listing any files with their scope. This is how any other setup declares its rules without code.
- Cursor, Gemini and Cline are plain glob-plus-scope entries in the same mechanism (v1.x).
- Firing evidence, strongest first (R-FMT):
  - an explicit load event: Claude Code `attributionSkill`, or a Skill tool call;
  - a path-gate match: the rule's globs against `tool_call.attrs.paths` in the same session;
  - behavioural: v2, opt-in, because generated checkers can be wrong even after automated filters (71% correct in one manual sample, R-CHK).
- Always-loaded rules have no load event. Block 2a reports them as "always loaded; firing not observable on this setup", never as "never fired".

### 3.2 Layered correction detection

**Options**

- **A. Deterministic markers only.**
  - Benefits: free and precise once filtered.
  - Costs: recall is low; most corrections are typed words, not markers.
- **B. LLM classification only.**
  - Costs: in one study of general chats, one small model detected user feedback with 42-81% binary accuracy (R-LING); coding-agent corrections were not tested. It is not free, and it sends text off the machine, which conflicts with the zero-network first run and the local-only rule.
- **C. Layers.** L0 markers and L1 lexicon in code by default; L2 LLM opt-in. Every layer's precision is measured on the user's own labels.
  - Costs: one small labelling step for users who want calibrated numbers.

**Decision: C.**

**L0, structural markers (adapter-supplied raw `interrupt` / `tool_rejection` events).** A marker becomes a correction Finding only after the filters, applied in code in this order:

- F0: drop sessions started by the coach's own runner. They are tagged at spawn, and their isolated config dir keeps them out of the user's history in any case.
- F1: drop every marker in sessions where `interactive` is false (`-p` / SDK). If `interactive` is unknown, keep the marker with a caveat.
- F2, likely termination: the marker is the last human-side event and no human `message` follows within 120 s. This catches SIGTERM and closed terminals.
- F3, transport loss: the marker follows an `error` of a network or API class within 30 s, or comes after an output gap with no human message after it.

A kept marker becomes an L0 correction when a human `message` follows in the same session within 10 minutes, or when the rejection carries a user reason text. Filtered markers are counted and shown in a diagnostics panel; they are never silently dropped. Every filter has synthetic fixtures for each false-marker class (R-FMT).

**L1, a deterministic lexicon.** It applies to human messages that follow an agent turn, excluding the first message of a session. The lexicon is versioned and English-only in v1: negation plus a directive, "revert", "undo", "not what I asked", "I said", "stop", and so on. Turns whose language is not English are counted, and the report states the L1 coverage gap.

**L2, an opt-in LLM classifier.**

- Output schema: `{is_correction, target: "last_action"|"earlier"|"none", category}`.
- Endpoint: a local endpoint (Ollama) or a cloud model under a consent manifest (3.7, open question 3).
- L2 never overrides L0.

**Precision.** `blackbelt label` samples, locally, 30 candidates stratified by layer and 10 non-candidates. The user labels them in the terminal, and labels go to `~/.blackbelt/labels.jsonl` (local only). A user-kept corrections log (3.4) also counts as labels.

- Precision per layer is reported with a 95% Wilson interval.
- The headline correction rate uses L0+L1.
- L2 joins the headline only after its labelled precision is at least 0.8 with n ≥ 30. Until then it is shown separately.
- With no labels, the report says "precision not measured on your data", with the synthetic-fixture figure next to it.

**Definitions.**

- Correction rate = corrections per 100 human messages in interactive sessions, with numerator and denominator shown, overall and per `agent.label` and per work type (3.6).
- Recurring mistakes = deterministic clusters of correction texts (MinHash/TF-IDF with a fixed seed). Each cluster has at least 3 members across at least 2 sessions and carries its nearest `cmd_head`, paths and `ruleId`.

### 3.3 Package layout (TypeScript, npx)

**Options**

- **A. One npm package for everything, LangGraph included.**
  - Costs: npx cold install pulls LangGraph and its dependencies, which hurts the 60 s goal.
  - Complexity: lowest.
- **B. Many scoped packages** (`@<scope>/core`, `/stats`, `/report`, `/adapters`, `/judges`, `/oracle`, `/cycle`, `blackbelt`).
  - Benefits: clean boundaries.
  - Costs: release overhead ×8 and version skew, for one maintainer.
  - Reversal: easy either way.
- **C. Two published packages plus the plugin, with internal module boundaries enforced by lint.**

**Decision: C.**

```
packages/
  cli/            published as <cli>: bin, bundled with tsup/esbuild into one ESM file, Node >= 22
    src/core/       event schema, capabilities, metric registry, store, ingest, rule-source contract,
                    L0/L1 detection, config, consent, budget meter, ledger + rollback + pause (Phase 4)
    src/stats/      pure functions: seeded PRNG, Wilson, paired bootstrap, noise floor, ablation design, clustering
    src/adapters/   claude-code, codex, otlp-json, canonical; rule sources claude-code, agents-md, manifest
    src/report/     report-card model, terminal render, share HTML (ShareModel only)
    src/oracle/     sealed store + oracle process entry (Phase 2)
    src/judges/     panel + provider clients over raw fetch (no SDK dependencies); lazy-loaded
  cycle/          published as <cli>-cycle: the LangGraph.js graph (Phase 4); the only code importing @langchain/*
                  installed on first `blackbelt cycle` (prompted), never on the report path
plugin/           Claude Code plugin: .claude-plugin/plugin.json, commands/ (read-only commands),
                  hooks/ (BLACKBELT_HOME wall, Phase 2), pins an exact blackbelt version
schema/           event.v1.json, suite.v1.json, change.v1.json (for any-language adapters and tools)
fixtures/         synthetic only (data rules); one directory per adapter and format version
```

- **Boundaries** are enforced by `dependency-cruiser` in CI:
  - `stats` imports nothing internal.
  - `core` imports `stats` only.
  - `adapters` and `report` import `core` and `stats` types.
  - Nothing in `packages/cli` imports `@langchain/*`.
- **Runtime dependencies** of `blackbelt`: zod (bundled). Everything else uses Node built-ins: `fs`, `zlib`, `crypto`, `readline`, `child_process`.
- **Node.** Node ≥ 22, because Node 20 is end-of-life (to verify).
- **Plugin.** It calls `npx <cli>@<exact version>`. v1 plugin commands are read-only (report, rules, status, pause). Every command that loosens a control works only in a terminal (3.6).

### 3.4 Data contract, transcript fallback and local store

**Data contract.** These are plain files at paths the user sets in `~/.blackbelt/config.json`. None is required, and no layout is assumed.

- **Corrections log.** JSONL `{ts, text, session?, agent_label?, rule_id?, work_type?, source: "human"}`. These are human-logged corrections. They count as ground truth and double as labels for detector precision.
- **Eval suites.** One directory per suite.
  - `suite.json`: `{id, version, work_type, heldout: {count, seal_version}}`.
  - `tasks/<id>/task.json`: `{id, prompt, workspace: {repo, commit} | {fixture_dir}, checker: {cmd, timeout_s} | {rubric}, tags}`.
  - Visible tasks are the dev split. The held-out split lives physically in the seal (3.5); the visible suite records only its count and version.
- **Decisions log.** Dated lines `YYYY-MM-DD: text` (plain dated lines) or JSONL `{date, text}`. This is the stated bar, used by the foundation challenge.

**Fallback when a piece is missing:**

| Missing piece | Fallback | Consequence |
|---|---|---|
| Corrections log | Detected corrections from transcripts (3.2) | Precision shown as measured or not |
| Evals | None in v1 | Blocks 2b and 3 show "needs an eval suite" with a template (`blackbelt evals init`). Mining candidates from transcripts is v2. |
| Decisions log | The foundation challenge works on rule files and evals only | |

**Store options**

- **A. No store; recompute every run.**
  - Costs: big histories (Copilot files exceed 500 MB) break the 60 s goal; no trends after the 30-day deletion.
  - Complexity: lowest.
- **B. Plain-file cache: content-free canonical events in gzipped JSONL partitions, plus an ingest manifest for incremental re-ingest.**
  - Benefits: matches "plain files".
  - Complexity: low.
  - Reversal: easy (rebuildable cache).
- **C. SQLite.**
  - Benefits: faster queries.
  - Costs: `better-sqlite3` is native, which hurts npx installs, and `node:sqlite` maturity needs checking.
  - Reversal: medium.

**Decision: B.** Revisit C if the event volume per setup exceeds about 5 M events.

**Retention options**

- **A. Rely on the source.** Claude Code's history disappears at 30 days.
- **B. Keep content-free events and findings for 400 days by default; raw snapshot opt-in.** `blackbelt snapshot --enable` keeps gzipped raw copies, file mode 0600, 90 days by default.
- **C. Always snapshot raw transcripts.**
  - Costs: duplicates secrets and client data by default, against the data rules.

**Decision: B.** The report also tells Claude Code users how to raise `cleanupPeriodDays`, which is the simplest fix of all.

- Text is never written to the store. It is read on demand through `adapter.readText` and kept in memory only. When the source is gone, examples show "(source expired)".
- Paths and `cmd_head` stay local.
- `blackbelt purge [--setup S] [--before DATE]` deletes.

**Layout of `~/.blackbelt/` (mode 0700):**

```
config.json             user config: sources, budget, judges (key env-var NAMES only, never keys), consent
events/<setup>/<yyyy-mm>.jsonl.gz   content-free canonical events (400 d)
units.json              ingest manifest: unit -> size, mtime, prefix sha256
findings/<setup>/*.jsonl  corrections, clusters, firings (detector@version)
labels.jsonl  consent.jsonl
snapshots/              opt-in raw copies (90 d)
runs/<run_id>/          experiment runs: outputs, usage, trace.jsonl (never sealed content)
sealed/  keys/          Phase 2, 3.5
audit/judges.jsonl      3.7
ledger/                 Phase 4: git repo, 3.6
memory/<setup>/         Phase 4: long-term memory, 3.8
checkpoints/            Phase 4: LangGraph thread state
PAUSE                   presence = paused
share/                  generated aggregate pages
```

**The report card (block 1, the first 60 seconds).**

- `npx <cli>` runs detect over all adapters, then ingests the last 30 days incrementally, then shows the metrics.
- **Content:**
  - correction rate;
  - recurring mistakes, with local examples;
  - never-fired rules;
  - a coverage panel: what is measurable on this setup;
  - the data window;
  - a hiring verdict from history, which is a deterministic grade function over the metrics.
- **Hiring verdict.** Thresholds are published. It needs at least 20 interactive sessions; otherwise it shows "not enough evidence".
- **Time budget.** After 45 s, the report renders with what is parsed and says "parsed X of Y". Parsing must sustain at least 50 MB/s.
- **Share output.** `--share` writes `~/.blackbelt/share/report.html` from a `ShareModel` type. That type holds only numbers, enums, harness ids and dates; it has no free-text field from user data. A test plants canary strings and file paths in synthetic transcripts and asserts that neither appears in the HTML.
- **Publishing.** v1 publishes nothing. The user shares the file. A hosted share page sends data off the machine; it is Sensitive and needs its own ADR.

### 3.5 Sealed held-out set

**Options**

- **A. A Claude Code hook wall only.**
  - Costs: it works for one harness only (setup-agnosticism fails). Bash obfuscation can get around it.
- **B. A mandatory separate OS user or container for the oracle.**
  - Benefits: strong.
  - Costs: setup friction (sudo, Docker) kills adoption, and it differs between macOS and Linux.
- **C. Layered guards, with the achieved strength reported.**
- **D. A remote oracle.**
  - Costs: data leaves the machine, against the local-only rule.

**Decision: C.**

**Location and form.** `~/.blackbelt/sealed/<suite>/<seal_version>/`, mode 0700.

- Every item is encrypted at rest with AES-256-GCM (Node `crypto`) using `~/.blackbelt/keys/seal.key` (mode 0600).
- Each item carries a canary GUID string in its task text and checker.
- `blackbelt seal add <task_dir>` encrypts a task and removes the plaintext after confirmation in a terminal.

**The guard, in layers:**

- **G1, out of reach of incidental reads.** The seal sits outside any workspace and is encrypted, so grep, indexing and embedding tools see ciphertext. This blocks accidental contamination, which is the common case. A same-user attacker can still get through, so G1 alone is not enough.
- **G2, separate process.** Only the oracle process (`blackbelt oracle`, spawned per evaluation, with JSON over stdio) decrypts. Its interface is:

  ```ts
  submit({suite, candidate: {variant_id | patch}, runs}) -> {accept: boolean, score: number /* rounded to 0.05 */, n_tasks: number, seal_version: string}
  leakcheck({patch}) -> {pass: boolean}
  status() -> {suites: [{id, seal_version, count, queries_left}]}
  ```

  - It returns no per-task results, no task text and no failure messages. Unlike R-SEAL, which returns one accept/reject bit, it also returns a rounded score. R-SEAL's ablation found that showing numeric audit scores weakened its gate; the 0.05 rounding and the query budget are our untested mitigation.
  - Each `{suite, seal_version}` has a query budget (default 50). When the budget is spent, the suite needs refreshing. Adaptive reuse can overfit a holdout, and limiting what each answer reveals slows this (R-HOLD); the budget of 50 and the 0.05 rounding are our choices and carry no guarantee (to size).
  - The oracle runs tasks through `adapter.run` in a temporary workspace and an isolated config dir. Sealed-run transcripts are written only inside `sealed/`. They never reach the user's harness history, the coach's ingest or the coached agent's memory features.
  - Checkers run in the oracle's own temporary copy, outside the agent's workspace.
- **G3, breach detection, harness-agnostic.** Every ingest scans tool calls and text in transcripts for:
  - `~/.blackbelt/sealed` and `keys/` paths;
  - the expanded home path;
  - canary GUIDs.

  This works because every harness logs tool calls, and adapters already read them. A hit marks the seal version `breached`. Accept results from that version are void, and the report shows it.
- **G4, harness walls through the `guard` capability.**
  - Claude Code: a plugin PreToolUse hook denies any tool input that references `BLACKBELT_HOME`, after normalising `~`, environment variables, symlinks and relative paths.
  - Other harnesses: their sandbox read-deny where one exists (to check per adapter).
- **G5, optional isolation.** A documented strong mode runs the oracle as a separate OS user or in a container.

**Seal strength**, shown on every result and computed in code:

- `detect-only`: G1-G3;
- `walled`: G1-G4;
- `isolated`: G1-G5.

**Scope.** The seal guards against the coached agents, not against the coach.

- The coach may add or retire sealed items. Every change is a ledger entry (3.6).
- The coach's model steps never receive sealed content: only the oracle process touches it, so no rule can carry it out.
- Our leakage critic is a deterministic variant of the idea in R-RRSI, whose critic is an LLM reading each candidate diff. It runs inside the oracle and rejects any proposed patch that contains a canary, has a normalised 8-gram overlap of 3 or more with any sealed item, or names an identifier unique to sealed tasks.

### 3.6 Autonomy model, versioning, rollback, pause, world signals

Phases 4-5. This ADR fixes the contracts; ADR-0002 sets the numbers before the build.

**Type of work.** An opaque string taxonomy in config, with deterministic matchers: path globs over `tool_call.attrs.paths`, `cmd_head`, `tool_class`.

- Default taxonomy: `docs`, `tests`, `code`, `deps`, `ci`, `infra`, `data-migration`, `external-send`.
- The user marks which types are irreversible (Sensitive). The defaults are `data-migration` and `external-send`.
- No roles are involved.

**Ladder per work type.** These rungs govern the coached agents. Each rung says who must approve before an effect.

Belts name these rungs, from white (R0) to black (R4) (ADR-0002 §3.5). Belts are an entrustment ladder: trust granted per kind of work from outside evidence. They are not a Dreyfus competence model.

| Rung | Name | Approval |
|---|---|---|
| R0 | watch | measure only |
| R1 | propose | a human approves before effect |
| R2 | act-with-review | effect first, human review within a veto window |
| R3 | autonomous | sampled audit by the coach |
| R4 | Sensitive autonomous | only for irreversible types, and only with a verified safety net |

- R4 needs adapter capabilities `dry_run`, `canary` and `backup`, plus a restore drill passed within the last 30 days.
- When the adapter lacks these, R4 shows "not available on this setup". It is never approximated.

**Promotion and demotion.** Deterministic code, run each cycle and on every new world signal.

- Promotion is one rung at a time. It needs:
  - a minimum n of completed items in the type since the last rung change;
  - a world-signal failure rate whose Wilson upper bound is at or under the threshold for the rung;
  - a correction rate at or under its threshold;
  - no severe signal in the window.
- Demotion is fast:
  - one severe signal (an incident, or a revert of Sensitive work) drops the type to R1 at once;
  - a failure-rate Wilson lower bound above the threshold drops it one rung.
- Placeholder defaults for ADR-0002: n ≥ 20, 40, 80 for R2, R3, R4-entry; at least 100 for R4; thresholds 5%, 3%, 1%.

**How the setup learns the rung, setup-agnostic.**

- Pull model: `blackbelt gate check --work-type W [--action A]` exits 0 (allowed without prior human approval) or 1, and prints the rung. Any harness hook, CI job or script can call it. If it cannot run, the setup must treat that as deny, which is fail closed and documented.
- Push model, optional: through the adapter `actuator` (for example, a multi-agent crew adapter maps rungs onto `crew_merges`).

**Constitution vs target** (open question 2).

- The target may change freely: evals (dev and sealed content), rubrics, the coached setup's rules and skills, and the thresholds of the non-Sensitive rungs.
- The constitution is code constants and user-only config. The coach cannot change it:
  - the seal mechanics (G1-G4, query budget, leakage critic);
  - the budget cap amount;
  - rollback and pause;
  - world-signal logging;
  - one rung per step;
  - the R4 evidence and safety-net minimums;
  - the consent rules.
- Every target change records `bar_effect: raised|lowered|neutral|unknown`. It is computed in code by re-scoring the frozen historical results under the old and the new target. If more historical outputs pass under the new target, the bar was lowered.
- This is not an anchor. It makes the accepted risk from R-GG visible next to the world-signal log.

**Versioning.** `~/.blackbelt/ledger/` is a git repository the coach owns.

- Every autonomous change is one commit holding:
  - `change.json`: `{change_id, ts, kind: rule_edit|rule_delete|rule_add|eval_change|sealed_change|target_change|promote|demote, work_type?, files: [{path, pre_sha256, post_sha256}], bar_effect, coach_version, models, cost_eur}`;
  - `patch.diff`;
  - the pre-image of each file under `pre/`;
  - `evidence.json`: the noise floor, the CI, n, run ids, oracle accept, seal strength.
- The actuator writes the user's files only after the ledger commit exists. It verifies `post_sha256` and restores the pre-image on mismatch.
- Mirroring commits into the user's own repo is an optional adapter feature.
- A "rule delete" is reversible through the pre-image. It is therefore an edit with a backup, not an irreversible delete, and needs no human interrupt.

**Rollback.** `blackbelt rollback <change_id>|--last|--since DATE` is pure code. It needs no network, no model and no LangGraph.

- It checks the current hash against `post_sha256`.
- If the file has drifted, it tries a three-way merge (`git merge-file`). On conflict it refuses, leaves every file untouched, and prints the manual path.
- Rollback is itself a ledger commit, and it counts as a world signal against the change.

**Pause.** `blackbelt pause` creates `~/.blackbelt/PAUSE`.

- Every actuator call and every cycle node checks for it immediately before acting.
- If the state cannot be read, the coach treats it as paused.
- Pause works from anywhere, including from inside an agent session.

**Tighten anywhere, loosen only from a terminal.** These commands refuse unless stdin is a TTY and the process is not inside a coached session (the adapter `guard` reports the session marker):

- `resume`, `rollback`, `seal add/retire`, budget or consent changes;
- `gate` overrides.

**World-signal log.** `ledger/signals.jsonl`, append-only. Each line:

`{ts, type: revert|rework|ci_fail|incident|rollback|correction_shift, ref, change_ids[], attribution: exact|window|ambiguous}`

Sources:
- git: reverts, and human commits that touch lines a change made within 14 days;
- CI status: through an adapter, opt-in, because it reads a remote;
- `blackbelt signal add` for incidents;
- before/after correction rate per work type.

Attribution is deterministic by files and rules touched within the window. Ambiguous signals link to every candidate change.

**Where state lives.**

- Ladder state is derived. `ledger/state/autonomy.json` is a materialisation of the ledger and records the ledger HEAD it came from.
- `gate check` verifies that HEAD and recomputes on mismatch. A hand edit to the file therefore changes nothing, and it shows up as tampering.

### 3.7 Judge panel and budget guard

**Judges.**

- **Families.** The config lists `[{family, model, endpoint, key_env}]`. The panel needs at least 2 distinct families by lineage. With fewer, the panel is `unavailable`: there is no single-judge fallback.
- **Blinding.** Candidates are anonymised: model names, harness banners and formatting signatures are stripped. Each judge sees each pair in both orders, from a recorded seed. An order-inconsistent verdict counts as a tie.
- **Agreement** is reported as Krippendorff's alpha.
- **Audit-only, enforced by types.** Judge records go to `audit/judges.jsonl`. The input type of the decide function has no judge field, and a test asserts it.
- **What judges never decide:** hiring verdicts, ablation outcomes, promotions and applied changes.
- **Tasks without a deterministic checker** give hiring results labelled "audit only, not decisive".
- **Blind hiring test (block 3):**
  - `blackbelt hire --candidate variant.json --suite S` runs the candidate against the incumbent;
  - k ≥ 3 runs per task per arm, deterministic checkers, paired task-level bootstrap;
  - HIRE when the CI lower bound is above the noise floor and the cost gate passes;
  - NO HIRE when the CI upper bound is below the noise floor;
  - otherwise INCONCLUSIVE, with the minimum detectable effect stated;
  - the cost gate: a candidate that uses more than 25% more tokens per task must beat the incumbent by twice the noise floor (our rule, motivated by R-RRSI, which instead allows cost growth that rises with score gain above its noise band).

**Statistics (block 2b, pure code in `src/stats`).**

- **Noise floor.** Measuring the unchanged base is from R-RRSI, and repeated runs are motivated by R-NOISE; the estimator is ours.
  - Measure it with an A/A test: the unchanged base, two arms of k=3 runs per task.
  - NF is the upper 95% bound of |mean paired difference| from a task-level bootstrap with B = 10,000 and a recorded seed.
  - Store it per `(suite version, model id, harness version)`. A change in any of these invalidates it.
- **Ablation effect.** For each task, d_t = mean(variant) - mean(base) over k ≥ 3 runs. Resample tasks to get a percentile CI.
- **Decision rule.** An effect counts only when the CI excludes 0 and |mean d| ≥ NF.
- **Group ablation.**
  - Groups are rule files, then their sections.
  - A group with no effect is reported as "no measurable effect on this suite at MDE x". It is never called "useless".
  - A group with an effect is split by halving while the budget allows.

**Budget guard.**

- The cap is `budget.cycle_eur`, default 10, set by the user only (constitution). It covers runner tokens, judges, L2 and model nodes.
- Prices come from a versioned `prices.json` (USD) with a dated fixed FX rate. Subscription runs are priced at API-equivalent rates, conservatively.
- An unknown price is refused (fail closed) unless the user supplies one.
- **Pre-flight.**
  - The estimate is tasks × runs × p90 tokens per task (from history, or a default) × price × 1.2.
  - If the estimate is over the remaining budget, the plan shrinks (fewer groups). If even one unit does not fit, the run is refused.
- **Runtime.**
  - A meter sums `usage`.
  - In-flight runs get a reserve.
  - Once spent plus reserved would pass the cap, the coach stops launching runs and kills runs that pass their per-run token or time cap. It then checkpoints.
- **Experiments span cycles.** The noise floor and the group results persist, so a large suite finishes over several cycles. The budget caps spend per cycle, not the size of an experiment.
- **Cost estimate (to check).** At roughly EUR 0.05-1 per agent run, EUR 10 buys about 10-200 runs. A 20-task suite needs 120 runs for the noise floor (once) and 60 per ablation group. Worst case per month with weekly cycles is about EUR 43.
- **Consent for content leaving the machine** (open question 3).
  - Before a cloud call that carries transcript text, rule text or task content, a manifest shows destination, purpose, item kinds and counts, and estimated cost.
  - Approval happens in a terminal and is recorded in `consent.jsonl`.
  - Unattended cycles use standing consent scoped to `(purpose, provider)`, created in a terminal.
  - Local endpoints need no consent.

### 3.8 The coach is the agent

**Outcome.** The coached setup measurably improves, and it earns autonomy per work type. Every change is tested, versioned and reversible.

**Triggers:**
- `blackbelt cycle`, run by hand or by the user's cron, systemd or launchd (the coach installs no daemon);
- a new world signal: runs the deterministic demotion subgraph only, with no model and no spend;
- a detected change in model or harness version: invalidates noise floors;
- N new sessions ingested: optional.

**Graph** (LangGraph.js, Phase 4; C = code, M = model). Every v1 command already is one of these functions; Phase 4 wires them up without a rewrite.

1. `intake` (C): lock per setup, PAUSE check, budget load, version pins, consent check.
2. `ingest` (C): incremental adapter parse, tamper check, seal breach scan.
3. `measure` (C): metrics, rule fitness (free), world-signal attribution, ladder promotion and demotion.
4. `diagnose` (M, subgraph): proposes from findings. This is also block 4, the foundation challenge, which in v1 is a report-only command.
5. `validate` (C):
   - schema check (zod);
   - permission check: `ruleId` exists and the file lies inside the declared rule roots;
   - size and complexity gate: added text, at most 2 KB per change;
   - secret scan (regex set);
   - dedupe against the ledger (an idea rejected in the last 4 cycles needs new evidence);
   - work-type and Sensitive classification;
   - oracle `leakcheck`.
6. `plan_experiments` (C): budget pre-flight; choose groups.
7. `run_experiments` (C subgraph): runner arms, k ≥ 3, dev suite, then oracle `submit`.
8. `decide` (C): noise floor, CI, cost gate, oracle accept, and no regression on the sealed set beyond the noise floor. Judges run as a separate M node whose output goes to audit only.
9. `apply` (C): PAUSE re-check, constitution check, rung and safety-net check for the work type, ledger commit, actuator, hash verify.
10. `report` (C): cycle report, `bar_effect`, signals, status.
11. `remember` (C): deterministic memory merge.

**Closed action set for model nodes.**

- Read tools, all with quoted, provenance-tagged output:
  - `get_findings(filter)`, `get_cluster(id)` (excerpts), `get_rule(ruleId)`;
  - `get_metric(name)`, `get_experiment_history(ruleId|clusterId)`, `get_memory(query)`.
- Propose tools, which write to state only and have no side effects:
  - `propose_rule_edit{ruleId, new_text, rationale, expected_effect}`, `propose_rule_delete{ruleId}`, `propose_rule_add{file, anchor, text}`;
  - `propose_ablation{ruleIds}`;
  - `propose_eval_add{clusterId}`, `propose_eval_retire{taskId, reason: flaky|saturated|uncorrelated_with_world}`;
  - `propose_bar_change{target, from, to, evidence_type: flaky|saturated|uncorrelated_with_world|new_failure_mode}`;
  - `finish{summary}`.
- No tool writes files, runs commands or reaches the network.
- Every target change must name evidence from a closed enum that code can verify. Freedom stays; unsupported changes are rejected by `validate`.

**Guardrails in code.**
- Zod on every argument.
- Per-tool permission checks.
- At most 25 tool calls per model node and 5 proposals per cycle.
- 120 s per model call; 4 h wall clock per cycle.
- Budget meter on every call.
- Idempotency key `(run_id, node, item)` on every side-effecting step.
- An invalid model output is retried once, then the proposal is dropped.
- Any guard failure sets `status: blocked(<reason>)` and ends the cycle. Fail closed.

**State type.**

```ts
interface CycleState { run_id: string; setup: string; coach_version: string;
  budget: { cap_eur: number; spent_eur: number; reserved_eur: number };
  status: "running"|"paused"|"blocked"|"budget_exhausted"|"done"; block_reason?: string;
  findings_ref: string; proposals: Proposal[]; experiments: ExperimentPlan[];
  results: ExperimentResult[]; decisions: Decision[]; applied: string[] /* change_ids */; errors: CycleError[] }
```

State holds references, not transcript text.

**Memory.**

- **Short-term.** LangGraph checkpoints per thread (= `run_id`) in `~/.blackbelt/checkpoints/`, using a file-based checkpointer without native modules (to check). A crash resumes from the last node, and idempotency keys prevent double effects. Checkpoints are deleted 30 days after the run ends.
- **Long-term,** namespaced per setup under `~/.blackbelt/memory/<setup>/`, in three stores:
  - `experiments.jsonl`: every experiment and its result; kept until purged;
  - `noise_floors.jsonl`;
  - `playbook.jsonl`: ACE-style items `{id, kind: lesson|hypothesis|procedure, text <= 300 chars, helpful, harmful, last_used, source_runs, created_by}`.
- **Playbook writes.** Item structure and delta merge follow R-ACE; the MinHash merge, the code-only writer and the retirement thresholds are ours.
  - only the `remember` code node writes;
  - model-drafted items pass validation and the secret scan first;
  - merging is deterministic: a normalised-text hash, or MinHash similarity ≥ 0.8, merges counters;
  - the playbook is never rewritten by an LLM;
  - an item is retired when `harmful > helpful + 2`, or after 10 cycles unused.
- **Read-back** is untrusted data. It is rendered as a quoted "notes from past runs" block, never as instructions.
- **No secrets** in memory or config: provider keys are referenced by env-var name only.
- **The user sees and corrects memory** with `blackbelt memory list|show|forget <id>|pin <id>`. Pinned items never retire.
- **Who reads memory:** only the coach, for that setup.

**Human in the loop.**

- By design, applying reversible changes, promoting and demoting, and changing the target need no approval.
- Approval is always needed before anything leaves the machine: cloud calls beyond standing consent, and any share upload.
- R4 is gated by code, not by an interrupt.
- What the human sees to decide fast: the consent manifest (destination, items, cost).

**When unsure or wrong:**

| Situation | What the coach does |
|---|---|
| Insufficient evidence | Decision "none; need N more", recorded |
| Inconclusive statistics | No change; the experiment stays open |
| Degraded adapter | Dependent metrics show not measurable |
| Seal breached | Accepts are void; the cycle blocks autonomous applies |
| Budget exhausted | Checkpoint, resume next cycle |

The user sees all of this in `blackbelt status` and at the top of the next report.

**Evals for the coach itself.** Synthetic fixture setups, in CI, red first. The bars must be met before each phase ships.

| Area | Bar | Phase |
|---|---|---|
| L0 filters (fixtures for transport loss, `-p` and SIGTERM per adapter version) | precision ≥ 0.95 | 1 |
| Never-fired (planted loaded, path-gated and dead rules) | exact match | 1 |
| Share output leaks (canaries and paths) | 0 | 1 |
| Missing capability shown as 0 | 0 cases | 1 |
| Ablation, simulated runs with a planted effect of 2×NF | power ≥ 0.8 | 3 |
| Ablation, null rules | false positives ≤ 5% | 3 |
| Seal (planted reads, canaries in proposals) | 100% detected / rejected | 2 |
| Injected instructions in transcripts and memory | 0 applied changes | 4 |
| Budget overrun | 0 | 2 |
| Rollback | byte-identical restore 100%; conflicts never touch files | 4 |
| Pause | 0 actions after PAUSE | 4 |

Model nodes are tested on recorded fixtures.

**Coach precision in production** is the coach's own world signal: the share of applied changes with no rollback and no negative signal within 30 days. It is shown on `blackbelt status`.

**Observability.** Each run writes `runs/<run_id>/trace.jsonl`: per node, input and output hashes, tokens, EUR, latency, decision. Cost and latency per run go into the report. OTLP export of the coach's own traces is v2.

## 4. Threat model (the coached agent, by reward pressure or malice)

| Threat | Control | Detection |
|---|---|---|
| Reads the sealed set | G1 encrypt, G2 oracle-only, G4 wall, G5 optional | G3 canary and path scan; seal strength shown |
| Learns held-out tasks from sealed runs | Isolated config dir; transcripts kept in `sealed/`; query budget; coarse score | `queries_left`; growing sealed vs dev gap |
| Rewrites its transcripts to remove corrections | none (same user) | Prefix-hash tamper flag |
| Edits coach state (`autonomy.json`, budget, PAUSE, ledger) | Wall on `BLACKBELT_HOME`; derived state; loosening commands terminal-only | Ledger HEAD mismatch; git history |
| Moves work to `-p` runs, where markers are filtered | none | Interactive vs non-interactive share per type; world signals cover both |
| Fakes rule firing (reads skill files for no reason) | Firing strength levels; ablation is the real test | Load events without behaviour change |
| Games eval checkers or detects the eval environment | Checkers in the oracle's copy; diff-only output; neutral paths and env | Dev vs sealed divergence |
| Injects instructions into judges | Judges are audit-only | Injection flag on outputs |
| Injects instructions into the coach (transcripts, memory) | Quoted data; closed action set; `validate`; statistical gate before apply | Proposals with no evidence get rejected and counted |
| Exhausts the budget (loops, huge outputs) | Per-run token and time caps; budget meter | Cost per run in the trace |
| Fix-forward instead of revert to hide failures | Rework signal (human commits on changed lines) | World-signal log |
| The coach lowers its own bar (accepted risk, R-GG) | Constitution; closed evidence enum | `bar_effect`; world-signal trend per target version |

## 5. Deterministic code vs model step

**Code:**
- detection, parsing, capability gating;
- L0 and L1 detection, clustering;
- rule discovery and firing (load and path);
- all statistics, the hiring verdict, the report card and share output;
- budget, consent, seal, oracle and leakcheck;
- ladder promotion and demotion;
- `validate`, `decide`, `apply`;
- ledger, rollback, pause;
- world-signal attribution;
- memory merge and retention.

**Model** (opt-in, budgeted):
- L2 correction classification;
- `diagnose` and the foundation challenge (proposals only);
- the judge panel (audit only);
- optional cluster labels.

## 6. Phasing (smallest design for the v1 blocks; deferrals explicit)

- **Phase 1** (block 1, block 2a):
  - core, event schema, the 4 adapters, 3 rule sources;
  - L0, L1, `label`;
  - report card and share file;
  - plugin with read-only commands.
- **Phase 2:**
  - Claude Code runner;
  - noise floor and budget meter;
  - seal (G1-G4 for Claude Code) and oracle.

  The ordering of the seal is open question 1.
- **Phase 3** (blocks 2b, 3, 4):
  - group ablation;
  - judge panel and hiring test;
  - `challenge` (report-only proposals).
- **Phases 4-5:**
  - the cycle graph, memory, ledger, actuator, rollback, pause;
  - world signals, ladder, `gate check`, R4 safety net.

  ADR-0002 sets the thresholds first.
- **v2 (deferred):**
  - authoring and mining tools for held-out evals;
  - per-agent development plans;
  - behavioural rule matching;
  - registered exec adapters (v1.x) and more harness adapters (Copilot, Cursor, Gemini/Antigravity, OpenCode, Cline family);
  - hosted share (Sensitive; own ADR);
  - team or fleet aggregation (own ADR);
  - OTLP export of the coach's traces;
  - SQLite store if volume demands it.

## 7. Consequences

**Positive:**
- Any setup gets a report through adapters or a canonical import.
- Unmeasurable metrics are explicit.
- No transcript text is persisted.
- v1 works with no network and no cost.
- Every later phase reuses v1 functions as graph nodes.
- Autonomy is reversible and pausable through pure code.
- The content-free canonical store is the natural unit for later fleet aggregation, so this moves toward the paying audience.

**Negative:**
- We own a schema and one mapping per harness version (R-FMT: no format is a documented stable schema). That needs fixture upkeep per release.
- The L1 lexicon is English-only.
- The seal against a same-user agent is detect-and-wall, not proof. The strength label says so.
- A EUR 10 cap makes paid results slow on large tasks.
- The constitution narrows the free-target rule slightly (open question 2).

## 8. Failure modes of this design and their production signals

| Failure | Signal |
|---|---|
| Canonical model too thin | Adapters overload `attrs`; more than 10% `actor: unknown` |
| Correction rate not trusted | Labelled precision under 0.8; users disputing numbers in issues |
| Noise floor too high for the effects that exist | No significant result across 10 or more groups; MDE above 10 points |
| Budget too small | Median of 4 or more cycles to a verdict |
| Undetected seal breach | Sealed-dev gap shrinking without dev gains; canary hits |
| Bar drift | `bar_effect = lowered` count rising while world signals worsen |
| 60 s missed | p90 report time over 60 s in opt-in timing or on big fixtures |
| Silent format drift | ParseIssue rate or untested-version share rising after a harness release |

What would change the design:
- OTel GenAI semconv reaching Stable with human-turn and feedback concepts would make it a candidate for the internal model, via a new ADR.
- Users needing in-process plugins would reopen 3.1.

## 9. Reversal cost

| Part | Cost to reverse |
|---|---|
| Event schema | Medium: versioned, and the cache can be rebuilt from sources while they exist |
| Packaging | Low |
| Store format | Low (cache) |
| Ledger format | Medium: git plus JSON, migration script |
| Seal format | Medium: re-encrypt |
| Constitution boundaries | Low in code, but a trust change for users |

## 10. Open questions

1. Seal timing: Phase 2 mechanism vs line 11 "held-out evals v2". Recommended: mechanism in Phase 2; authoring tools in v2.
2. Constitution vs free target. Recommended: yes, the fixed list in 3.6.
3. Consent for model providers: a per-run manifest plus standing consent per purpose and provider, under the local-only rule. Recommended: yes, with no default.
4. Hiring test definition as in 3.7 (checkers decide, judges audit). Recommended: accept.
5. v1 adapters: Claude Code + Codex + OTLP-JSON + canonical. Recommended: yes.

## 11. Facts to check before building

Seven items to check: Claude Code non-interactive marker, session env var and runner isolation; Codex markers and runner; OTLP shapes; per-task token costs and prices; reusable-holdout sizing; LangGraph.js checkpointer; Node LTS dates.

---

