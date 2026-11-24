# Agent transcript and trace formats (checked 2026-11-24)

Sources are listed per section. Nothing here is a documented stable schema;
every adapter needs per-version synthetic fixtures. Recheck before building
each adapter.

## Harnesses that leave local transcripts

| Tool | Location / format | Notes |
|---|---|---|
| Claude Code | `~/.claude/projects/<cwd>/<session>.jsonl`; subagents in `<session>/subagents/agent-<id>.jsonl` + `.meta.json` (`agentType`, `toolUseId`); `tool-results/*.txt`; `history.jsonl` (typed prompts) | Per-line `version`. Deleted after `cleanupPeriodDays` (default 30). Resolve subagent parentage from path + `.meta.json`, not sidechain `sessionId`. Assistant lines carry `attributionSkill` / `attributionAgent` / `attributionMcpServer` (seen v2.1.150). |
| Codex CLI | `~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<uuid>.jsonl` (`CODEX_HOME`); lines `{timestamp,type,payload}`; `session_meta` has `cli_version` | Wire format differs from `protocol.rs`; `TurnAborted`, `ThreadRolledBack` in source enum, unconfirmed on disk. |
| Copilot CLI | `~/.copilot/session-state/<uuid>/events.jsonl` | Synced to GitHub by default; files can exceed 500 MB. |
| Cursor | `~/.cursor/projects/<proj>/agent-transcripts/<id>/<id>.jsonl`; chat state in SQLite `state.vscdb` | Forum-sourced; thin (no tool outputs). |
| Gemini CLI | `~/.gemini/tmp/<hash>/chats/*.json` | Being replaced by Antigravity CLI (`agy`, announced 2026-05-19). |
| Aider | `.aider.chat.history.md` per project | Markdown, no tool calls. |
| OpenHands | `<workspace>/conversations/<id>/base_state.json` + `events/*.json` | |
| Cline / Roo / Kilo | `tasks/<id>/api_conversation_history.json`, `ui_messages.json` | Root path varies by version. |
| Goose | SQLite `~/.local/share/goose/sessions/sessions.db` | Since v1.10.0. |
| Amp | `~/.local/share/amp/threads/T-*.json` | Unverified. |
| OpenCode | SQLite `opencode.db` (`opencode db path`) | |

Frameworks (Claude Agent SDK, OpenAI Agents SDK, LangGraph, Pydantic AI,
AG2, Mastra) emit traces, not files: ingest via OTLP-JSON.

Suggested adapter order: Claude Code, Codex, Copilot CLI, Cursor,
Gemini/Antigravity, OpenCode, Cline family, then the rest.

## Standards
- OpenTelemetry GenAI semconv: Development status; no human-turn, feedback,
  correction or rule-provenance concepts; content usually off. Use as an
  import adapter, not as the canonical model.
- Claude Code's own OTel has `tool_decision` with `source: user_reject|user_abort|hook|config` (opt-in, collector only).
- OpenInference: spec unread. Harbor trajectory format: unevaluated.

## Rule sources
- Claude Code: `CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/*.md` (`paths:` globs), `skills/*/SKILL.md`, `agents/*.md`, output styles, commands; can read `AGENTS.md`.
- `AGENTS.md` (Linux Foundation, Agentic AI Foundation): de facto standard across Codex, Amp, Aider, Goose, Cursor and others.
- Cursor `.cursor/rules`; Gemini `GEMINI.md`; Cline `.clinerules/`; Agent Skills `SKILL.md` (open spec 2025-12-18).

"Rule fired" evidence, strongest first: explicit load event (skill
attribution); path-gated load; behavioural match (instruction compiled to a
checker: only ~71% of generated checkers were correct, arXiv 2611.13709).
Always-loaded rules have no load event: "never fired" means "never
behaviourally relevant" there.

## Human-correction detection
- Deterministic markers (Claude Code): `[Request interrupted by user]`;
  tool_result "The user doesn't want to proceed with this tool use". Both
  appear falsely on transport loss, `-p` runs and SIGTERM: filter them.
- Linguistic detection with an LLM: 81% accuracy on sparse sets, 42% on
  dense (arXiv 2507.23158). No validated correction-rate metric exists for
  coding-agent logs.

## Overlapping tools
ccusage (cost), CodeBurn (~11.9k stars, `npx codeburn`, one-shot rate, oversized CLAUDE.md), agentsview, Langfuse/Phoenix/LangSmith (hosted OTLP).
Nobody found doing: correction rate from human turns, recurring-mistake
clustering, never-fired rules, a hiring verdict. Recheck CodeBurn before launch.
