# VeloSight – Project Delivery Confidence Platform

## 🚀 Overview
VeloSight is a modern project management and delivery confidence platform. It empowers organizations to track, analyze, and improve project outcomes using advanced analytics, AI-powered insights, and a robust knowledge repository.

---

## 🧩 Features
- **Project Management**: Create, update, and manage projects with document upload, categorization, and real-time status tracking.
- **AI-Driven Analysis**: Delivery confidence predictions, risk assessments, gateway reviews, and custom analysis.
- **Knowledge Repository**: Centralized library for assurance materials, best practices, and templates.
- **User Management**: Role-based access (Admin/User), secure authentication, and user activity tracking.
- **Reusable UI Library**: Consistent, accessible components for rapid development.
- **Performance & Security**: Built-in monitoring, validation, and error handling.

---

## 🏗️ Tech Stack
| Layer         | Technology                                 |
|--------------|---------------------------------------------|
| Frontend     | React 18, TypeScript, Vite                  |
| Styling      | Tailwind CSS, shadcn/ui                     |
| Backend      | Supabase (PostgreSQL, Edge Functions)       |
| Auth         | Supabase Auth                               |
| Storage      | Supabase Storage                            |
| State Mgmt   | React Query, Context API                    |

---

## 📁 Project Structure
src/
  components/    # UI, project, reports, knowledge, ui/
  lib/           # Core utilities: analysis, config, errors, file-operations, performance, validators, webhooks
  pages/         # Route-level components
  context/       # React contexts
  hooks/         # Custom React hooks
  services/      # Project & webhook services
  types/         # TypeScript types
  utils/         # Utilities (date, file ops)
supabase/
  functions/     # Edge functions (webhooks, user mgmt)
  migrations/    # Database migrations
public/          # Static assets
```

### Directory & File Purpose

| Path                        | Purpose                                                                                 |
|-----------------------------|-----------------------------------------------------------------------------------------|
| `src/components/`           | Main UI components, grouped by feature (see below)                                       |
| `src/components/ui/`        | Base UI primitives (buttons, dialogs, cards, etc. – shadcn/ui)                           |
| `src/components/project/`   | Project-specific UI (cards, modals, dashboards)                                         |
| `src/components/reports/`   | Reporting and analytics UI components                                                    |
| `src/components/knowledge/` | Knowledge repository UI (assurance materials, prompt library, uploads)                   |
| `src/context/`              | React context providers (e.g., authentication, global state)                             |
| `src/hooks/`                | Custom React hooks for state, UI, and data fetching                                      |
| `src/lib/`                  | Core business logic and utilities (see below for details)                                |
| `src/lib/analysis.ts`       | Project analysis and AI logic                                                            |
| `src/lib/config.ts`         | Centralized configuration                                                                |
| `src/lib/errors.ts`         | Error handling and reporting utilities                                                   |
| `src/lib/file-operations.ts`| File upload/download logic                                                               |
| `src/lib/performance.ts`    | Performance monitoring and metrics                                                       |
| `src/lib/project-service.ts`| Project CRUD and data access                                                             |
| `src/lib/validators.ts`     | Input validation and sanitization                                                        |
| `src/lib/webhooks.ts`       | Webhook management and integration                                                       |
| `src/pages/`                | Top-level route components (e.g., Auth, FAQ, Project, Settings, Support, NotFound)       |
| `src/services/`             | Service layer for API and backend integration (e.g., projectService, webhookService)     |
| `src/types/`                | TypeScript type definitions (e.g., project types)                                        |
| `src/utils/`                | Utility functions (date formatting, file operations)                                     |
| `src/integrations/`         | Third-party integrations (e.g., Supabase client setup)                                   |
| `public/`                   | Static assets (images, uploads, favicon, etc.)                                           |
| `supabase/functions/`       | Supabase Edge Functions (webhooks, user management, document/material automation)        |
| `supabase/migrations/`      | Database migration scripts                                                               |

#### Notable Subfolders in `components/`
- `ui/` – All base UI primitives (shadcn/ui)
- `project/` – Project dashboards, cards, and modals
- `reports/` – Analytics and reporting UIs
- `knowledge/` – Knowledge base, assurance materials, prompt library

#### Notable Files in `lib/`
- `analysis.ts` – AI and analytics logic
- `config.ts` – App configuration
- `errors.ts` – Centralized error handling
- `file-operations.ts` – File upload/download
- `performance.ts` – Performance tracking
- `project-service.ts` – Project CRUD
- `validators.ts` – Input validation
- `webhooks.ts` – Webhook logic

---

## ⚡ Getting Started
1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd velosight
   ```
2. **Install dependencies**
   ```sh
   npm install
   # or: pnpm install | yarn install | bun install
   ```
3. **Start the development server**
   ```sh
   npm run dev
   ```
4. **Supabase Setup**
   - Supabase credentials are embedded for basic use.
   - For production, configure secrets in `src/lib/config.ts` or use environment variables as needed.

---

## 🛠️ Development
- **Scripts**: `npm run dev`, `npm run build`, `npm run lint`
- **Component Library**: See `src/components/ui/` for reusable UI elements (InfoCard, ConfirmDialog, LoadingSpinner, etc.)
- **Edge Functions**: See `supabase/functions/` for webhooks and automation.
- **Testing**: (Add your test strategy here if applicable)

---

## 🔒 Security & Best Practices
- Input validation and sanitization (`src/lib/validators.ts`)
- Supabase Auth with JWT, RLS policies
- Centralized error handling (`src/lib/errors.ts`)
- File upload restrictions (type, size)
- Performance monitoring (`src/lib/performance.ts`)

---

## 🚀 Deployment
- **Build**: `npm run build`
- **Recommended hosts**: Vercel, Netlify, or any static host with Node.js 18+
- **Environment**: All config is embedded for basic use; production should secure secrets.

---

## 🐞 Troubleshooting
- **Uploads**: Max 10MB, supported types only
- **Auth**: Clear cache/cookies, try incognito, check network
- **Performance**: Use browser DevTools, disable extensions
- **Debug**: Dev builds show extra logs and metrics

## 📝 Changelog
- See `REFACTORING_SUMMARY.md` for recent changes.

---

*Last updated: September 2025*
