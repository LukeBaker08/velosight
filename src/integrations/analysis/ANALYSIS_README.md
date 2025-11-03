# Analysis Integration (src/integrations/analysis)

This folder contains the "analysis" stack used to run retrieval-augmented generation (RAG) and structured LLM analyses over your project and framework materials. It's intentionally small and pluggable so you can wire in your preferred embedding and LLM infra (local or cloud).

## High-level flow

1. Orchestrator (`index.ts`) receives a request describing:
   - `promptId` and `userVars` — which prompt template to use and variables to fill
   - `retrieval` — query text and optional filters (e.g., projectId)
   - `systemId` (optional) — a system message selector
   - `assemble` (optional) — override assembly rules

2. Retrieval (`rag/sources.ts`) calls the embedding function and runs four source queries in parallel:
   - Project (per-project documents)
   - Context (organization-level/context docs)
   - Sentiment (notes, surveys)
   - Framework (knowledge materials)

   The RAG layer uses stored Postgres RPCs (see `rag/supabase.ts`) which call vector-match stored procedures like `match_project_chunks` and `match_framework_chunks`.

3. Assembly (`rag/assemble.ts`) combines the retrieved chunks into a single context text (subject to `maxChars`) and returns which chunks were used.

4. Prompt construction (`templates/*`) builds the user instruction text. `templates/prompts.ts` contains named prompt templates.

5. LLM call (`llm/llm.ts`) receives the system + prompt and returns a response. For Phase 0 this is a stub but the code is intentionally isolated so you can swap in an API call to your model.

6. Structured validation (`llm/structured.ts`) validates the JSON output from the model against a Zod schema and tries to repair it by calling the model a second time if needed.

7. The orchestrator returns `{ output, rawText, usedChunks }` to the caller.

## Key files

- `index.ts` - Orchestrator entry point. High-level pipeline flow.
- `config.ts` - Tunable constants (embedding dims, k-per-source, maxChars).
- `type.ts` - Shared TypeScript types for retrieval and chunk shapes.
- `utils/text.ts` - Embedding helper and small text utils. Default `embed()` is a stub returning a zero vector of length 384 — replace with your embedding endpoint.
- `rag/supabase.ts` - Postgres RPC wrappers. These call Supabase RPCs like `match_project_chunks`/`match_framework_chunks` that perform vector-match queries.
- `rag/sources.ts` - High-level orchestration of the 4 sources. Calls `embed()` then the match RPCs.
- `rag/assemble.ts` - Combines retrieved chunks into the context blurb.
- `llm/llm.ts` - Adapter for calling your model. Currently a stub returning a JSON string; replace with your model call.
- `llm/structured.ts` - Robust JSON validation+repair pipeline using Zod.
- `templates/prompts.ts` - Prompt templates keyed by `promptId`.
- `schemas/output.ts` - Zod schema for expected model JSON output. Extend to your real schema.
- `testkit/*` - Simple test runners to exercise retrieval and generation locally.

## How to wire embeddings

Replace `embed()` in `utils/text.ts` with a call to your embedding service. The returned vector MUST match `ANALYSIS_CONFIG.embeddingDimensions` (default 384).

Example (pseudo):

```ts
export async function embed(text: string) {
  const r = await fetch('http://localhost:11434/api/embed', { method: 'POST', body: JSON.stringify({ input: text }) });
  const j = await r.json();
  return j.embedding; // must be number[] length 384
}
```

If you use a GPU server or LLM host, ensure the embedding model matches the dimension size expected by the Supabase match RPCs.

## How to wire the LLM

Implement `generate()` in `llm/llm.ts` to call your model provider. The orchestrator expects a string response. For structured outputs, set the `json: true` option to indicate we expect JSON back (the current stub ignores options).

Example (pseudo):

```ts
export async function generate(system, prompt, opts = {}) {
  const body = { system, prompt, temperature: opts.temperature ?? 0.2, max_tokens: 1024 };
  const resp = await fetch('https://api.your-llm.example/generate', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  const txt = await resp.text();
  return txt;
}
```

## Testing locally (testkit)

- `testkit/run-retrieval.ts` and `testkit/run-once.ts` show simple invocations of retrieval + orchestration. Run them with `ts-node` or compile with `tsc`.

## Debugging tips

- If matches return no chunks, verify the RPCs work in Supabase SQL editor and that embeddings have been inserted with the expected dimensions.
- If model returns invalid JSON, `llm/structured.ts` will attempt to repair it; set `maxAttempts` and log `raw` responses for troubleshooting.
- Keep `ANALYSIS_CONFIG` dims in sync across embedding, vector storage, and `utils/embed`.

## Next steps and TODOs

- Hook up a real embedding service and LLM.
- Add richer prompt templates and system messages in `templates/system.ts`.
- Expand `schemas/output.ts` with real output contracts for your analyses.
- Add type-safe wrappers around `retrieveAll()` inputs/outputs for better developer ergonomics.

---

If you'd like, I can also:
- Add example code for calling a local FastAPI embed endpoint.
- Wire a simple OpenAI/Azure adapter for `llm/llm.ts`.
- Run the testkit scripts and report results.

Tell me which follow-up you want next.