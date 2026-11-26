# ADR-0002: The coach training loop

- Status: Accepted (2026-11-24)
- Date: 2026-11-24
- Amended: 2026-11-25 (part of the double loop moves into 0.1: research list, §3.2, §3.6, §3.7; #17).
- Amended: 2026-11-26 (citations scoped, foundations reworded, screening node renamed `screen`; #23).
- Amended: 2026-11-26 by ADR-0003.
- Related: ADR-0001 (Accepted); `docs/research/ingest-formats.md` (R-FMT).
- Amends ADR-0001:
  - §6 phasing, replaced by §3.7 here;
  - §3.6 placeholder ladder numbers, replaced by §3.5;
  - §3.8 cycle graph, extended into the training graph of §3.2;
  - §3.4 "text is never written to the store", narrowed for the drill store (§3.4);
  - the verb `cycle`, renamed `train` (`cycle` stays as an alias).
- Supersedes in part:
  - "per-agent development plans come in v2" (already covered by the training loop);
  - "held-out mining tooling is v2", only for drills mined from the user's own recurring mistakes. The training loop needs these. Authoring tools for arbitrary held-out suites stay later.

Paths. ADR-0001 §3.4-§3.8 still write `~/.blackbelt/`. Read every such path as `~/.blackbelt/`, per ADR-0001's naming paragraph.

Terms.
- **Trainee:** one coachable agent of a setup. It is a selector over events plus the context files that shape it. A single-agent setup has one trainee.
- **Write surface:** the files the coach may change for a trainee.
- **Intervention:** one proposed change to a write surface. It consists of context items.
- **Drill:** a small task with a deterministic checker, derived from a recurring mistake.
- **Screen and exam drills:** the two disjoint splits of a goal's drills.
- **Incumbent:** the trainee's current context. **Candidate:** the incumbent plus one intervention.
- **Work item:** defined in §3.5.

Research cited (ADR-0001's list, plus):
- **R-VOY:** Wang et al., "Voyager: An Open-Ended Embodied Agent with Large Language Models", [arXiv 2305.16291](https://arxiv.org/abs/2305.16291) (v2, 2023-10-19; TMLR 2024). In Minecraft with GPT-4: an LLM-proposed curriculum matched to the agent's state and progress; a library of code skills added after LLM self-verification; refinement from environment feedback, execution errors and self-verification. (checked 2026-11-26)
- **Small-n statistics:** the Wilson score interval as given in Agresti & Coull 1998 (https://doi.org/10.1080/00031305.1998.10480550; original Wilson 1927, not read) and the exact paired sign-flip (randomisation) test, exactness under invariance per Hemerik & Goeman ([arXiv 1411.7565](https://arxiv.org/abs/1411.7565), v3). (checked 2026-11-26)
- Argyris, C. & Schön, D. A., Organizational Learning: A Theory of Action Perspective (Addison-Wesley, 1978). A standard reference for double-loop learning, used here as inspiration. (checked 2026-11-26: catalogue record only; text not read)
- **Added by the 2026-11-25 amendment:**
  - Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?, [arXiv 2602.11988](https://arxiv.org/abs/2602.11988) (v3, 2026-09-29) (checked 2026-11-26)
  - TellOnce: Correcting Coding Agents Once, Improving Their Future Actions, [arXiv 2606.13174](https://arxiv.org/abs/2606.13174) (v2, 2026-10-25) (checked 2026-11-26)
  - Self-Improving AI Coding Agents Through Accumulated Behavioral Rules: A Closed-Loop Framework, [arXiv 2607.13091](https://arxiv.org/abs/2607.13091) (2026-07-13) (checked 2026-11-26)
  - **R-GG:** Who Grades the Grader? Co-Evolving Evaluation Metrics and Skills for Self-Improving LLM Agents, [arXiv 2607.12790](https://arxiv.org/abs/2607.12790) (v2, 2026-07-30) (checked 2026-11-26)
  - **R-SEAL:** Self-Authored Verification Is Unreliable in Heuristic Self-Improving Agents, [arXiv 2607.24300](https://arxiv.org/abs/2607.24300) (2026-07-27) (checked 2026-11-26)
  - Guardrails Beat Guidance: A Large-Scale Study of Rules, Skills, and Persistent Configuration for Coding Agents, [arXiv 2604.11088](https://arxiv.org/abs/2604.11088) (v2, 2026-05-28) (checked 2026-11-26)
  - Skill Issue: Lessons from Optimizing Repository SKILLs for Coding Agents, [arXiv 2609.12742](https://arxiv.org/abs/2609.12742) (2026-09-11) (checked 2026-11-26)
  - **R-NOISE:** On Randomness in Agentic Evals, [arXiv 2602.07150](https://arxiv.org/abs/2602.07150) (v3, 2026-03-25) (checked 2026-11-26)
  - Can Coding Agents Sustain Continual Evolution without Forgetting?, [arXiv 2611.03219](https://arxiv.org/abs/2611.03219) (2026-11-02) (checked 2026-11-26)
  - Cortex: Measurement-Gated Evolution and Pruning of Coding-Agent Skills and Rules, [arXiv 2610.14216](https://arxiv.org/abs/2610.14216) (2026-10-09) (checked 2026-11-26)
  - Admitted Is Not Effective: Lessons from a Notary-Gated Retrospective Loop in an Agentic Pipeline, [arXiv 2611.29727](https://arxiv.org/abs/2611.29727) (2026-11-22) (checked 2026-11-26)
  - **R-CHK:** Do They Do as They Are Told? Investigating Coding Agents' Adherence to Explicit Instructions in Context Files, [arXiv 2611.13709](https://arxiv.org/abs/2611.13709) (2026-11-10) (checked 2026-11-26)
  - Stale Instruction Files Override the Code in Coding Agents: A One-Sentence Fix, [arXiv 2610.30571](https://arxiv.org/abs/2610.30571) (2026-10-22) (checked 2026-11-26)
  - Why Does CLAUDE.md Keep Growing? Catastrophic Remembering in Agentic Coding, [arXiv 2608.11095](https://arxiv.org/abs/2608.11095) (v2, 2026-11-20) (checked 2026-11-26)

## 1. Context

blackbelt is first of all the coach that trains agents over weeks. It diagnoses, decides what to learn next, screens candidate changes, measures progress against an outside standard, and challenges rules and evals: it questions the rules, not only the mistakes. This loop is inspired by Argyris & Schön's double-loop learning. The report card is the free intake and the hook. Belts are the outcome of training and the language of the autonomy ladder.

The coach cannot change model weights. It can change only what the agent reads: its context. It must do so for any setup, locally, within EUR 10 per cycle, with every change versioned and reversible. Verdicts come only from deterministic checks; judges are audit-only. It must not adopt on its own before the seal exists.

ADR-0001 fixed the contracts:
- canonical events and adapters;
- metrics gated by capability;
- the seal, the constitution, the ledger, the budget meter and audit-only judges.

It deferred four things to this ADR: the thresholds, the estimated-belt computation, stripes, and `blackbelt badge`.

## 2. Decision drivers

1. **The coach acts on the diagnosis.** A release without screening and measured adoption is a diagnostic, the category of AgentLint, CodeBurn and /insights.
2. **Belts are graded against an outside standard.** In R-GG's report-generation ablation, an evolved grader selected without its anchor guards passed almost everything. We infer that drills the coach writes must never grade belts.
3. **Setup-agnostic.** Trainees and write surfaces come from adapters, and the core never branches on their keys.
4. **Deterministic verdicts.**
5. **Tested, versioned, reversible, with the seal before any autonomous adoption.**
6. **Budget.** EUR 10 per cycle buys roughly 25-60 agent runs (estimate, §3.4). The statistics must work at small n.
7. **Privacy (data rules).** User text stays local and is never shared.
8. **The smallest coherent coach ships first.**

Options are costed on complexity, cost per run and per month, security, operations, latency and reversal. Prices are estimates until checked.

## 3. Decisions

### 3.1 What training means: the learnable surface

**Options**

- **A. Edit the user's instruction files in place** (CLAUDE.md, AGENTS.md).
  - Benefits: one surface everywhere; AGENTS.md is the de-facto standard (R-FMT).
  - Costs:
    - changes land in files the user also edits and usually commits, so merges conflict and coach text ends up in team PRs;
    - always-loaded text cannot be observed firing (ADR-0001 §3.1), and every line costs tokens on every turn.
  - Complexity: low. Cost per run: context grows. Security: writes user files. Reversal: medium, because three-way merges often conflict.
- **B. A coach-owned overlay per trainee, plus coach-owned on-demand skills. The user's own rule files change only through the ADR-0001 actuator with a pre-image.**
  - Benefits:
    - ownership is clear;
    - rollback of coach files is byte-exact;
    - a human edit of coach text becomes a signal;
    - the overlay defaults to untracked paths, so team repos stay clean;
    - items are itemised, so ACE delta merges apply (R-ACE);
    - skills load on demand, so their firing is observable and they can be ablated.
  - Costs: one include line per setup (a one-time approval in a terminal); a write-surface mapping per adapter; two change paths (the overlay and user files).
  - Complexity: medium. Security: writes are limited to declared paths. Reversal: low (remove the include line, delete the overlay).
- **C. The full surface:** also permissions, tool allowlists, hooks, MCP config, model choice, and the agent's own memory store.
  - Benefits: stronger levers.
  - Costs:
    - permissions and hooks are autonomy changes outside the ladder, and hooks run code;
    - writing the agent's memory store mixes owners and opens a poisoning path;
    - model choice is a hiring decision, not training.
  - Security: high. Rejected.
- **D. No writes; advice only.**
  - Benefits: zero risk.
  - Costs: it is a diagnostic, and nothing is ever tested in the user's setup. The user loses the coach.

**Decision: B.**

**Contracts (additive to ADR-0001's `Adapter`).**

```ts
interface Trainee {
  id: string;                 // first 16 hex of sha256(setup \0 key); stable
  setup: string;
  key: string;                // adapter-chosen, opaque ("main", "agent-def:<relpath>")
  label?: string;             // display and grouping only, never logic (ADR-0001 rule 1)
  selector: { agent_labels?: string[]; agent_ids?: string[] };
  surfaces: WriteSurface[];
  runner: "available" | "none";
}
interface WriteSurface {
  id: string;
  kind: "managed_file" | "managed_block" | "skill_dir" | "user_rule";
  path: string;               // absolute; must lie inside the setup's declared rule roots
  scope: "project_local" | "project_shared" | "user_global";
  loads: "always" | "on_demand" | "path_gated";
  max_bytes: number;
  include?: { host: string; line: string };   // managed_file only, e.g. an @import line
}
// Adapter gains:
trainees?(d: Detection): Promise<Trainee[]>;
materialise?(t: Trainee, v: ContextVariant, ws: Workspace): Promise<RunEnv>; // part of the runner
```

- **Trainee config.** Users merge, split and rename trainees in `config.json` (`trainees: [{key, label, agent_labels}]`).
- **Unassigned events.** Events that match no selector go to trainee `unassigned`, which is reported and never trained.
- **Role ratchet.** The ADR-0001 role-identifier CI test extends to `src/train/`, `src/plan/` and `src/drills/`.

**Default surfaces in 0.1** (paths and import support are facts to check, §10):

| Adapter | Trainees | Overlay | Skills | User rules (actuator) |
|---|---|---|---|---|
| claude-code | `main`, plus one per agent definition | `managed_file` at `<project>/.claude/blackbelt/<trainee>.md`, included by one `@` line; for agent definitions, a `managed_block` in the definition file | `skill_dir` at `.claude/skills/bb-<slug>/` | CLAUDE.md levels, `.claude/rules`, agents |
| codex | `main` | `managed_block` in the nearest AGENTS.md, or an override file if Codex supports one | if supported | AGENTS.md hierarchy |
| otlp-json, canonical | per agent label | only what the `manifest` rule source declares; otherwise read-only (plan and drills, no training) | none | manifest |

- **Default scope.** The default scope is `project_local`. The actuator adds overlay paths to `.git/info/exclude`, never to `.gitignore`.
- **Shared items later.** `blackbelt export --shared` comes after 0.3: it copies adopted items into a tracked file for teams.

**Context items (R-ACE: itemised, delta updates, no full rewrites).**

```ts
interface ContextItem {
  id: string; trainee: string; surface: string;
  kind: "rule" | "procedure";          // a procedure renders as a skill
  text: string;                        // rule <= 600 chars; skill body <= 4 KB
  goal_id?: string; added_change: string;
  counters: { fired: number; helpful: number; harmful: number };
  status: "active" | "retired";
}
```

- **Source of truth.** The ledger holds `trainees/<setup>/<trainee>/items.jsonl`. The user's file is a rendering of it: a pure function, sorted by section and then id, with one anchor per item. The `RuleSource` therefore gives each coach item a `ruleId`, so never-fired detection and ablation judge the coach's own work (double loop).
- **Size gates.**
  - at most 2 KB of added text per change (ADR-0001);
  - always-loaded overlay at most 8 KB per trainee (a target value);
  - at most 4 KB per skill.
- **Retirement.** An item retires when `harmful > helpful + 2` (ADR-0001 §3.8 rule). It also retires when it has never fired for 4 weeks on an observable surface. Pinned items never retire.

**Drift (checked at every intake).** A rendered surface whose hash differs from the ledger was edited.
- **Edited by a coached session** (a `tool_call` to the path in that trainee's transcript): signal `tampered_by_agent`, then re-render from the ledger.
- **Edited by a human:** re-parse by anchors. Edited items take the human's text (the human wins), and the edit counts as a `rework` signal on the change that last wrote the item. Deleted items retire.
- **Unparseable:** `blocked(surface_drift)` for that surface; nothing is written to it.

**Versioning.** The ADR-0001 ledger is unchanged. `change.json` gains `trainee`, `surface`, `goal_id` and `item_ids`, and the kind `plan_update`. The actuator writes only after the ledger commit, and rollback is unchanged.

**Proposed constitution additions .**
1. The write surface never includes permissions, tool allowlists, hooks, MCP or harness settings, or the agent's own memory store. Rule roots and the surface list are user-only config. Suggestions for other layers are text only (ADR-0003); proposing is not writing.
2. Belt evidence comes only from sources the coach does not author (§3.5).

### 3.2 The weekly loop as a LangGraph.js state graph

**Options**

- **A. A deterministic pipeline with no model.**
  - Costs: it cannot write new guidance, only prune and revert. That is rule fitness, not training. The user loses the teaching.
  - Model cost: EUR 0.
- **B. One tool-using agent loop (ReAct) with all tools.**
  - Costs: the model would steer the spending and adopting steps, which breaks deterministic verdicts unless "decide" becomes a model tool. Guardrails and evals are hard. There are no stable checkpoints between paid steps.
- **C. A state graph.** Code owns control flow, measurement and every side effect. Model nodes only propose, through closed tools. This extends ADR-0001 §3.8.

**Decision: C.**

**Outcome.** Each trainee measurably stops repeating its recurring mistakes and earns belts. Every change is tested on exam drills, versioned and reversible.

**Triggers.**
- `blackbelt train`, run by hand or by the user's cron. No daemon is installed (ADR-0001).
- A new world signal: belts and demotion only, code only, no spend.
- A model or harness version change: invalidates noise floors and cached baselines.
- `blackbelt adopt <id>`: resumes a paused thread (0.1).

**Graph** (C = code, M = model). Thread id = `run_id`. There is one run per setup at a time (lock). Trainees run sequentially and share the budget.

```
intake(C) -> review(C) -> [per trainee: coach_trainee] -> exam_week?(C, 0.2) -> report(C) -> remember(C) -> END
coach_trainee:
  diagnose(M) -> curriculum(C) -> drills(subgraph C+M) -> screen(subgraph, loop<=3) -> exam(C) -> decide(C)
     -> adopt(C; 0.1: interrupt) -> challenge(C; +M memo in 0.2) -> belts(C)
```

1. **`intake`.**
   - Checks: lock, PAUSE, version pins, budget load, consent. Without standing consent the run interrupts with a manifest; unattended, it ends `blocked(consent)`.
   - Ingests and measures (ADR-0001). The report-card snapshot is the intake record.
   - Discovers trainees and checks drift.
2. **`review`.** Follows up on earlier adoptions:
   - attributes world signals;
   - runs the transfer test per goal (§3.3);
   - updates coach precision (ADR-0001: the share of adoptions with no rollback or negative signal in 30 days; refined by the self-check in §3.6, #19);
   - reverts automatically when a severe signal is attributed to a change (pure-code rollback).
3. **`diagnose` (M).**
   - Reads findings through read tools and emits `propose_goal`, which must reference existing finding ids.
   - It may also emit `propose_enforcement`, only when the owner router abstained or code heuristics found no check with at least one replay catch (ADR-0003 §3.6).
   - It is skipped, at no cost, when no new clusters appeared.
4. **`curriculum`.** Scores goals, fills slots and picks the focus goal (§3.3). It writes a plan revision as a ledger commit.
5. **`drills` (subgraph).** Episode extraction, then checker choice: code heuristics first, with M `choose_checker` only when those fail. Then validation, split and store (§3.4).
6. **`screen` (subgraph, Voyager-style refinement, R-VOY).**
   - `propose_intervention` (M), then `validate` (C, below), then `run_screen` (C: runner, k=1, on screen drills).
   - If the screen pass rate does not rise, the failures (tool-call heads, paths, checker messages, quoted) feed the next proposal.
   - At most 3 iterations, then `no_candidate`.
   - A goal with 0 screen drills gets one single-shot candidate per cycle and no loop on exam drills.
7. **`exam`.** Budget pre-flight first; on failure, checkpoint and end `budget_exhausted`. Then:
   - incumbent baseline: k=6 on first measure (runs 1-3 vs 4-6 give the A/A noise floor), k=3 on re-baselines. It is cached by context hash, model, harness and drill-set version.
   - candidate: k=3.
   - retention sample: up to 2 drills of earlier goals, k=3 per arm.
8. **`decide`.** The rule follows below.
9. **`adopt`.**
   - 0.1: a LangGraph `interrupt`. The change is written to `pending/<change_id>/`, and `blackbelt adopt <id>` (terminal only) resumes the thread.
   - 0.2+: autonomous. PAUSE re-check, constitution check, ledger commit, actuator, hash verify.
   - A pending change expires after 14 days or when the incumbent's hash changes; its evidence is then stale.
10. **`challenge`.** The double loop (§3.6). The parts #18-#21 run in 0.1. All are report-only, and the user adopts every change. None of them runs inside this node; each bullet names where it runs.
    - Rules the user's corrections contradict (#18): on the report card, as candidates only, never verdicts. "Rule may be wrong" and "rule is ignored" are listed apart. Matching is deterministic and counts only turns the user typed.
    - The coach's track record (#19): in `review` and on the report card. Its only effect is that the coach raises its own bar.
    - Rule polarity label (#20): on the report card. It describes wording only and is never advice.
    - Unsealed context check (#21): started by the user, outside the weekly cycle (§3.6).
    - In 0.1 the node itself is code only (the deterministic challenge of §3.7) and reviews the drills of `no_transfer` goals (§3.3).
    - The sealed exam week, the foundation memo and autonomous adoption wait for 0.2.
11. **`belts`.** Ladder evaluation (§3.5).
12. **`report`, `remember`.** As in ADR-0001; `remember` also merges the intervention priors.

**`validate`** (code). ADR-0001's checks apply: schema, permission, size, secret scan, dedupe, work-type classification. Added here:
- the surface must be in the trainee's list;
- the always-loaded cap holds after the change;
- the leakage critic rejects a normalised 8-gram overlap of 3 or more with any exam drill's text or any canary. It runs in code; it moves into the oracle with the seal.

**`decide`** (code; ADR-0001 §3.7 statistics plus small-n handling):
- Per exam drill t: d_t = pass(candidate) - pass(incumbent), each the mean over k runs.
- **ADOPT** requires all of:
  - (a) mean d ≥ NF;
  - (b) significance: for fewer than 10 drills, the exact one-sided paired sign-flip test gives p ≤ 0.05; for 10 or more, the task-level bootstrap 95% lower bound (B = 10,000, recorded seed) is above 0;
  - (c) cost gate: more than 25% extra tokens per task requires mean d ≥ 2×NF (our rule, motivated by R-RRSI, which instead allows cost growth that rises with score gain above its noise band);
  - (d) retention: no retention drill drops from 3/3 to 1/3 or less, and mean d on retention ≥ -NF;
  - (e) the size gates hold;
  - (f) from 0.2, oracle accept and the seal not breached.
- **REJECT:** mean d ≤ 0, or the upper bound is below NF.
- **INCONCLUSIVE:** add k=3 next cycle, at most 2 carries, then REJECT with the minimum detectable effect stated.

Why at least 5 exam drills: with n drills, the smallest exact p-value is 2^-n. Four drills give p = 1/16, so a verdict is never possible.

**NF details.**
- NF is pooled per (trainee, model id, harness version) over every drill with an A/A measurement. The pool grows over weeks, which sharpens it.
- NF is floored at 0.10.
- Exam submissions are capped at 4 candidates per goal per drill-set version. The number is ours; R-HOLD motivates limiting reuse but gives no guarantee at this sample size. After that, the goal needs new exam drills.

**Closed action set for model nodes.**
- **Read** (quoted, provenance-tagged): ADR-0001's read tools, plus `get_plan`, `get_goal`, `get_items(trainee)`, `get_surface(trainee)` and `get_screen_result(goal, candidate?)`.
  - No tool reads exam drills. The registry holds no handle to `drills/**/exam`, and a test asserts this.
- **Propose** (state only, no side effects):
  - `propose_goal{finding_ids, kind: fix_mistake|prune, work_type, hypothesis<=300}`
  - `propose_enforcement{finding_id, template, params}` (ADR-0003)
  - `choose_checker{drill_id, template, params}`
  - `propose_item_add{trainee, surface, kind, text, goal_id}`, `propose_item_edit{item_id, text}`, `propose_item_retire{item_id, reason}`
  - ADR-0001's `propose_rule_edit/delete/add` for user rules
  - `propose_drill_retire{drill_id, reason: flaky|saturated|uncorrelated_with_world}`
  - `propose_bar_change` (ADR-0001, closed evidence enum)
  - `finish`

**Guardrails in code** (in addition to ADR-0001 §3.8):
- at most 3 screen iterations per goal per cycle;
- at most 1 adoption per goal and 2 per trainee per cycle, so world signals attribute cleanly;
- at most 3 active goals, 1 new per cycle;
- at most 2 enforcement suggestions per cycle; none without a replay catch (ADR-0003);
- per drill run: a token cap of max(2× the original episode's tokens, 30k), EUR 0.40, and 300 s;
- PAUSE checked before every runner launch and every write;
- fail closed: any guard failure gives `blocked(<reason>)`.

**State.**

```ts
interface TrainState extends CycleState {          // CycleState from ADR-0001 §3.8
  trainee_queue: string[]; trainee?: string;
  plan_ref?: string; focus_goal?: string; drills_ref?: string;
  screen: { iteration: number; candidate?: Intervention; results?: ScreenResult[] };
  exam?: ExamResult; verdict?: "ADOPT" | "REJECT" | "INCONCLUSIVE";
  pending: string[];                 // change ids awaiting `blackbelt adopt` (0.1)
  belts_delta: BeltChange[]; challenge: ChallengeFinding[];
}
```

State holds references, never transcript or drill text.

**Memory.**
- **Short-term.** ADR-0001 checkpoints. The adopt interrupt is a resumable thread, and idempotency keys prevent double writes.
- **Long-term (coach), per setup.**
  - ADR-0001's `experiments`, `noise_floors` and `playbook` (the coach's own lessons).
  - New: `interventions.jsonl`, numeric records of (mistake signature class, intervention kind, surface kind, verdict, transfer). These feed the curriculum's tractability prior. It also takes the kind `enforcement_suggestion`, with `added` and recurrence before and after (ADR-0003).
  - Per machine: `memory/_priors.json`, counts only, never text, across setups.
- **Trainee context items** (the Knowledge layer, ADR-0003; not the agent's own memory). Source of truth in the ledger, edited by the user through the managed file or `blackbelt rollback`. The coach never writes the agent's own memory store.
- **Read-back.** Memory, items and drill text are untrusted data, rendered as quoted blocks.
- **No secrets.** None in memory, items or drills; the secret scan runs at write time.

**Human in the loop.**
- **0.1.** Every adoption is approved in a terminal (no autonomous apply before the seal). What the human sees:
  - the goal and the exact text diff;
  - exam pass before and after, with CI, NF, k and the number of drills;
  - the retention result and the token cost change;
  - the label "dev set (visible)" and the rollback command.
- **Always.** The consent manifest before content leaves the machine.
- **0.2+.** No interrupt for reversible changes; world signals and rollback carry the risk.

**When unsure or wrong**

| Situation | Coach action | User sees |
|---|---|---|
| Fewer than 5 validated exam drills | Goal stays `watching` | "needs 5 exam drills, has 3" |
| No runner on this setup | Plan and drills only | "training not available on this setup. plan and drills still work." |
| Drill not reproducible (incumbent passes ≥ 0.9) | Goal `watching`; drill flagged | "the agent passes this drill; the mistake is context-dependent" |
| Inconclusive | Carry, at most 2 cycles | MDE stated |
| Budget short | Checkpoint; resume next cycle | "this step needs EUR x" |
| Drift unparseable | Surface blocked | Path and fix |
| Drills passed but no transfer | Goal `no_transfer`; drills reviewed | Top of plan |

**Evals for the coach (CI, red first; bars before each release).** A `sim` runner (test-only) uses synthetic trainees. Each trainee's pass probability per drill class is a seeded function of tokens present in its context. A planted fixing token raises one class from 0.2 to 0.9; a planted harmful token drops retention by 0.4. This runs the whole graph at zero cost.

| Area | Bar | Release |
|---|---|---|
| Planted fix found and adopted within 3 cycles | ≥ 0.8 of seeds | 0.1 |
| Null interventions adopted | ≤ 5% | 0.1 |
| Harmful interventions adopted | 0 | 0.1 |
| Always-pass or empty-run-passing checkers admitted | 0 | 0.1 |
| Proposer access to exam drills (tool registry test) | 0 handles | 0.1 |
| Injected instructions in transcripts, items or memory leading to adoption | 0 | 0.1 |
| Drill or goal text in the ShareModel or ledger diffs (canary test) | 0 | 0.1 |
| Estimated belt replay byte-identical on re-run | 100% | 0.1 |
| More than one belt step per evaluation (property test) | 0 | 0.1 |
| Budget overrun; actions after PAUSE; rollback restore | 0; 0; byte-identical | 0.1 |
| Runner outward attempts that escape the shims (fixture agent) | 0 at `shimmed` with absolute-path probes reported | 0.1 |

Model nodes are tested on recorded fixtures. Each release also gets a live smoke run on `fixtures/demo` with its cost reported.

**Observability.** ADR-0001 traces, plus per drill run: tokens, EUR, wall time, verdict, checker id and version, purpose (baseline, screen, exam, retention). Per cycle: spend against the cap.

### 3.3 The development plan

**Options**

- **A. A markdown plan in the user's repo.**
  - Costs: it holds goal text derived from transcripts (data rules), pollutes repos, and progress cannot be computed from it.
- **B. Typed JSON in `~/.blackbelt/plans/`, committed to the ledger, with immutable weekly revisions and rendered views:** terminal, `--md` export, and aggregates in the share page.
- **C. The plan injected into the trainee's context.**
  - Costs: an untested intervention that mixes bookkeeping into the prompt. If useful, it can be proposed and examined like any item.

**Decision: B.** The plan is never injected into the context.

**Schema** (zod in `src/core/plan.ts`, published as `schema/plan.v1.json`):

```ts
interface DevelopmentPlan {
  schema: 1;
  plan_id: string;                 // "<trainee>@<ISO week>"
  trainee: { id: string; label?: string }; setup: string;
  week: string;                    // "2026-W48"
  created_at: string; coach_version: string;
  intake: { report_id: string; window: { from: string; to: string }; detectors: Record<string, string> };
  belts: BeltStatus[];             // §3.5
  goals: Goal[];                   // active, then watching, then closed in the last 8 weeks
  this_week: { focus_goal?: string; spend_eur: number; cap_eur: number;
               adopted: string[]; pending: string[]; reverted: string[] };
  next_week: { focus_goal?: string; reason_code: "continue"|"carry"|"new_goal"|"transfer_check"|"budget" };
  labels: ("dev set (visible)" | "sealed" | "estimated")[];
}
interface Goal {
  id: string;                      // "g-" + first 8 hex of sha256(trainee \0 cluster_id)
  kind: "fix_mistake" | "prune";
  status: "watching"|"active"|"drills_passed"|"mastered"|"stalled"|"no_transfer"|"dropped";
  work_type: string; cluster_id?: string;
  title: string;                   // local only (cluster label); never in ShareModel
  owner?: Owner;                   // goals from a recurring mistake (ADR-0003)
  suggestion?: { template: CheckerKind;
                 replay: { fired: number; calls: number; on_mistake: number; elsewhere: number;
                           caught: number; of: number; days: 30 };
                 added?: string };
  evidence: { recurrence_per_100: MetricValue; occurrences: number; sessions: number; last_seen: string };
  edge: { incumbent_screen_pass?: number; tier: "unknown"|"edge"|"beyond"|"not_reproducible" };
  drills: { screen: number; exam: number; checker_kinds: CheckerKind[] };
  interventions: { change_id: string; surface: string; verdict: "ADOPT"|"REJECT"|"INCONCLUSIVE";
                   d: number; ci: [number, number]; nf: number; n_tasks: number; k: number;
                   state: "pending"|"applied"|"rolled_back"|"rejected" }[];
  progress: { week: string; exam_pass?: number; exam_ci?: [number, number];
              world_recurrence_per_100?: number; n_items: number }[];
  transfer: "pending" | "confirmed" | "not_shown";
  opened: string; closed?: string;
}
```

**Status machine (code).**
- **watching:** the cluster qualifies but has fewer than 5 validated exam drills, or is not reproducible.
- **active:** drills ready and a slot granted.
- **drills_passed:** an applied intervention gives exam pass ≥ 0.8 in 2 consecutive cycles.
- **mastered:** drills_passed and transfer confirmed.
- **no_transfer:** drills_passed, but no transfer after 4 weeks. The challenge reviews the drills.
- **stalled:** 3 focused cycles without an ADOPT. It leaves the slots for 4 weeks (R-VOY: revisit later).
- **dropped:** no recurrence for 8 weeks without intervention, or `blackbelt plan drop`.

**Transfer test (the outside standard).** It measures new human corrections assigned to the goal's cluster (deterministic MinHash assignment to the frozen centroid), per 100 work items of the goal's work type.
- Compare the 28 days before adoption with days 7-35 after.
- The exact conditional binomial test on the Poisson rate ratio decides: an upper 95% bound below 1 means `confirmed`.
- Too few items means `pending`. After 4 weeks without confirmation the result is `not_shown`.

**Curriculum (code, deterministic; inspired by R-VOY's LLM-proposed curriculum).**
- **Eligible goals:** clusters that qualify under ADR-0001 §3.2 (at least 3 members across at least 2 sessions), mapped to the trainee and a work type.
- **Priority** = recurrence_per_100 × w × gap × edge × prior, where:
  - w = 2 for work types the user marks irreversible, else 1;
  - gap = 1.5 when this work type is the trainee's nearest next belt and corrected share is its binding metric, else 1;
  - edge = 0.75 unknown, 1.0 edge (0.1 ≤ incumbent screen pass ≤ 0.9), 0.5 beyond (< 0.1), 0 not reproducible;
  - prior = a Beta-smoothed adoption rate for the (signature class, intervention kind) pair from coach memory, clamped to [0.5, 1.5].
- Ties are broken by goal id.
- **Slots:** at most 3 active goals, 1 new per cycle. The focus is the top active goal whose next step fits the budget.

**Week over week** (`blackbelt plan`; this README example is synthetic):

```text
blackbelt plan · main · 2026-W48 · week 4 of training

belts (estimated: they grant nothing yet)
  docs   green belt, 2 stripes     tests  yellow belt, 3 stripes
  code   yellow belt, 1 stripe     infra  white belt

goals
  1  runs the tests before saying done      code  active
     comes back 6.1 -> 1.4 per 100 code items (transfer pending) · exam 1/5 -> 4/5  (+0.60, p=0.03, noise floor 0.13)   dev set (visible)   adopted c-7f3a
  2  edits files outside the asked scope    code  drills passed, transfer pending (week 2 of 4)
  3  edits generated files by hand          docs  watching: needs 5 exam drills, has 3

this week  EUR 6.40 of 10 · 1 adopted · 0 rolled back · 1 waiting: blackbelt adopt c-91be
history    week                 W45     W46     W47     W48
           code belt            white   yellow  yellow  yellow
           corrected share      18%     14%     11%     9%
```

`--history` shows every week's goals; `--md` exports. The share page gains `plan: {weeks_trained, goals_by_status, adopted, rolled_back, belts_timeline[{week, work_type, belt, stripes}]}`. These are numbers and enums only, and the canary test covers them.

### 3.4 Drills

**Options**

- **A. Replay drills.** The user's own episode is re-run in a disposable clone of the user's repo at the episode's commit. The prompt is the original request, scrubbed. The checker comes from a closed template set and is validated against the recorded trajectory and git states.
  - Benefits: highest fidelity. No model is needed to make the task, and validation is deterministic.
  - Costs:
    - it needs a commit near the episode (dirty trees give `approximate`);
    - runs cost more (EUR 0.10-0.40 per run, to check);
    - scrubbed request text is stored locally ;
    - the agent runs on copies of user code, so runner isolation is required.
- **B. Synthetic drills.** A model writes a small fixture, a prompt, a reference solution and a mistake solution.
  - Benefits: cheap runs, no user text after a leak check, and shareable in a future drill library.
  - Costs:
    - the model sees cluster excerpts (consent if cloud);
    - generated checkers can be wrong even after automated filters (71% correct in one manual sample, R-CHK), so the reference and mistake solutions must be run;
    - transfer to real code is uncertain.
- **C. Template drills from a built-in fixture bank.**
  - Benefits: free and deterministic.
  - Costs: generic, not the user's mistakes.
- **D. The user's own eval suites only**.
  - Costs: most users have none.

**Decision.** In 0.1, A plus D where present. In 0.3, B adds cheaper screen drills while exam drills stay replay drills. C serves as fixtures for the coach's own evals.

**Episode extraction (code).**
- **The episode:** from the human message before the corrected agent turn up to the correction.
- **Workspace and base commit.** Session cwd, then the repo root, then a base commit:
  - the parent of the first commit made in the session, if there is one (`state_quality: exact`);
  - otherwise the last commit before the episode (`approximate`).
- **Request text:** read through `readText`.
- **Agent behaviour:** tool classes, `cmd_head` and paths from the episode.
- **Corrected evidence:** the post-correction segment, and a later commit in the same session if one exists.

**Checker templates** (closed enum, versioned; trace evaluators in `src/core/checks/`, shared with replay (ADR-0003); admission in `src/drills/checkers/`; composite = AND of at most 3):

| Kind | Asserts | Validated against |
|---|---|---|
| `trace_forbid` | never calls tool class or `cmd_head` X, or writes under glob G | the original trajectory violates it |
| `trace_require` | calls X after its last write and before finishing | the original violates it |
| `trace_order` | X before Y | the original violates it |
| `scope` | changed files lie within the allowed globs | the original's paths violate it |
| `state_cmd` | a command exits 0 in the final workspace | fails on the mistake state; passes on the corrected state when one exists |
| `state_match` | path or regex present or absent | same |

- **Rubrics** are audit only and never decide.
- **Parameters** come from code heuristics over cluster features (`cmd_head`, paths, `ruleId`, tool classes before and after the correction). `choose_checker` (M) is a fallback, and its output passes the same validation.

**Admission (all in code; our own guard against vacuous graders, motivated by R-GG's always-pass collapse):**
1. Deterministic: the same recorded output, checked twice, gives the same verdict.
2. Fails on the original mistake.
3. Passes on the corrected state or trajectory when that evidence exists.
4. An empty run (the agent does nothing) fails. Every drill therefore needs at least one `trace_require`, `state_cmd` or `state_match`.
5. Estimated p90 cost is at most EUR 0.40, from the episode's own `usage` events.

**Split.**
- Seeded, and grouped by session, so no session spans splits.
- Exam drills fill first, up to 5. After that, new drills alternate between screen and exam.
- Exam drills are immutable. They retire only with evidence: `flaky | saturated | uncorrelated_with_world | source_lost`.

**Store** (`~/.blackbelt/drills/<setup>/<trainee>/<goal>/<drill_id>/`, mode 0600).

```ts
interface Drill { schema: 1; id: string; trainee: string; goal_id: string;
  split: "screen" | "exam"; source: "replay" | "user_suite" | "synthetic";
  workspace: { repo_root: string; commit: string; state_quality: "exact" | "approximate" };
  request_ref: "request.txt";              // scrubbed (secret regex set), <= 4 KB
  checker: { kinds: CheckerKind[]; params: Record<string, unknown>; version: string };
  validation: { deterministic: true; fails_on_mistake: true; passes_on_fix: boolean | "no_evidence"; empty_run_fails: true };
  cost: { p90_eur_est: number; token_cap: number; timeout_s: 300 };
  canary: string; created: string;
  retired?: { at: string; reason: "flaky" | "saturated" | "uncorrelated_with_world" | "source_lost" } }
```

- **Never leaves the machine,** except to the coached agent's own model provider during its runs, which the consent manifest lists as "drill runs: N, to <provider>".
- **Kept out of:** the ShareModel, ledger diffs and coach model calls for exam drills.
- **Retention:** 180 days after the goal closes; `blackbelt drills forget` and `purge` delete.
- **In 0.1:** canaries are scanned at ingest (ADR-0001 G3). A hit voids that goal's exam results. The label is "dev set (visible)".
- **In 0.2:** exam drills move into the seal and the label becomes "sealed".

**Runner** (`adapter.run`, pulled from ADR-0001 Phase 2 into 0.1 for Claude Code).
- **Workspace:** `git clone --local --no-hardlinks` at the commit into a temp dir, with remotes removed and no user hooks.
- **Config:** an isolated config dir with the materialised incumbent or candidate context, tagged F0.
- **Environment:** an allowlist (PATH with shims, LANG, TERM, the provider key variable named in config). HOME is the temp dir. No git, cloud or CI tokens.
- **Outward shims:** a closed list (`git push`, `npm publish`, `gh`, `curl`, `wget`, `ssh`, `scp`, `docker push`, `kubectl`, `terraform`). Each shim logs to the trace and exits non-zero. Trace checkers read the log.
- **Isolation level,** shown like seal strength:
  - `shimmed`: the default, bypassable by absolute paths;
  - `sandboxed`: harness sandbox with network deny except the provider (fact to check);
  - `isolated`: container, opt-in.
- **Caps:** as in §3.2.
- **Run transcripts:** kept in `runs/<run_id>/` for 30 days and never ingested as user history.

**Cost** (estimates to check; the ADR-0001 pre-flight ×1.2 applies):

| Activity | Runs | At EUR 0.15/run | At EUR 0.30/run |
|---|---|---|---|
| First baseline of a goal (5 exam drills × k=6; gives NF) | 30 | 4.50 | 9.00 |
| Screening (2 drills × up to 3 iterations, plus incumbent) | 8 | 1.20 | 2.40 |
| Candidate exam, with incumbent re-baseline k=3 when the context changed | 15-30 | 2.25-4.50 | 4.50-9.00 |
| Retention sample (2 drills × k=3) | 6 | 0.90 | 1.80 |
| Model nodes | n/a | ~0.30 | ~0.30 |

- **Cadence.** At EUR 0.15 per run, one goal goes from baseline to verdict in about 2 cycles, and then about one adoption decision a week. At EUR 0.30, about one every 2 weeks. Drills above EUR 0.40 per run are rejected as too expensive. The monthly worst case stays EUR 43 (ADR-0001).
- **Spend priority (code):**
  1. free work;
  2. open experiments, to a verdict;
  3. retention of adopted items;
  4. the focus goal;
  5. screening for the next goal.

### 3.5 Belts, stripes and ladder thresholds (fills ADR-0001's gap)

**Mapping.** White = R0 watch, yellow = R1 propose, green = R2 act with review, brown = R3 autonomous with sampled audit, black = R4 irreversible (ADR-0001).
- Belts are an entrustment ladder: trust granted per kind of work from outside evidence. They are not a Dreyfus competence model.
- Belts are keyed per (trainee, work type) .
- Black exists only for work types the user marks irreversible (ADR-0001). Reversible types top out at brown .

**Evidence: an outside standard only (constitution addition).**
- Counted: human corrections (L0 and L1; L2 once its precision passed, ADR-0001 §3.2) and world signals (ADR-0001 §3.6).
- Never counted: drills, judges, or anything the coach authors.

**Definitions.**
- **Work item:** a (session, work type) pair with at least one `write` or `exec` tool call matched by the taxonomy, in a finished session of the trainee.
- **Corrected item:** a correction Finding after the item's first matched call, attributed to the work type of the last `write`/`exec` call before the correction. Only interactive items count here.
- **Failed item:** an attributed `revert | rework | ci_fail | incident` within 14 days. Attribution `exact` or `window` counts. `ambiguous` counts against every candidate change, shown as such.
- **Severe signal:** an `incident`, or a revert of irreversible-type work.
- **Required capabilities:** `human_turns`, `tool_calls` and `tool_paths` for corrected share; `outcomes` (git) for failed share.
  - A missing capability makes that metric "not measurable".
  - Belts above yellow then show "not measurable on this setup", never an estimate.

**Thresholds** (Wilson 95% upper bound U; trailing window 28 days, 90 days for black; evaluated weekly):

| Belt | n items in window | U(failed share) | U(corrected share) | Met at consecutive weekly evaluations since the last belt change |
|---|---|---|---|---|
| yellow | ≥ 10 | ≤ 0.30 | ≤ 0.50 | 2 |
| green | ≥ 30 | ≤ 0.15 | ≤ 0.30 | 2 |
| brown | ≥ 60 | ≤ 0.08 | ≤ 0.15 | 3 |
| black | ≥ 100 (90 days) | ≤ 0.04 | ≤ 0.08 | 4, plus `dry_run`, `canary`, `backup` capabilities and a restore drill within 30 days |

What the numbers mean:
- Green needs zero failures in 30 items (0/30 gives U = 0.114; 1/30 gives 0.167, which fails) and about 13% corrected or less.
- Brown needs zero failures in 60 (U = 0.060), or 1 in 80.
- Black needs zero in 100 (U = 0.037).

ADR-0001's placeholders cannot be met at their minimum n: 0/20 gives U = 0.161, against a 5% threshold. They are replaced.

**Who may change what.**
- The black row and the safety net are constitution.
- The yellow-to-brown rows are target values: the coach may change them, and each change carries `bar_effect`.

**Promotion and demotion.**
- **Promotion:** at most one belt per evaluation (constitution).
- **Demotion,** code only, at every evaluation and on every new world signal:
  - a severe signal drops the type to yellow at once;
  - a Wilson lower bound of either share above the current belt's threshold drops it one belt;
  - an adapter degrading freezes the belt. A frozen belt is never raised, and `gate check` treats it as at most yellow.

**Estimated belt (0.1).**
- The ladder is replayed from white over stored history, one evaluation per ISO week. The output is byte-deterministic, and it is the same function the live ladder uses.
- With 30 days of history the maximum is green: yellow at week 2, green at week 4. Brown needs at least 7 weeks of evidence, black at least 11.
- From 0.3, the live ladder starts at the lower of the estimate and green.

**Stripes** (0-4, toward the next belt):
- They are computed only when both point estimates are at or under the next belt's thresholds. Otherwise: 0 stripes and "off track: <metric>".
- progress = min( n/n_min, n/n_req, evaluations_met/s ). n_req is the smallest n at which the current rates give a Wilson upper bound at or under the threshold (a deterministic search).
- stripes = floor(4 × progress).
- Four stripes means "the evidence is in". It shows only while promotion waits on something outside the evidence: the next evaluation, or the black safety net.

**Headline.**
- Per trainee: the highest belt held by any work type that meets that belt's n_min, with the types at that belt ("green belt · docs and tests").
- The badge's default trainee is the one with the most items.

**`blackbelt badge [--agent A] [--work-type W] [--out FILE]`.**
- Renders `assets/badge-<belt>.svg` locally, with no network.
- The text is `est. <belt> belt` until belts go live (0.3).
- It carries only the belt colour and an optional work-type name (ShareModel rules).

### 3.6 "Would it hire itself": self-check, estimate and exam week

**Coach self-check (0.1, #19).** Every cycle, free.
- **Per adopted change:** held, rolled back, or followed by worse outcomes, with the sessions behind it.
- **Evidence:** rollbacks and outside outcomes, never the user's approvals or the coach's own judgement. A change whose only evidence of success is the coach's own judgement is "unknown", not a win.
- **Shown** in `review` and on the report card: wins and losses listed separately, a range, the number of runs, and the label "observational, no control group".
- **Window and attribution:** 30 days (ADR-0001). Negative signals are attributed as in §3.5; `ambiguous` counts against every candidate change, shown as such.
  - **Loss:** rolled back, or a negative signal attributed to the change within 30 days ("followed by worse outcomes").
  - **Win** ("held"): 30 days old, no rollback, no attributed negative signal, and at least one outside outcome observed in the window (a finished work item of that work type without correction or failure).
  - **Unknown:** not yet 30 days old and not lost, or no outside outcome (only the coach's own judgement).
- **Precision** = wins / (wins + losses). Unknown changes are left out and shown separately. This refines ADR-0001's coach precision (§3.2, step 2).
- **Bar:** if precision falls below 0.7 over at least 10 adoptions with a known outcome, the adoption bar doubles for 4 cycles, and the report says so. The 0.7, the 10, the doubling and the 4 cycles are configurable starting values to tune.

**Unsealed estimate (0.1, #21).** Does the context earn its place? Full criteria are in #21.
- **Start:** by the user, outside the weekly cycle. Every output is labelled "unsealed estimate".
- **Arms:** with the context against without it. Whole groups only (files or sections), never single rules. An A/A run measures the noise floor.
- **Reports,** in this order: per-rule compliance; cost and steps; pass rate, only when a pilot shows that the user's budget can reach it.
- **Verdicts** (code): "earns its place", "hurts", "no meaningful effect", or "inconclusive" when it can't tell.
- **Budget and consent:** the user sets the budget for each run. Before any paid run it shows drills × runs, the smallest detectable effect and the cost estimate, and waits for the user's go. The consent manifest applies.
- **Drills:** exam drills, which screening never uses. The coach has already selected changes on them, and there is no technical barrier against leakage, so the result is only an estimate. It is biased in favour of coach-added items, because they were selected on these drills, and the output says so.
- **Controls:** it takes the setup lock, checks PAUSE before every launch, and uses the per-run caps of §3.2 and the budget meter, with a hard stop at the user's budget for that run. That budget is separate from `budget.cycle_eur`, so it is outside the EUR 10 cycle cap and the monthly worst case.
- **Limit:** it is never the basis for adoption or deletion on its own.

**Exam week (from 0.2)**

**Options**

- **A. On demand only** (`blackbelt hire`).
  - Costs: the double loop never fires unless the user asks.
- **B. A monthly exam week inside the loop.**
- **C. Every cycle.**
  - Costs: about 3× the budget.

**Decision: B, from 0.2.** The exam week decides things, so it needs the seal: comparing against exam drills the coach has optimised against is self-grading (R-GG, R-HOLD). The 0.1 unsealed estimate runs without the seal because it decides nothing.

**How it runs.**
- Every 4th cycle replaces screening.
- **Suite:** sealed exam drills of all goals (including mastered), the retention set, and the user's own suites.
- **Arms:**
  - `current` against `week0`, the ledger snapshot at the trainee's first `train`: "is training working?";
  - `current` against `bare`, an empty context with harness defaults: "does its context earn its place?".
- **Rules:** k ≥ 3, paired, NF, cost gate, deterministic checkers. Judges anonymised and audit-only. Tasks without a checker are "audit only".
- **Cost:** 2 arms × k=3 × about 10 tasks = 60 runs (EUR 9-18). It spans 2 cycles when needed.

**Outcomes (code).**
- **HIRE over week0:** shown as evidence of training.
- **NO HIRE, or week0 better:** "he would not hire his own training".
  - The adoption bar doubles (2×NF) for 4 cycles.
  - Items adopted since week0 enter halving group ablation (ADR-0001 §3.7).
  - The result goes to the top of the plan.
- **`current` not hired over `bare`:** the context does not earn its place.
  - A foundation memo (M, report-only proposals, closed evidence enum).
  - Rule-group ablation and delete proposals, applied under the reversible-change rules.

### 3.7 Release plan (replaces ADR-0001 §6)

**Options**

- **A. ADR-0001 phasing (0.1 = report card).**
  - Costs: contradicts the training-loop framing.
- **B. 0.1 = report card plus plans, no screening.**
  - Costs: homework that is never tested; a diagnostic.
- **C. 0.1 = the closed loop with human adoption; seal and autonomous adoption in 0.2; earned belts in 0.3.**
- **D. 0.1 = everything through autonomy.**
  - Costs: months later, and it ships the risky parts before anyone has used the safe ones.

**Decision: C.**

| Release | Content | Not yet |
|---|---|---|
| **0.1: the coach; you hold the pen** | ADR-0001 Phase 1 (core, 4 ingest adapters, 3 rule sources, L0/L1, `label`, report card, share, read-only plugin commands); estimated belts and stripes; `badge`; trainees and write surfaces (claude-code; codex as a read-only trainee); Claude Code runner (`shimmed`); budget meter, consent manifest, NF; replay drills, checkers, admission, split, canary scan; plans; the train graph with adopt interrupt and deterministic challenge; report-only: contradicted rules (#18), coach track record (#19), rule polarity label (#20); unsealed estimate of whether the context earns its place (#21); ledger, actuator, `adopt`, `rollback`, `pause`/`resume`; sim-trainee evals | seal and oracle, autonomous adoption, `gate check`, `hire`, sealed exam week, halving and delete proposals from group ablation (block 2b), judges, L2, synthetic drills, foundation memo, Codex runner |
| **0.2: the sealed exam; he adopts alone** | seal G1-G4 and oracle (ADR-0001 §3.5) holding exam drills; autonomous adoption of reversible changes; sealed exam week and `hire`; audit-only judge panel; foundation memo; Codex runner; `signal add`, CI signals | live belts |
| **0.3: earned belts** | live ladder, `gate check`, belts unlock yellow to brown; group ablation (block 2b); synthetic screen drills; exec adapters | black |
| **0.4+** | black (R4 safety net, restore drills); held-out authoring tools; opt-in synthetic drill library (own ADR); fleets (own ADR); hosted share (own ADR, Sensitive) | |

- **Internal milestones for 0.1**, each private and unpublished:
  - M1: report card and estimated belts;
  - M2: plans (diagnose and curriculum, no runner);
  - M3: runner and drills;
  - M4: the train loop, ledger and adopt.
- **Publishing** stays Sensitive.
- **v1 blocks:** 1 and 2a ship in 0.1, together with the report-only parts #18-#21; 3 and 4 in 0.2; 2b in 0.3. This order follows the training-loop framing, which supersedes ADR-0001 phasing.

### 3.8 CLI verbs and honest README claims

| Verb | Does | From | Terminal-only (loosens a control) |
|---|---|---|---|
| `report` (default), `--share` | report card | 0.1 | |
| `badge` | belt SVG, local | 0.1 | |
| `rules`, `label`, `status` | as ADR-0001 | 0.1 | |
| `plan [--agent A] [--history] [--md]`, `plan drop <goal>` | development plan | 0.1 | |
| `train [--dry-run]` (alias `cycle`) | one cycle; `--dry-run` shows plan, drills and cost manifest and spends nothing | 0.1 | first run only (include line, consent) |
| `adopt <change_id>` | apply a change that passed its exam | 0.1 | yes |
| `rollback <id>\|--last\|--since DATE` | ADR-0001 | 0.1 | yes |
| `pause` / `resume` | ADR-0001 | 0.1 | `resume` only |
| `drills list\|show\|forget` | drill store | 0.1 | |
| `memory list\|show\|forget\|pin` | ADR-0001 | 0.1 | |
| `purge` | delete | 0.1 | |
| verb to be named in #21 | unsealed estimate (§3.6) | 0.1 | the go before spending |
| `hire`, `seal add\|retire\|status`, `signal add` | | 0.2 | `seal` |
| `train --propose-only` | opt out of autonomous adoption | 0.2 | |
| `gate check`, `ablate` | | 0.3 | overrides |

**README claims**

| Release | May claim | May not claim |
|---|---|---|
| Before 0.1 (now) | "in progress (0.1): the coach: report card, a development plan per agent, drills from your own mistakes, changes you adopt" | any number not labelled "example" |
| 0.1 | "He writes a development plan for each agent, builds drills from your own recurring mistakes, runs them, and offers only changes that beat the noise floor. You adopt with one command; `rollback` undoes it." Results labelled "dev set (visible)"; belts "estimated, grant nothing"; EUR 10 cap; training on Claude Code, plans for any setup; says where a fix belongs, or that he can't tell; suggests a hook or check as text with how often it would have fired (ADR-0003) | "trains on its own", "held-out" or "sealed", "earned belts", "improves your agent by X%" without a benchmark with a stated method, training on any setup, installs hooks or checks, "would have prevented", improvement across layers |
| 0.2 | "adopts changes on his own after a sealed exam" (with the seal strength shown); "once a month he asks whether he would hire your agent again: against its week-one self, and against no rules at all" | earned belts |
| 0.3 | "belts unlock autonomy"; badges drop "est." | black belt for reversible work |

When this ADR is accepted, the generated README blocks change: the belts table is filled from §3.5, and the commands and roadmap are updated .

## 4. Threat model additions

| Threat | Control | Detection |
|---|---|---|
| The agent edits its own overlay | Drift re-render; the wall on `BLACKBELT_HOME` does not cover project overlays, so detection is by transcript | `tampered_by_agent` signal |
| The agent reads exam drills (0.1 plaintext) | Mode 0600, outside the workspace; the seal from 0.2 | Canary and path scan; a hit voids that goal's exams |
| A drill run acts outward | Clone without remotes, environment allowlist, shims; isolation level shown | Shim log in the trace |
| The coach writes lenient checkers (R-GG) | Admission requires that the checker fails on the mistake and on an empty run; exam drills immutable; belts from outside evidence only | `no_transfer` rate |
| The coach overfits to exam drills | No exam read tool; leakage critic; at most 4 exam submissions per goal per drill-set version (motivated by R-HOLD) | Screen and exam gap; transfer rate |
| Injected instructions in transcripts become items | Quoted data, `validate`, the exam gate; human adoption in 0.1 | Rejected proposals counted |
| Drill text leaks | Scrub, mode 0600, never in ShareModel, ledger diffs or coach cloud calls | Canary tests over share and ledger |
| Belts gamed by doing less work | n_min per belt | Items per week per type, shown |

## 5. Deterministic code vs model step

- **Model:**
  - `diagnose` (`propose_goal`);
  - `choose_checker` (fallback);
  - `propose_intervention`;
  - the foundation memo (0.2);
  - judges (audit only).
- **Code:** everything else, including:
  - episode extraction, admission and split;
  - curriculum;
  - runner, statistics and `decide`;
  - belts, stripes and transfer;
  - drift, ledger, adopt and rollback.

## 6. Consequences

**Positive:**
- 0.1 is the coach, not a diagnostic.
- Every adoption is tested on the user's own mistakes and is reversible.
- Belts mean what they say because the coach cannot author their evidence.
- The estimate and the live ladder are one function, so going live in 0.3 is a switch, not a rewrite.
- Plans and outcomes are numbers, which aggregate for fleets later.

**Negative:**
- 0.1 is larger than ADR-0001's 0.1: the runner, drills and ledger move forward.
- Training in 0.1 is Claude Code only.
- Drills store local request text.
- Small n makes many verdicts INCONCLUSIVE; the adoption cadence is 1-2 weeks per goal.
- Reversible work tops out at brown.
- Goals need at least 5 validated exam drills, so light users mostly see `watching`.

## 7. Failure modes and production signals

| Failure | Signal |
|---|---|
| Drills don't transfer (teaching to the test) | Fewer than 50% of `drills_passed` goals become `mastered` within 4 weeks |
| Budget too small | Median of more than 3 cycles to a verdict |
| Too few drillable mistakes | Under 30% of first `train` runs have at least 1 active goal |
| Runner fidelity | More than 50% of drills `not_reproducible` |
| Overlay bloat | Always-loaded bytes reaching the cap; tokens per task rising |
| Users don't trust adoption | Adoption rate under 30% of offers (0.1) |
| Belts too loose or too tight | Belts rising while world signals worsen; or more than 8 weeks to green on an agent you trust |
| Correction recall too low inflates belts | Labelled misses (`label`) above 40% of human-judged corrections |
| Suggestions ignored (ADR-0003) | Under 10% marked "added" within 30 days |

**What would change the design:**
- A no-transfer signal changes drills toward world-only measurement, or synthetic drills for variety.
- A harness API for context injection would replace managed files.

## 8. Reversal cost

| Part | Cost |
|---|---|
| Overlay surfaces | Low: remove the include line, delete the overlay; the ledger keeps the history |
| Plan schema | Low: versioned JSON |
| Drill store | Low: purge; drills can be re-mined while sources exist |
| Belt thresholds | Low in code; a trust change for users |
| Release order | Medium: README claims and user expectations |

## 9. Open questions

1. Belts per (agent, work type), with `gate check` defaulting to the lowest belt across agents when no `--agent` is given. Recommended: yes.
2. Black exists only for irreversible work types, so reversible types top out at brown. Recommended: yes (ADR-0001).
3. The drill store keeps scrubbed request text locally (narrows ADR-0001 §3.4). Recommended: yes, mode 0600, 180 days, purgeable, never shared.
4. Two constitution additions: the excluded write surfaces (§3.1), and belt evidence only from sources the coach does not author (§3.5). Recommended: yes.
5. 0.1 adopts only through `blackbelt adopt`; the seal and autonomous adoption follow in 0.2. Recommended: yes.

## 10. Facts to check before building

1. Claude Code:
   - whether `@` imports work from CLAUDE.md and CLAUDE.local.md (and whether CLAUDE.local.md is still supported), and inside `agents/*.md` and SKILL.md;
   - headless `-p` with an isolated `CLAUDE_CONFIG_DIR`: authentication (API key or subscription), `--setting-sources`;
   - sandbox network-deny settings for the runner.
2. Codex:
   - AGENTS.md discovery, any override file, and the size limit;
   - Agent Skills support;
   - `codex exec` with an isolated `CODEX_HOME`.
3. Token use and EUR per short headless episode on current Claude and OpenAI models; current prices.
4. LangGraph.js: `interrupt` and `Command` resume semantics; a file-based checkpointer without native modules; the current major version.
5. Small-n validity: power of the exact sign-flip test with 5-10 drills and k=3; reusable-holdout sizing for 4 submissions per goal (R-HOLD gives no usable size at this sample).
6. Share of real sessions with a usable base commit (`exact` vs `approximate`); clone cost on large repos.

---

