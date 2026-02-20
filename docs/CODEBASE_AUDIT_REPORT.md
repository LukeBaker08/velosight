# VeloSight Codebase Audit Report

**Date:** 2026-02-04
**Auditor:** Claude Opus 4.5 (automated)
**Scope:** Full-stack review of VeloSight (React + Express + Supabase + Azure OpenAI)

---

## 1. Executive Summary

### System-level strengths
- Clean separation between Express backend (server/) and React frontend (src/) with a well-defined webhook/API boundary
- Analysis pipeline architecture is sound: DB-driven analysis types, RAG triangulation from 4 sources, structured LLM output with schema validation
- Consistent use of Shadcn/UI component library provides good UI coherence
- Report rendering has partially good consolidation (UnifiedProjectInfoCards, SelfAwarenessSection, ProjectContextSection shared across report types)

### System-level weaknesses
- Critical security exposure: Azure API keys and admin credentials shipped to the browser
- Massive duplication between server and frontend service layers (near-identical document processing, Azure clients, search clients exist in both)
- Two complete project service implementations exist side-by-side, plus a dead Python/TypeScript analysis layer
- No authentication on the Express backend — every endpoint is world-accessible
- Three package manager lock files coexist (npm, pnpm, bun)

### Top 5 issues ranked by impact

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Azure API keys exposed in browser** — `src/services/azure/openai.ts`, `src/services/azure/search.ts`, `src/lib/config.ts` | **Critical** — any user can extract keys from DevTools and make arbitrary Azure OpenAI/Search calls at your cost |
| 2 | **No authentication on Express API** — `server/src/index.ts` has zero auth middleware | **Critical** — anyone who discovers the backend URL can run analyses, delete documents, access admin endpoints |
| 3 | **Duplicated service layers** — document processing, Azure clients, project services, and search exist in both `src/services/` and `server/src/services/` | **High** — bugs fixed in one copy won't be fixed in the other; unclear which path is actually executing |
| 4 | **Dead code: entire `analysis_OLD/` directory + Python services + frontend Azure clients** | **High** — 20+ orphaned files creating confusion about which code is live |
| 5 | **Analysis data extraction logic duplicated 5+ times** across report components, insights components, and utility files | **Medium** — every new analysis type requires changes in 5+ places |

---

## 2. Architectural Findings

### 2.1 Azure credentials exposed in browser bundle
**Severity: CRITICAL**

`src/services/azure/openai.ts` uses `dangerouslyAllowBrowser: true` and reads `VITE_AZURE_OPENAI_KEY` — any VITE_-prefixed env var is embedded in the production JS bundle. The same applies to `VITE_AZURE_SEARCH_ADMIN_KEY` in `src/services/azure/search.ts`. Additionally, `src/lib/config.ts` hardcodes the Supabase anon key as a string literal rather than reading from environment.

**Why it matters:** An attacker opening DevTools can extract Azure OpenAI API keys, Azure AI Search **admin** keys, and make unbounded API calls. The admin key for Azure Search allows index deletion.

**Evidence:**
- `src/services/azure/openai.ts:9-12` — `dangerouslyAllowBrowser: true`
- `src/services/azure/search.ts:10` — `VITE_AZURE_SEARCH_ADMIN_KEY`
- `src/lib/config.ts:9-10` — hardcoded Supabase anon key

**Status: RESOLVED** — Frontend Azure clients deleted, VITE_AZURE env vars removed, hardcoded key eliminated.

### 2.2 No authentication on Express backend
**Severity: CRITICAL**

`server/src/index.ts` registers routes with no auth middleware. The admin endpoint at `GET /api/analysis/types/admin/all` returns full system prompts and output schemas to any caller. `PUT /api/analysis/types/:id` allows anyone to overwrite analysis prompts. `POST /api/analysis/run` allows arbitrary analysis execution.

**Why it matters:** Prompt injection, data exfiltration, and cost abuse are trivial.

**Status: OPEN** — Requires medium-term refactor (add Supabase JWT verification middleware).

### 2.3 Duplicated server/frontend service layers
**Severity: HIGH**

The codebase has two parallel implementations of the same operations:

| Concern | Frontend (`src/services/`) | Server (`server/src/services/`) |
|---------|--------------------------|-------------------------------|
| Azure OpenAI client | `src/services/azure/openai.ts` | `server/src/services/azure-openai.ts` |
| Azure Search client | `src/services/azure/search.ts` | `server/src/services/azure-search.ts` |
| Document processing | `src/services/documents/processing.ts` | `server/src/services/processing.ts` |
| RAG assembly | `src/services/rag/assembly.ts` | `server/src/services/retrieval.ts` |

The server's `processing.ts` even imports from the frontend code: `import { extractTextFromFile } from '../../../src/services/documents/textExtraction.js'`. This cross-boundary import couples the server build to the frontend source tree.

**Why it matters:** It is unclear which path is live. The frontend copies are the dangerous ones (browser-exposed keys). If the server copies are the intended production path, the frontend copies are dead but dangerous code.

**Status: PARTIALLY RESOLVED** — Frontend Azure clients, processing, and assembly deleted. Server still cross-imports `textExtraction.ts` and `chunking.ts` from frontend tree (medium-term fix needed).

### 2.4 Duplicate project services
**Severity: HIGH**

Two separate files implement project CRUD:
- `src/services/projectService.ts` — basic, no validation, raw transform
- `src/lib/project-service.ts` — enhanced with validation, error handling, UUID checks, create/update/delete

Both export `getAllProjects`, `getRecentProjects`, `getProjectById` with slightly different behaviour. The `transformProject` function is also duplicated with different getter names (`lastUpdated` vs `updatedAt`).

**Status: RESOLVED** — `projectService.ts` deleted, all consumers updated to use `lib/project-service.ts`.

### 2.5 Dropdown fetching duplicated across components
**Severity: MEDIUM**

`src/lib/constants.ts:55-90` defines `fetchProjectStages()` and `fetchRiskLevels()`. These are then called with identical mounted-cleanup patterns in:
- `CreateProjectModal.tsx` (~lines 39-67)
- `Project.tsx` (~lines 95-115)

Each component independently manages `useState<string[]>` + `useEffect` for the same data. This should be a single custom hook (e.g., `useDropdownValues('stage')`) or cached via React Query.

**Status: OPEN** — Medium-term refactor.

### 2.6 Config duplication between `lib/config.ts` and `lib/constants.ts`
**Severity: MEDIUM**

Both files defined overlapping constants: `API_CONFIG`, `DOCUMENT_CONFIG`, analysis type keys, risk levels, and project stages with different values and shapes.

**Status: RESOLVED** — Merged into single `constants.ts`. Fixed `process.env.NODE_ENV` references to `import.meta.env.DEV`/`PROD`.

### 2.7 Route ordering bug on Express
**Severity: LOW**

In `server/src/routes/analysis.ts`, the route `GET /types/admin/all` was registered **after** `GET /types/:key`. Express evaluates routes sequentially, so `admin` was matched as `:key` by the wildcard route before reaching the `/admin/all` handler.

**Status: RESOLVED** — `/types/admin/all` moved before `/types/:key`.

---

## 3. Duplication & Overlap Analysis

### 3.1 Analysis data extraction — 5+ copies

The logic to unwrap `raw_result` (handle array-with-output vs direct-object vs nested-output) is reimplemented in:
- `src/components/reports/ReportContent.tsx`
- `src/components/reports/risk-assessment/RiskAssessmentContent.tsx`
- `src/components/reports/gateway-review/GatewayReviewContent.tsx`
- `src/components/project/insights/InsightsHistoryTable.tsx`
- `src/components/project/insights/InsightsContent.tsx`
- `src/lib/utils.ts` (`extractDCAData`, `extractConfidenceRating`, `extractOverallRating`)

**Canonical abstraction:** Create `src/lib/analysis-extractors.ts` with:
```typescript
export function unwrapRawResult(raw: any): Record<string, any>
export function extractConfidence(data: any, type: string): string | null
export function extractRating(data: any, type: string): string | null
```

### 3.2 Badge variant helpers — 5+ copies

`getConfidenceBadgeVariant`, `getRatingBadgeVariant`, and similar functions appear in:
- `src/components/reports/common/helpers.ts`
- `src/components/reports/ReportContent.tsx`
- `src/components/project/insights/AnalysisCard.tsx`
- `src/components/project/insights/InsightsHistoryTable.tsx`
- `src/components/project/insights/InsightsContent.tsx`
- `src/lib/utils.ts` (`getConfidenceBadgeColor`)

**Canonical abstraction:** Single export from `helpers.ts`, import everywhere else.

### 3.3 Analysis route URL builders — 3 copies

Route-building logic for navigating to report pages exists in:
- `AnalysisTiles.tsx` (`getReportUrl`)
- `InsightsHistoryTable.tsx` (`getReportUrl`)
- `InsightsContent.tsx` (`getAnalysisRoute`)
- `src/lib/analysis.ts` (`getAnalysisRoute`)

**Canonical abstraction:** Single `getReportUrl(type, projectId, analysisId?)` in `src/lib/analysis.ts`.

### 3.4 Project transform with backward-compat getters — 3 copies

The `transformProject` pattern adding `get riskLevel()`, `get updatedAt()`, `get documentsCount()` getters appears in:
- `src/lib/project-service.ts:13-22`
- `src/services/projectService.ts:19-32` (now deleted)

The `lastUpdated` getter name also differs between files (one uses `lastUpdated`, other uses `updatedAt`).

### 3.5 `formatContextForLLM` pattern — 2 copies

The markdown formatting of retrieval results into LLM context sections is in:
- `server/src/services/retrieval.ts:168-220`
- The old Python `rag_service.py` had its own version (now deleted)

---

## 4. Inefficiency Analysis

### 4.1 Computational

- **Sequential embedding generation**: Both `server/src/services/processing.ts:98-100` and the (now deleted) `src/services/documents/processing.ts` generate embeddings one chunk at a time in a `for` loop. For a 20-page document, this means 20 sequential API calls. Batch embedding (Azure supports up to 16 inputs per call) would reduce this dramatically.

- **Redundant embedding generation in retrieval**: `server/src/services/retrieval.ts` calls `generateEmbedding(query)` separately in `searchProjectDocuments` and `searchFrameworkMaterials`. When `retrieveTriangulatedContext` calls these 4 times in parallel, 4 identical embedding calls are made for the same query string. The embedding should be computed once and passed to all search functions.

### 4.2 Structural

- **Three lock files**: `package-lock.json`, `pnpm-lock.yaml`, and `bun.lockb` all existed. This indicates the project has been managed by three different package managers. Only one should exist; the others create confusion about which tool is canonical and risk dependency version drift. **RESOLVED** — only `package-lock.json` remains.

- **Server imports frontend source**: `server/src/services/processing.ts:2` uses a relative path `'../../../src/services/documents/textExtraction.js'` to import from the frontend tree. This couples the server to the frontend directory structure and means the server cannot be built or deployed independently.

- **`process.env.NODE_ENV` in browser code**: `src/lib/config.ts` referenced `process.env.NODE_ENV` which is not available in the Vite browser bundle (Vite uses `import.meta.env.MODE`). This evaluated to `undefined` at runtime. **RESOLVED** — fixed to `import.meta.env.DEV`/`PROD`.

### 4.3 Organisational

- **No React Query usage for server state**: Despite `@tanstack/react-query` being installed and the `QueryClientProvider` being in the provider tree (`App.tsx`), no component actually uses `useQuery` or `useMutation`. All data fetching is manual `useState` + `useEffect` + Supabase calls. This means no automatic caching, deduplication, background refetching, or loading/error state management.

- **`src/lib/performance.ts` performance monitor**: An entire performance monitoring module exists with `recordMetric`, `measureAsync`, `trackPageLoad` etc., but appears to be unused in practice. It logs to console only and has no backend telemetry integration.

---

## 5. Risk Register

| Risk | Impact | Likelihood | Notes |
|------|--------|-----------|-------|
| Azure API key compromise via browser exposure | **Critical** — unlimited cost, data access | **High** — any user with DevTools | **RESOLVED** — keys removed from frontend |
| Unauthorised API access to Express backend | **Critical** — data deletion, prompt injection, cost abuse | **High** — no auth middleware at all | All 8 endpoints are unprotected |
| OData filter injection in Azure Search | **High** — arbitrary query manipulation | **Medium** — `documentId` interpolated directly into filter strings | `processing.ts:129`, `retrieval.ts:57` use template literals in OData `filter` |
| Admin route unreachable (route ordering) | **Medium** — admin settings editor broken | **High** — deterministic Express routing | **RESOLVED** — route order fixed |
| Lock file desync causing dependency issues | **Medium** — works-on-my-machine bugs | **Medium** — three package managers used historically | **RESOLVED** — stale lock files deleted |
| Stale frontend service code used accidentally | **Medium** — browser key exposure, wrong code path | **Medium** — imports may resolve to either copy | **RESOLVED** — dead service files deleted |
| `analysis_OLD` + Python services confusing contributors | **Low** — wasted developer time | **High** — 20+ orphaned files in the tree | **RESOLVED** — directory deleted |
| Toast system conflict (Sonner + custom useToast) | **Low** — duplicate notifications | **Medium** — both are wired up in App.tsx |

---

## 6. Improvement Roadmap

### Immediate fixes (low risk, high value) — DONE

1. ~~**Delete `src/services/azure/`**~~ ✅
2. ~~**Delete `src/services/documents/processing.ts`**~~ ✅
3. ~~**Delete `src/integrations/analysis_OLD/` directory**~~ ✅
4. ~~**Delete `src/services/projectService.ts`**, consolidate on `lib/project-service.ts`~~ ✅
5. ~~**Fix Express route ordering**~~ ✅
6. ~~**Remove hardcoded Supabase key** from config.ts~~ ✅
7. ~~**Delete two of three lock files**~~ ✅
8. ~~**Consolidate `config.ts` and `constants.ts`**~~ ✅

### Medium-term refactors

9. **Add auth middleware to Express backend** — validate Supabase JWT from `Authorization: Bearer` header on every request. The frontend already sends sessions; the backend just needs to verify them.

10. **Extract shared text extraction into a shared package** — stop the server from importing `../../../src/services/documents/textExtraction.js`. Move to a `shared/` directory or duplicate the small file.

11. **Consolidate analysis data extraction** — create `src/lib/analysis-extractors.ts` as the single source of truth for unwrapping `raw_result`, extracting confidence/rating, and building report URLs. Remove all inline copies.

12. **Adopt React Query for data fetching** — replace manual `useState`/`useEffect` patterns with `useQuery`/`useMutation`. This will eliminate the duplicated loading/error state boilerplate across Dashboard, Projects, AssuranceMaterials, PromptLibrary, etc.

13. ~~**Create `useDropdownValues(categoryName)` hook** — replace the duplicated stage/risk-level fetching pattern in CreateProjectModal and Project.tsx. Also removed broken `stage`/`riskLevel` validation from `validateProject` (was checking against stale static constants for values controlled by dropdowns).~~ ✅

14. **Batch embedding calls** in `processDocument` — Azure supports batch embedding. Change the `for` loop to process chunks in batches of 16.

15. **Compute query embedding once** in `retrieveTriangulatedContext` — pass the pre-computed vector to all 4 search functions instead of re-embedding in each.

16. **Parameterise OData filters** — use Azure Search SDK's built-in filter escaping instead of string interpolation for `document_id`, `project_id`, and `category` values.

### Long-term architectural shifts

17. **Eliminate backward-compat getter properties** on Project — the `get riskLevel()` / `get updatedAt()` / `get documentsCount()` pattern indicates a past migration from camelCase to snake_case. Complete the migration: update all consumers to use `risk_level`, `updated_at`, `documents_count` directly and remove the getters.

18. **Split `Settings.tsx` (690 lines)** into focused components: `SettingsAccount`, `SettingsAnalysisParams`, `SettingsCategories`, `SettingsUsers`.

19. **Introduce a typed analysis result discriminated union** — replace `raw_result: any` with `raw_result: DCAResult | RiskResult | GatewayResult | HypothesisResult` using a discriminant field. This eliminates the multi-path parsing scattered across the codebase.

20. **Remove the dual toast system** — choose either Sonner or the custom `useToast` hook. Both are wired into the provider tree via `<Toaster />` and `<Sonner />` in App.tsx.

---

## 7. Non-Goals

| What | Why not change it |
|------|-------------------|
| **Shadcn/UI component library** (53 files in `components/ui/`) | These are generated scaffolds. Modifying them creates merge conflicts when updating the library. Leave as-is. |
| **Tailwind CSS theme configuration** | The custom teal/fidere palette and animation config are clean and fit-for-purpose. |
| **Express as backend framework** | Adequate for the current scale. Migrating to a different framework would be churn without benefit. |
| **Supabase as database/auth provider** | Deeply integrated and appropriate for the use case. |
| **Azure OpenAI as LLM provider** | Recently migrated to; the integration is sound on the server side. |
| **Report page architecture** (ReportLayout + typed content components) | The pattern is sound. The problem is duplicated extraction logic, not the rendering architecture. |
| **The `ErrorBoundary` component** | Simple, correct, and adequate. |
