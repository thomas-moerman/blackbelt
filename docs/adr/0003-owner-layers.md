# ADR-0003: Where a fix belongs: owner layers

- Status: Proposed
- Date: 2026-11-26
- Related: ADR-0001 (Accepted), ADR-0002 (Accepted).
- Amends:
  - ADR-0001 §3.1 rule 3 and §3.2: the Finding field `layer` (detector level L0-L2) is renamed `detector_level`;
  - ADR-0001 §3.1: adds the enforcement-source plugin type, `renderCheck` and declared checks in the manifest;
  - ADR-0001 §3.2: levels wording; clusters gain a stable id, recurrence and an owner layer;
  - ADR-0001 §3.3, §3.4, §5, §8: modules, report-card content, store layout, code list, failure modes;
  - ADR-0002 §3.1: constitution addition 1;
  - ADR-0002 §3.2: one trigger, one closed propose tool, guardrail, memory record and three evals; "trainee memory" renamed;
  - ADR-0002 §3.3: goal fields and plan view;
  - ADR-0002 §3.4: location of the trace checks;
  - ADR-0002 §3.7: 0.1 content; ADR-0002 §3.8: CLI verbs and README claims;
  - ADR-0002 §5: one model step; ADR-0002 §7: failure modes.
- Supersedes: none.

Sources (titles, versions and dates checked 2026-11-26):
- Do They Do as They Are Told? Investigating Coding Agents' Adherence to Explicit Instructions in Context Files, [arXiv 2611.13709](https://arxiv.org/abs/2611.13709) (v1, 2026-11-10)
- TellOnce: Correcting Coding Agents Once, Improving Their Future Actions, [arXiv 2606.13174](https://arxiv.org/abs/2606.13174) (v2, 2026-10-25)
- Rethinking Verification in Agent Harnesses, [arXiv 2610.34577](https://arxiv.org/abs/2610.34577) (v1, 2026-10-25)
- How Coding Agents Fail Their Users: A Large-Scale Analysis of Developer-Agent Misalignment in 20,574 Real-World Sessions, [arXiv 2605.29442](https://arxiv.org/abs/2605.29442) (v2, 2026-08-31)
- How Do Coding-Agent Harnesses Self-Evolve? An Empirical Study of Retrospective Adaptation, [arXiv 2610.34938](https://arxiv.org/abs/2610.34938) (v1, 2026-10-26)
- Model or Harness? An Interaction-Centric Taxonomy for Localizing Agent Failures, [arXiv 2607.28802](https://arxiv.org/abs/2607.28802) (v1, 2026-07-30)
- Do Coding Agents Follow AGENTS.md? The Effect of Policy Wording on Instruction Compliance, [arXiv 2611.04367](https://arxiv.org/abs/2611.04367) (v1, 2026-11-03)
- Claude Code docs: [hooks](https://code.claude.com/docs/en/hooks), [memory](https://code.claude.com/docs/en/memory), [settings](https://code.claude.com/docs/en/settings), [permissions](https://code.claude.com/docs/en/permissions) (checked 2026-11-26)

## 1. Context

The coach finds the mistakes an agent repeats, and in 0.1 it can only answer them one way: by teaching, that is, with a rule, a skill or an overlay item. That is the right fix when nobody ever wrote the convention down. That is often not enough in two cases:

- **A rule exists and the agent ignores it.** In a study of agent-written commits, 54% of the evaluated context-file instructions were followed in every applicable commit and 37% in none, often with only a few commits per instruction (arXiv 2611.13709). How a rule is worded can change how often it is followed (arXiv 2611.04367), but a rule in text is not enforced.
- **The agent says "done" when the work is partial or unverified.** In a study of 20,574 real sessions, agents misreporting their own work, for example by claiming success too early, appeared in 22.6% of the episodes where developers pushed back, third of seven forms of breakdown (arXiv 2605.29442). In benchmark tests, review by a separate critic model raised average task accuracy by 3.9 to 9.5 points, with a better trade-off between accuracy and cost than the other verification designs tested (arXiv 2610.34577).

In a small test built from one user's corrections (19 tasks, 29 checks, six models), agents met 31.6% of the preferences with no rules, 54.0% with the relevant rules as text, and 70.1% when those rules also carried explicit criteria that code or a model checked during execution (arXiv 2606.13174). Claude Code's documentation says CLAUDE.md is context, not enforced configuration. It points to a PreToolUse hook to block an action whatever the model decides, and to a hook for an instruction that must run at a specific point.

There is also a counterweight. In one study of changes an agent proposed after its own sessions, only 9 of 38 proposed executable checks could report a failure in that environment as written; most of the others needed missing tools or were commit hooks in sessions that never committed. In the same study's seven informative tests of implemented changes, none of them a lint or commit check, two stopped the targeted action, one reduced it and four showed no reduction; one of the two that stopped the action was a line in CLAUDE.md (arXiv 2610.34938). Attributing a failure to a component is also imperfect: on 40 worked examples, four model judges matched the human label for the failing interaction and component 75 to 80% of the time (Cohen's kappa 0.70 to 0.76), in a taxonomy different from the layers used here (arXiv 2607.28802). So a suggestion needs evidence, and the router must be allowed to say "I don't know".

The constitution stays as it is: the coach never writes permissions, hooks, tool or harness settings, or the agent's own memory (ADR-0002 §3.1). This ADR adds a diagnosis and a suggestion. It adds no write path.

## 2. Decision drivers

1. **The report card stays deterministic and model-free** (ADR-0001 §5). Same input, same routing.
2. **Honest about doubt.** Abstaining beats guessing, and the share of mistakes routed "unknown" is always shown.
3. **Setup-agnostic.** No routing rule reads roles or flow (ADR-0001 rule 1).
4. **The write surface is unchanged.** Proposing is not writing.
5. **Privacy.** The inventory never stores command bodies or settings values. Suggestions stay local and are not part of the share page.
6. **Free and local.** Replay uses stored, content-free events: no runner, no network, no spend.
7. **Measure what the user feels.** Success means the same mistake comes back less often in the user's own work.

Options are costed on complexity, cost per run and per month, security and data protection, operations, latency and reversal. Prices and latencies are estimates, not measurements.

## 3. Decisions

### 3.1 The six layers

A layer is a place where a fix can live. The owner layer of a mistake is the place where a fix would stop it most directly.

| Layer | In plain words | A fix there looks like | Who changes it |
|---|---|---|---|
| `agent` | the model and its settings | another model, more reasoning effort | the user (a hiring decision) |
| `harness` | what the agent can do: tools, hooks, permissions, sandbox | a PreToolUse hook, a permission deny rule, a path guard | the user; the coach suggests |
| `loop` | what checks the work: tests, linters, CI, verification steps | a check before "done", a CI job | the user; the coach suggests |
| `graph` | how the work flows: steps, roles, hand-offs, approval gates | a review step, a gate before merge | the user; the coach suggests (later) |
| `memory` | what the agent remembers by itself across sessions | correcting or pruning the agent's own memory store | the user |
| `knowledge` | what the agent is told: rules, skills, docs | a rule, a skill, an overlay item | the coach writes (ADR-0002 §3.1), the user adopts |

`memory` here means the agent's own store, which it writes at run time. The coach's context items are `knowledge`.

### 3.2 An owner layer on recurring mistakes

**Options**

- **A. No owner layer; every mistake is a Knowledge goal** (status quo).
  - Benefits: nothing to build.
  - Costs: an ignored rule may only get another rule, and an unverified "done" only advice. The coach could show activity while recurrence stays flat, and the user does not get the more direct fix.
  - Complexity: none. Cost: 0. Reversal: n/a.
- **B. Deterministic routing rules, versioned, that abstain; plus labels to measure their accuracy.**
  - Benefits: free, the same twice, explainable by a reason code. Works on any setup with tool calls.
  - Costs:
    - covers only the signals code can see, so Agent, Graph and Memory are not assigned in v1;
    - rule-to-mistake linking is lexical and will miss paraphrases;
    - one more labelling prompt.
  - Complexity: low-medium. Cost: 0. Latency: under 1 s. Reversal: low (an additive field).
- **C. A model classifier assigns the layer** (opt-in, like L2).
  - Benefits: covers paraphrase and the three layers B cannot see.
  - Costs:
    - model judges matched human labels for the component at fault only 75 to 80% of the time in a related taxonomy (arXiv 2607.28802);
    - it breaks "the report card has no model";
    - transcript text goes to a provider under consent, and the result changes between runs.
  - Cost: about EUR 0.01-0.05 per mistake on a cloud model, 0 on a local one (estimate). Reversal: low.
- **D. B plus the coach installs the hook or check itself.**
  - Costs: hooks run code, and permissions are autonomy outside the belt ladder. This breaks the constitution. Rejected.

**Decision: B** for the report card. C stays possible later as an opt-in classifier behind the same labelled-accuracy gate as L2 (ADR-0001 §3.2). The agent version is in §3.6.

**Schema** (additive to ADR-0001's Findings; zod in `src/core/finding.ts`):

```ts
type OwnerLayer = "agent" | "harness" | "loop" | "graph" | "memory" | "knowledge" | "unknown";
type OwnerReason =
  | "check_exists_still_recurs" | "done_without_check" | "rule_ignored_action"
  | "rule_ignored_result" | "rule_not_loaded" | "no_rule_found"
  | "abstain_support" | "abstain_not_measurable" | "abstain_rules_unreadable"
  | "abstain_inventory_unreadable";
interface Owner {
  layer: OwnerLayer;
  reason: OwnerReason;
  support: number;                 // share of the mistake's occurrences that match the reason, 0..1
  rule?: { ruleId: string; link: "explicit" | "lexical" };
  enforcement?: string;            // inventory item id, for check_exists_still_recurs
  router: string;                  // "router@1"
}
// Every Finding: detector: {id, version}; detector_level?: "L0" | "L1" | "L2"; source_events: string[].
// Recurring-mistake Findings add: owner: Owner.
```

**Rule link** (deterministic, shared with the contradicted-rules check of ADR-0002 §3.2):

- `explicit`: a corrections-log entry carries the `rule_id`; or the correction names a rule file or skill; or it quotes 8 or more consecutive normalised tokens of a rule section.
- `lexical`: the mistake's central correction shares at least 2 content 3-grams with a rule section (after stop words are removed).
- A linked rule counts as **loaded** for an occurrence when it is always loaded, its path gate matched in that session, or a load event exists (ADR-0001 §3.1).

**Routing rules, `router@1`.** The rules are ordered, and the first match wins. Support threshold θ = 0.6 (configurable; a change bumps the router version).

1. `tool_calls` not measurable, or the adapter is degraded: `unknown`, `abstain_not_measurable`.
2. A readable inventory item (§3.3) matches the offending action in at least θ of occurrences: the item's layer (`harness` for hooks, permissions and sandbox; `loop` for CI, linters and git hooks), `check_exists_still_recurs`.
3. An inventory source that could cover the offending action is unreadable: `unknown`, `abstain_inventory_unreadable`. What an unread source matches is not known, so in v1 any unreadable source of the setup counts. It may hold the check, so the router never concludes that none exists.
4. In at least θ of occurrences, the corrected agent turn has a write and no exec call after its last write: `loop`, `done_without_check`.
5. A rule is linked and loaded in at least θ of occurrences, and the occurrences share an offending action (the same tool class with the same `cmd_head`, or paths inside one common glob): `harness`, `rule_ignored_action`. The action can be stopped before it happens.
6. A rule is linked and loaded, with no shared offending action: `loop`, `rule_ignored_result`. The mistake shows only in the result.
7. A rule is linked but not loaded in at least θ of occurrences: `knowledge`, `rule_not_loaded`. The rule exists but does not reach the agent.
8. No rule is linked, and rule discovery read every rule source: `knowledge`, `no_rule_found`.
9. Otherwise `unknown`, with `abstain_support` or `abstain_rules_unreadable`.

- `router@1` never assigns `agent`, `graph` or `memory`. A property test asserts this. Those values come only from user labels in v1.
- The router never reads `agent.label`. The role-identifier test covers `src/core/route/`.

**Shown on the report card**, per recurring mistake:
- the owner layer in plain words, with the reason ("a rule exists and is ignored: CLAUDE.md › Testing");
- under the table, the unknown share: "where the fix belongs: unknown for X of Y mistakes (Z% of occurrences)".

**Accuracy.** `blackbelt label --owner` samples mistakes and asks for a layer or "not sure". Labels are stored by mistake id in `labels.jsonl`, with no text. A corrections-log entry may carry `owner_layer` (additive field).
- The report shows agreement on the mistakes the router assigned, with a Wilson 95% interval and n.
- With fewer than 30 labels it says "routing accuracy not measured on your data".
- The share page gets counts by layer, the unknown share and the agreement figure: numbers only.

### 3.3 A read-only enforcement inventory at intake

**Options**

- **A. None.** Then "no rule" cannot be told apart from "rule ignored but already enforced", and the coach would suggest hooks the user already has.
- **B. A read-only scan of known locations, plus user declaration through the manifest.**
  - Costs: one parser per source kind, and settings files hold secrets next to the parts we need.
  - Complexity: medium. Cost: 0. Latency: well under 1 s.
- **C. Declaration only.** The inventory stays empty unless the user declares every check.

**Decision: B.**

```ts
interface EnforcementItem {
  id: string;                    // sha256(source id \0 relpath \0 anchor), first 16 hex
  source: string;                // "claude-code-settings", "git-hooks", "github-actions", "linters", "manifest"
  kind: "hook" | "permission" | "sandbox" | "ci" | "linter" | "git_hook";
  layer: "harness" | "loop";
  matcher: { tools?: string[]; tool_classes?: ToolClass[]; cmd_heads?: string[]; path_globs?: string[];
             event?: "pre_tool" | "post_tool" | "stop" | "commit" | "push" | "ci" };
  path: string; anchor: string;  // file and JSON path or job/step name
  status: "ok" | "unreadable";
  reason?: string;               // fixed reason code when unreadable
}
interface EnforcementSource { id: string; discover(ctx: DetectContext): Promise<EnforcementItem[]> }
```

- **v1 sources:**
  - Claude Code settings at every level: only the `hooks` and `permissions` keys;
  - git hooks (non-sample files in `.git/hooks`, `core.hooksPath`, and the usual hook managers' config files);
  - GitHub Actions `run:` steps (command head only);
  - linter and formatter config files (presence only);
  - the manifest (`coach.rules.json` gains `enforcement: [...]`), which is how any other setup declares its checks.
- **Command head** (hook commands and workflow `run:` steps): skip leading `NAME=value` assignments, `env` with its options (and their values) and `NAME=value` operands, and `sudo` and `exec` wrappers; then keep only the basename of the command that follows. It must match the strict character set and pass the secret scan, or it is dropped.
- **Reading is passive:**
  - an unreadable file keeps its path and a fixed reason code, never the parser's message;
  - the scanned root is the repository for project-level sources, the user config directory for user-level settings, the system directory that holds them for managed settings, and the named directory for `core.hooksPath`;
  - a symlink that leaves the scanned root is not followed; it is recorded and listed as `unreadable`, with its path and a fixed reason code;
  - YAML is loaded with a safe, schema-less loader;
  - git config is only parsed, or read with `git config --get`. `git status` and `git diff` are never run on a scanned repository, because planted config can run code.
- **Never read or kept:** settings keys outside an allowlist (`env`, key helpers and the like), hook command and `run:` step text beyond the command head, and workflow secrets. A test plants canaries in those places, as `X=canary cmd` and `env X=canary cmd` in a hook and in a `run:` step, and in a malformed settings file, and asserts that none reaches the store or the output.
- **Stored** as `inventory/<setup>/<date>.json` (matchers only), so a later intake can tell when a suggestion was adopted (§3.4).
- **Report panel:** "checks found: 3 hooks, 12 permission rules, 1 CI workflow, 2 linters", with unreadable files listed by path and reason code.

### 3.4 Suggestions outside Knowledge: text only, with replay evidence

**Options**

- **A. Name the layer, suggest nothing.**
  - Costs: the user must design the check, and may not.
- **B. Suggest a check as text, with no evidence.**
  - Costs: a proposed check may be unable to fire where it is installed (in one study, 29 of 38 could not as written, arXiv 2610.34938), so a suggestion without evidence risks the user's trust.
- **C. Suggest a check as text, with replay evidence from the user's own history.**
  - Costs: a renderer per harness, and replay is counterfactual: "would have fired" is not "would have prevented".
  - Complexity: medium. Cost: 0. Latency: about 1-2 s for 30 days.
- **D. Write the check** (constitution conflict). Rejected.

**Decision: C.** A check spec (`CheckSpec`, the input of `renderCheck`) is one template from ADR-0002's closed checker enum plus its parameters. The templates' trace evaluators move to `src/core/checks/`, so replay and drill admission share one implementation.

| Template | Suggested as | Layer | Replay from stored events |
|---|---|---|---|
| `trace_forbid` | a PreToolUse hook, or a permission deny rule when the harness can express it (preferred where it fits, because it adds no script; a command rule matches command text and misses other spellings of the same command) | harness | yes |
| `scope` | a path guard: a permission rule or a PreToolUse hook on write tools (neither covers every write made by a shell subprocess) | harness | yes |
| `trace_order` | a PreToolUse hook with session state | harness | yes |
| `trace_require` | a Stop-hook check: X must have run after the last write | loop | yes |
| `state_cmd` | not suggested in v1 (a CI job or pre-commit step) | loop | no |
| `state_match` | not suggested in v1 (a CI or lint step) | loop | no |

- **State templates are not suggested in v1.** A suggestion needs at least one replay catch, and stored events cannot replay a state check. The report card still names the layer, says "can't replay from transcripts" and shows linked `ci_fail` and `revert` outcomes.
- **Parameters** come from code heuristics over the mistake's features (`cmd_head`, path globs, tool classes), the same heuristics ADR-0002 §3.4 uses for drills. Values must match a strict character set. Anything else drops the suggestion.
- **Replay output (deterministic, offline), over the last 30 days:**
  - fired: the number of agent turns where the check would have fired at least once, plus the raw call count;
  - on this mistake: how many of those turns belong to the mistake's corrected episodes;
  - elsewhere: the rest, which would have blocked work nobody corrected;
  - caught: the mistake's occurrences with at least one firing, out of all of them.
- **Wording** is always "would have fired", never "would have prevented".
- **No suggestion** when it catches 0 occurrences, or while an inventory source that could cover the offending action is unreadable (router rule 3). **A warning** when "elsewhere" is more than twice "on this mistake".
- **Rendering** goes through an optional adapter method, `renderCheck?(spec): string`:
  - Claude Code renders a settings snippet and a short script;
  - other setups get a neutral description and a shell or CI snippet.
- `blackbelt suggest <mistake>` prints it. Nothing is written to any file.
- **Adoption is measured, not asked.** When a later inventory holds an item whose matcher covers the spec, the suggestion is marked "added" with its date, and the mistake's recurrence before and after is tracked like an adoption (ADR-0002 §3.3 transfer test).

### 3.5 Primary success measure

**Primary measure: recurrence per mistake class.** A mistake class is a recurring-mistake cluster with a stable id (ADR-0001 §3.2). Recurrence is its occurrences per 100 work items of its work type (ADR-0002 §3.5), per ISO week, with an exact Poisson 95% interval. When work items cannot be measured, the rate is per 100 interactive sessions, labelled as such.

**Next to it: firing and compliance per rule.**
- Firing as in ADR-0001.
- Compliance applies to rules linked to a replayable check spec: 1 − (fires ÷ opportunities). Without a spec it shows "not measurable".
- Firing of installed hooks shows where the harness records it.

**Drill pass rate is the gate, not the headline.** It still decides adoption (ADR-0002 `decide`), and the plan shows it second.

### 3.6 The agent version: owner-aware diagnosis in the train graph

**Outcome.** Each recurring mistake stops recurring, through the layer that owns it.

**Triggers:**
- `blackbelt train`;
- a new recurring mistake;
- an inventory change, which marks a suggestion "added".

**Graph.** A small change to ADR-0002 §3.2: `diagnose` (M) gains one closed propose tool. Code does the rest.
- **The tool:** `propose_enforcement{finding_id, template, params}`. It writes to state only.
- **Then, in code:** `validate` (zod; a replayable template from the enum; the parameters must occur in the finding's own features; secret scan) → `replay` → `render`.
- **The result** goes into the plan and the report as text.
- Heuristics come first, as with `choose_checker`. The model is asked only when the router abstained, or the heuristics found no spec with at least one catch.

**Guardrails in code:**
- at most 2 enforcement suggestions per cycle;
- no suggestion without at least one replay catch;
- no suggestion while an inventory source that could cover the offending action is unreadable (§3.4);
- no parameter outside the strict character set;
- no path inside `BLACKBELT_HOME`;
- any failure drops the suggestion (fail closed).

**Memory.**
- `interventions.jsonl` gains the kind `enforcement_suggestion`, with `added` and recurrence before and after. These are numbers only, per setup, and feed the curriculum prior.
- On read-back the data is quoted and untrusted.
- No secrets: the secret scan runs before the write.

**Human in the loop.** Nothing leaves the machine and nothing is written outside the coach's home. The human installs the check, and that is the approval.

**Evals** (the sim fixtures of ADR-0002):
- mistakes planted per replayable template get the right template: at least 0.8 of seeds;
- suggestions with 0 catches: 0;
- injected shell metacharacters or instructions in transcripts that reach rendered text: 0.

**When unsure.** No suggestion. The user sees "where the fix belongs: unknown. Label it: `blackbelt label --owner`."

**What the report card alone loses without this.** Tailored suggestions for mistakes the router abstains on. The report card keeps no model by decision.

### 3.7 Write surface

Unchanged (ADR-0002 §3.1 B). Suggestions for `harness`, `loop` and `graph` are text. Goals routed to `knowledge` train as before. Goals routed elsewhere still train a Knowledge item in 0.1, with the suggestion shown first. The curriculum is unchanged until recurrence data shows whether those goals transfer.

## 4. Threat model additions

| Threat | Control | Detection |
|---|---|---|
| Transcript content shapes a rendered script that the user pastes (command injection) | strict character set for parameters, quoted rendering, no `eval`, injection fixtures | rejected suggestions counted |
| Secrets in settings reach the store | key allowlist in the parsers; command head only | canary test over store and output |
| Inline env assignment in a hook command or run step reaches the store | strip assignments and wrappers, secret-scan the head | canary test |
| Parser error text or a symlinked settings file leaks content | reason codes only; a symlink leaving the scanned root is not followed and is listed as `unreadable` | malformed-file canary |
| The agent fakes compliance to look enforced | routing reads behaviour, not claims; recurrence is the measure | recurrence flat while compliance rises |
| A suggestion over-blocks and the user turns enforcement off | "elsewhere" count and warning | suggestions removed again from a later inventory |

## 5. Deterministic code vs model step

- **Code:** rule linking, routing, inventory, replay, rendering, adoption detection, recurrence and compliance.
- **Model:** only `propose_enforcement` in `diagnose` (train graph, opt-in, budgeted). It runs as a fallback.

## 6. Consequences

**Positive:**
- The report card tells "no rule" from "rule ignored" from "nobody checked".
- Suggestions carry the user's own evidence.
- The constitution is untouched.
- Layer counts are numbers, so they aggregate for fleets later.
- One check implementation serves replay and drills.

**Negative:**
- Three of the six layers are not assigned by code in v1.
- Lexical rule linking misses paraphrases.
- Replay cannot see state checks, so a mistake that only a state check would catch gets a layer but no suggestion in v1.
- A renderer is needed per harness, and hook schemas change between releases.
- A second labelling prompt.

## 7. Failure modes and production signals

| Failure | Signal |
|---|---|
| Misrouting | labelled routing agreement under 0.70 at n ≥ 30 |
| Router too timid | unknown share over 60% of mistakes |
| "No rule found" is really a missed link | user labels move `knowledge` to `harness` or `loop` in over 30% of labelled cases |
| Noisy suggestions | "elsewhere" over twice "on this mistake" in most suggestions; added checks removed again |
| Suggestions ignored | under 10% marked "added" within 30 days |
| Wrong owner chosen | recurrence flat 4 weeks after an added check |

**Reversal trigger.** If labelled agreement stays under 0.70 at n ≥ 30, on the maintainer's own data or on opt-in shared aggregates:
- the owner column defaults to hidden, and every mistake shows `unknown`;
- inventory and replay stay;
- the change is recorded in a superseding ADR.

## 8. Reversal cost

| Part | Cost |
|---|---|
| `owner` field and router | low: additive, versioned |
| Inventory | low: a rebuildable cache |
| Suggestions | low: text only, nothing installed by the coach |
| Shared check implementation | low |
| Public layer vocabulary | medium: README and user expectations |

## 9. Open questions

1. Should goals routed outside Knowledge still get Knowledge training in 0.1? Recommended: yes, and measure.
2. Should the first token of `cmd_head` gain an allowlisted second token (for example `npm test`) to sharpen the Loop rule? Recommended: later, as an additive optional field.

## 10. Facts to check before building

- Claude Code PreToolUse and Stop hook input and output schemas.
- Whether transcripts record a hook block.
- Permission rule syntax for paths and commands.
- All settings levels, and plugin hook files.
- Codex enforcement config.
- The quoted findings against the full texts.
