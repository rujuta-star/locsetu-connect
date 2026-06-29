# LocSetu Connect

India's hyperlocal worker marketplace — connects customers with verified local workers (plumbers, electricians, carpenters, etc.) for on-demand hiring.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/locsetu run dev` — run the frontend (port 18186, preview at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `locsetu`)
- API: Express 5 (artifact: `api-server`, port 8080, path prefix `/api`)
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (`jsonwebtoken` + `bcryptjs`), stored in `localStorage`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-zod/` — generated Zod schemas from spec
- `lib/api-client-react/` — generated React Query hooks from spec
- `lib/db/` — Drizzle ORM schema + migrations
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/locsetu/src/pages/` — React pages
- `artifacts/locsetu/src/lib/translations.ts` — i18n strings (English/Hindi/Marathi)
- `artifacts/locsetu/src/contexts/LanguageContext.tsx` — language switcher context

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks. Never write hooks manually.
- Auth is JWT only (no sessions). Token stored in `localStorage`, sent as `Bearer` header.
- `RegisterBody.email` is required in the Zod schema but the auth route normalizes `""` to `null` so phone-only registration works.
- `ListWorkersParams` has no server-side pagination or minRating; SearchPage does client-side filtering + pagination.
- Multilingual support via `useLanguage()` hook + `t()` helper covering English, Hindi (हिंदी), and Marathi (मराठी) — 200+ keys.

## Product

- **Customers**: sign up, browse/search workers by skill + city, view profiles, post jobs, manage jobs in dashboard, save favourite workers
- **Workers**: sign up, manage availability calendar, accept/reject job requests, mark jobs complete, manage profile
- **Community**: Local Buzz page for hyperlocal updates (posts, events, deals)
- **Admin**: verify workers, manage all users and listings
- **Languages**: full UI in English / Hindi / Marathi, switchable from the navbar

## User preferences

_None captured yet._

## Gotchas

- Do NOT run `pnpm dev` at workspace root — use workflow restart or `pnpm --filter @workspace/<pkg> run dev`
- After changing the OpenAPI spec, run `pnpm --filter @workspace/api-spec run codegen` before touching any hooks
- `useListWorkers` returns `WorkerProfile[]` (not paginated). Filtering/pagination is client-side in SearchPage.
- All job-action mutations (`acceptJob`, `rejectJob`, `completeJob`, `cancelJob`) take `id: number` directly, not `{id}`.
- `STATUS_CONFIG` maps in dashboard pages are now defined inside the component so they can call `t()`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
