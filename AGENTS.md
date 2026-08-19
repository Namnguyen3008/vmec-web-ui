# AGENTS.md — VMEC-01 Production Implementation Rules

## Mission

Build a complete production-oriented Vietnamese medical specialty-routing, multi-turn clinical triage, and appointment-booking product. Do not stop at plans, scaffolds, mock screens, partial demos, or generated code that has not been executed and tested.

## Repository boundary & Workspace

- Work inside this repository unless the master prompt explicitly requires a read-only external check.
- Inspect current Git state before editing. Preserve user work.
- Primary working branch: `main`.
- Keep focused, concise commit messages after verified milestones.

## Secrets and privacy

- Never print, log, copy, screenshot, commit, or disclose secrets.
- Never enumerate the complete environment.
- It is permitted to check whether API keys exist, but never display their values.
- Do not expose Gemini, Mistral, Supabase, or Cosmos credentials to the browser client.
- Do not commit source datasets, extracted data, runtime volumes, caches, generated embeddings, or `.env` files.
- Never log raw symptom text, medical notes, free-text PHI, session cookies, authorization headers, or prompts containing patient data.
- Do not claim clinical, legal, privacy, or security approval without explicit evidence.

## Immutable product rules

- Emergency detection (115 Acute Guard) executes before LLM, RAG, memory, or booking.
- The assistant may suggest a specialty; it must not diagnose, prescribe, change medication, or give individualized treatment.
- Every patient-facing specialty suggestion includes Pure Database-Driven Citations (direct official hospital article URLs & MOH Decision codes) and the Vietnamese disclaimer.
- Patient confirmation and staff/receptionist approval are both required before an appointment reaches `CONFIRMED`.
- Rescheduling requires patient reconfirmation.
- AI may propose tools; trusted server code (FastAPI) validates and executes them.
- No model-generated specialty, service, practitioner, facility, slot, source, or action may bypass allowlists and database checks.
- Production data mode fails closed when an approved corpus is absent.

## Technology Stack & Architecture Reference

- **Backend**: FastAPI (Python 3.12, Uvicorn, Stateless API, Port 8000). All backend code lives in `backend/src/` and tests in `backend/tests/`.
- **Frontend**: Next.js 16 (App Router, Turbopack, Tailwind CSS, Pure Database-Driven Citations).
- **Clinical Triage Engine**: 28-Node LangGraph State Machine with 3 Subgraphs (`TriageGraph`, `RagGraph`, `CatalogGraph`).
- **Knowledge Base & Vector RAG**: Supabase Cloud PostgreSQL + `pgvector` (3,650 vectors 1024-dim Mistral Embeddings, RPC `match_knowledge_chunks`).
- **Atomic Slot Holding & Session Storage**: Azure Cosmos DB Free Tier (`slot_holds` with 900s TTL, `patient_sessions` with 24h TTL).
- **AI Models**: Google Gemini Rotation Pool (Flash-Lite / Pro, 7 API Keys) + Mistral Semantic Embeddings Pool (13 API Keys).

## Required workflow

1. Consult canonical architectural documents:
   - `ARCHITECTURE.md` (System architecture, 5 technology pillars, 28-node graph, data schemas)
   - `README.md` (System overview, setup guide, testing instructions)
2. Audit the repository and data files before making structural modifications.
3. Implement in clean, coherent milestones.
4. After every milestone:
   - Run backend tests: `pytest backend/tests/ -v` (ensure all 29 tests pass).
   - Run frontend build: `npm run build` in `frontend/` (ensure 18/18 routes compile with 0 errors).
   - Fix failures rather than weaken tests.
   - Create a focused commit with a short, concise message.

## Code quality & Guidelines

- Python 3.12+, Ruff, strict typing, pytest and structured error handling.
- TypeScript strict mode; avoid broad `any`.
- Validate AI structured output with Pydantic and semantic domain rules.
- Maintain documentation integrity: no emojis/icons in `README.md`.
- Commit message rule: keep commit comments short, concise, and focused.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **P-208**. Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/P-208/context` | Codebase overview, check index freshness |
| `gitnexus://repo/P-208/clusters` | All functional areas |
| `gitnexus://repo/P-208/processes` | All execution flows |
| `gitnexus://repo/P-208/process/{name}` | Step-by-step execution trace |

<!-- gitnexus:end -->
