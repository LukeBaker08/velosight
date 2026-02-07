# VeloSight – Project Delivery Confidence Platform

## Overview

VeloSight is a delivery confidence platform. It enables assurance practiontioners to track, analyse, and improve project outcomes using AI-powered insights backed by a RAG (Retrieval-Augmented Generation) pipeline, a centralized knowledge repository, and configurable analysis types.

---

## Features

- **Project Management** – Create, update, and manage projects with document upload, categorisation, and status tracking.
- **AI-Powered Analysis** – Five configurable analysis types: Delivery Confidence Assessment, Risk Assessment, Gateway Review, Hypothesis Generation, and Custom Analysis. Each type has editable system/user prompts and structured output schemas.
- **RAG Pipeline** – Documents are chunked, embedded (Azure OpenAI text-embedding-3-small), and indexed in Azure AI Search. Analysis runs retrieve relevant context via semantic search before generating results with GPT-4o mini.
- **Knowledge Repository** – Centralized library for assurance materials, best practices, and templates, also vectorized for RAG retrieval.
- **Report Generation** – View and export analysis results as DOCX reports.
- **User Management** – Role-based access (Admin/User) via Supabase Auth with JWT and RLS policies.
- **Configurable Categories** – Dropdown values (project stages, risk levels, etc.) managed through settings with per-value color badges.
- **Performance Monitoring** – Built-in metrics, error handling, and validation.

---

## Tech Stack

| Layer            | Technology                                              |
|------------------|---------------------------------------------------------|
| Frontend         | React 18, TypeScript, Vite                              |
| Styling          | Tailwind CSS, shadcn/ui (Radix UI primitives)           |
| Backend API      | Node.js, Express 5, TypeScript                          |
| Database         | Supabase (PostgreSQL, pgvector, RLS)                    |
| Auth             | Supabase Auth (JWT)                                     |
| Storage          | Supabase Storage (documents, materials buckets)         |
| LLM              | Azure OpenAI (GPT-4o mini)                              |
| Embeddings       | Azure OpenAI (text-embedding-3-small)                   |
| Vector Search    | Azure AI Search                                         |
| State Management | React Query 5, React Context                            |
| Forms            | React Hook Form, Zod                                    |
| Charts           | Recharts                                                |
| Edge Functions   | Supabase Edge Functions (Deno)                          |

---

## Project Structure

```
velosight/
├── src/                           # Frontend (React + Vite)
│   ├── components/
│   │   ├── ui/                    # Base UI primitives (shadcn/ui)
│   │   ├── project/               # Project views, metrics, documents
│   │   │   └── insights/          # Analysis cards, history table
│   │   ├── reports/               # Report rendering per analysis type
│   │   │   ├── common/            # Shared report helpers
│   │   │   ├── delivery-confidence/
│   │   │   ├── risk-assessment/
│   │   │   ├── gateway-review/
│   │   │   └── hypothesis/
│   │   ├── knowledge/             # Assurance materials, prompt library
│   │   └── settings/              # Analysis params, categories, users, account
│   ├── pages/                     # Route-level components
│   │   └── reports/               # Report page wrappers
│   ├── hooks/                     # Custom React hooks
│   ├── context/                   # React context providers (AuthContext)
│   ├── lib/                       # Core business logic & utilities
│   ├── types/                     # TypeScript type definitions
│   ├── utils/                     # Utility functions
│   └── integrations/
│       └── supabase/              # Supabase client & auto-generated types
│
├── server/                        # Backend (Express API)
│   └── src/
│       ├── index.ts               # Server entry (port 3001)
│       ├── routes/
│       │   ├── analysis.ts        # /api/analysis – run analysis, manage types
│       │   ├── documents.ts       # /api/documents – upload, vectorize, delete
│       │   └── search.ts          # /api/search – semantic search
│       └── services/
│           ├── azure-openai.ts    # Azure OpenAI client
│           ├── azure-search.ts    # Azure AI Search client
│           ├── generation.ts      # RAG → LLM generation pipeline
│           ├── processing.ts      # Document chunking & embedding
│           └── retrieval.ts       # Semantic retrieval with category filtering
│
├── supabase/
│   ├── migrations/                # SQL migrations (pgvector, indexes, tables)
│   ├── functions/                 # Edge Functions (webhooks, user mgmt)
│   └── config.toml
│
├── public/                        # Static assets
├── scripts/                       # Development scripts
├── vite.config.ts                 # Vite config (port 8080, @ alias)
├── tailwind.config.ts             # Tailwind config (custom colors, dark mode)
├── tsconfig.json                  # Frontend TypeScript config
└── package.json
```

### Key Directories

| Path | Purpose |
|------|---------|
| `src/components/ui/` | Base UI primitives (shadcn/ui – buttons, dialogs, cards, etc.) |
| `src/components/project/insights/` | Analysis result cards, history table, insight content |
| `src/components/reports/` | Report rendering components per analysis type |
| `src/components/knowledge/` | Knowledge repository UI (materials, prompt library) |
| `src/components/settings/` | Analysis parameter editor, dropdown category editor, user management |
| `src/lib/` | Analysis routing, constants, errors, file operations, performance, project CRUD, validators |
| `src/hooks/` | Data-fetching hooks (dropdown categories, dropdown values, colors, users) |
| `src/context/AuthContext.tsx` | Authentication state and role management |
| `server/src/routes/` | REST API endpoints for analysis, documents, and search |
| `server/src/services/` | Azure OpenAI, Azure Search, document processing, RAG pipeline |
| `supabase/migrations/` | Database schema migrations |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (local or hosted)
- Azure OpenAI resource with GPT-4o mini and text-embedding-3-small deployments
- Azure AI Search resource

### Installation

```sh
git clone <repository-url>
cd velosight
npm install
```

### Environment Variables

Create `.env.local` files for frontend and backend:

**Root `.env.local`** (frontend – must be prefixed with `VITE_`):
```
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_SUPABASE_FUNCTIONS_URL=<supabase-functions-url>
VITE_BACKEND_API_URL=http://localhost:3001
```

**`server/.env.local`** (backend):
```
SUPABASE_URL=<supabase-url>
SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
AZURE_OPENAI_ENDPOINT=<azure-openai-endpoint>
AZURE_OPENAI_KEY=<azure-openai-key>
AZURE_OPENAI_DEPLOYMENT_GPT4O=gpt-4o-mini
AZURE_OPENAI_DEPLOYMENT_EMBEDDING=text-embedding-3-small
AZURE_SEARCH_ENDPOINT=<azure-search-endpoint>
AZURE_SEARCH_ADMIN_KEY=<azure-search-admin-key>
BACKEND_PORT=3001
```

### Running the App

```sh
# Frontend + backend together
npm run dev:all

# Or separately:
npm run dev            # Frontend only (port 8080)
npm run dev:backend    # Backend only (port 3001)
```

---

## Development

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Frontend dev server (Vite, port 8080) |
| `npm run dev:backend` | Backend dev server (Express, port 3001) |
| `npm run dev:all` | Both frontend and backend concurrently |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type checking |

### Analysis Types

Analysis types are stored in the `analysis_types` database table and editable through Settings. Each type defines:
- **System prompt** – instructions for the LLM
- **User prompt template** – template with `{{context}}` placeholder for RAG content
- **Output schema** – structured JSON schema the LLM must follow

Available types: Delivery Confidence Assessment, Risk Assessment, Gateway Review, Hypothesis Generation, Custom Analysis.

### Document Processing

Uploaded documents (PDF, DOCX, DOC, TXT, XLSX, XLS, PPTX) are:
1. Parsed and text-extracted on the backend
2. Chunked into segments
3. Embedded via Azure OpenAI (text-embedding-3-small, 1536 dimensions)
4. Indexed in Azure AI Search for semantic retrieval

### Database Migrations

Migrations live in `supabase/migrations/` and include:
- pgvector extension enablement
- Vector indexes for project documents and framework materials
- Analysis types table with output schemas
- Dropdown values with color support

---

## Security

- Supabase Auth with JWT and Row Level Security (RLS) policies
- Input validation and sanitization (`src/lib/validators.ts`)
- File upload restrictions (type whitelist, 10 MB max)
- Centralized error handling (`src/lib/errors.ts`)
- Service role key used only on the backend (never exposed to the client)

---

## Deployment

- **Build**: `npm run build` (outputs to `dist/`)
- **Frontend**: Deploy `dist/` to any static host (Vercel, Netlify, Azure Static Web Apps)
- **Backend**: Deploy `server/` as a Node.js service (Azure App Service, Railway, etc.)
- **Environment**: Configure all environment variables listed above for production. Do not embed secrets in client-side code.

---

## Troubleshooting

- **Uploads** – Max 10 MB. Supported formats: PDF, DOCX, DOC, TXT, XLSX, XLS, PPTX.
- **Auth** – Clear cache/cookies, try incognito, verify Supabase credentials.
- **Backend** – Check `server/.env.local` for correct Azure and Supabase keys. Verify `/health` endpoint responds.
- **Analysis** – If analysis fails, check Azure OpenAI deployment names and quotas. Review backend logs for retrieval/generation errors.

---

*Last updated: February 2026*
