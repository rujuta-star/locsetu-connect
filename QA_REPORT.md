# LocSetu Connect — QA Audit Report

**Date:** 2026-06-29  
**Scope:** Full end-to-end audit of all Worker, Customer, and Admin workflows  
**Environment:** pnpm monorepo · React+Vite (port 5000) · Express 5 API (port 8080) · PostgreSQL+Drizzle

---

## Summary

| Category | Count |
|---|---|
| Critical bugs fixed | 3 |
| Secondary bugs fixed | 2 |
| TypeScript errors resolved | ~30 → 0 |
| Workflows audited | 15+ |
| New features added | 0 |

---

## Bugs Found & Fixed

### Bug #1 — `useSaveWorker` sent to wrong endpoint (CRITICAL)

**File:** `artifacts/locsetu/src/lib/api-compat.ts`

**Problem:** The generated `saveWorker(workerId)` function sent `POST /api/saved-workers/:workerId` (workerId as a path parameter). The server expects `POST /api/saved-workers` with `{ workerId }` in the request body. Every "save worker" action silently failed with a 404.

**Fix:** Replaced the generated call with a direct `apiFetch("/saved-workers", { method: "POST", body: JSON.stringify({ workerId }) })` call.

---

### Bug #2 — `onError` callback silently ignored in all mutation hooks (CRITICAL)

**File:** `artifacts/locsetu/src/lib/api-compat.ts`

**Problem:** The `MutationCallbacks` type only included `onSuccess`. All mutation hooks (`useAcceptJob`, `useRejectJob`, `useCompleteJob`, `useCancelJob`, `useVerifyWorker`, `useSaveWorker`, `useUnsaveWorker`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`) accepted an `onError` option in their callers but silently discarded it. Error toasts and error-state UI never fired.

**Fix:** Added `onError` to the `MutationCallbacks` type and wired it through all hooks.

---

### Bug #3 — Review creation failed: `jobId` missing from request (CRITICAL)

**Files:** `artifacts/locsetu/src/pages/JobDetailPage.tsx`, `artifacts/api-server/src/routes/reviews.ts`

**Problem (frontend):** `handleSubmitReview` in `JobDetailPage` did not include `jobId` in the mutation body, so every submitted review was missing the job association.

**Problem (server):** The `CreateReviewBody` Zod schema only included `workerId`, `rating`, and `comment` — it stripped `jobId` before the handler could read it. The server then tried to insert a review without a valid `jobId`.

**Fix (frontend):** Added `jobId: job.id` to the `useCreateReview` mutation call.

**Fix (server):** Updated the reviews route to read `jobId` directly from `req.body` (bypassing Zod stripping) alongside the Zod-parsed data.

---

### Bug #4 — Job detail "People" card showed raw IDs instead of names (UX)

**File:** `artifacts/locsetu/src/pages/JobDetailPage.tsx`

**Problem:** The People section displayed "Customer #3" and "Worker #2" instead of actual user names. The job API response already included `customerName` and `workerName` fields (populated by `buildJobResponse`), but the UI didn't use them.

**Fix:** Updated the People card to read `(job as any).customerName` and `(job as any).workerName` with fallback to the ID-based label.

---

### Bug #5 — Pre-existing TypeScript errors across server routes (TYPE SAFETY)

**Files:** `lib/api-zod/src/generated/api.ts`, `artifacts/api-server/src/routes/jobs.ts`, `artifacts/api-server/src/routes/buzz.ts`, `artifacts/api-server/src/routes/availability.ts`, `artifacts/api-server/src/routes/learning.ts`, `artifacts/api-server/src/routes/portfolio.ts`

**Problem:** ~30 TypeScript errors existed before this audit, caused by mismatches between the OpenAPI-generated Zod schemas and the actual server route logic. Specific issues:

- `CreateJobBody` was missing `scheduledAt` — used at runtime but not in the schema
- `UpdateJobBody` was missing `title`, `description`, `location`, `scheduledAt`
- `UpdateWorkerProfileBody` was missing `idProofUrl`
- `CreateBuzzBody` only had `content`/`imageUrl` but the buzz route used 7+ fields
- `req.params.*` typed as `string | string[]` but passed directly to `parseInt()`
- `allJobs` in `GET /jobs` had an implicit `any[]` type
- Drizzle `date` column comparison type mismatch in availability route

**Fix:** Updated all affected Zod schemas to match the server's actual usage; added `Array.isArray` guards for all route params; added explicit type annotation on `allJobs`; used `description ?? ""` for `notNull()` columns.

**Result:** `pnpm run typecheck` → 0 errors.

---

## Workflows Audited

### Customer Workflows

| Workflow | Status | Notes |
|---|---|---|
| Sign up (phone + name) | ✅ Pass | Email normalised to null on server |
| Log in | ✅ Pass | JWT stored in localStorage |
| Search workers by skill + city | ✅ Pass | Client-side filtering + pagination |
| View worker profile | ✅ Pass | Skills, rating, reviews rendered |
| Save / unsave a worker | ✅ Fixed (Bug #1) | Was 404 before fix |
| Saved Workers page | ✅ Pass | Calls `GET /saved-workers`, renders correctly |
| Post a job | ✅ Pass | `scheduledAt` now in schema (Bug #5) |
| View job list (dashboard) | ✅ Pass | Filters by customer ID |
| View job detail | ✅ Pass | Names shown instead of IDs (Bug #4) |
| Cancel a job | ✅ Fixed (Bug #2) | `onError` now fires on failure |
| Submit a review | ✅ Fixed (Bug #3) | `jobId` now included; server reads it |
| View notifications | ✅ Pass | List, unread count, mark read |
| Mark all notifications read | ✅ Pass | `POST /notifications/read-all` |
| Local Buzz page | ✅ Pass | Browse/filter/search posts by city & category |

### Worker Workflows

| Workflow | Status | Notes |
|---|---|---|
| Sign up as worker | ✅ Pass | Profile auto-created on registration |
| Log in | ✅ Pass | |
| View incoming job requests | ✅ Pass | Filtered to worker's assigned jobs |
| Accept a job | ✅ Fixed (Bug #2) | onError now wired |
| Reject a job | ✅ Fixed (Bug #2) | onError now wired |
| Mark job complete | ✅ Fixed (Bug #2) | onError now wired |
| Manage availability calendar | ✅ Pass | Route param type fixed (Bug #5) |
| Update worker profile | ✅ Pass | `idProofUrl` now in schema (Bug #5) |
| Income dashboard | ✅ Pass | Aggregates completed jobs + budget |
| View posted portfolio / learning | ✅ Pass | Route param type fixes applied |

### Admin Workflows

| Workflow | Status | Notes |
|---|---|---|
| Log in as admin | ✅ Pass | `admin@locsetu.com / admin123` |
| Admin dashboard stats | ✅ Pass | `GET /admin/stats` returns all counters |
| Browse all users | ✅ Pass | Paginated, filterable by role |
| Browse all jobs | ✅ Pass | Filterable by status |
| View pending worker verifications | ✅ Pass | `GET /admin/workers/pending` |
| Approve / reject worker | ✅ Pass | `POST /admin/workers/:id/verify` |
| View top-rated workers | ✅ Pass | `GET /admin/top-workers` |

---

## No Regressions Introduced

- No new features added
- No existing passing flows were changed
- All fixes are minimal, targeted patches
- API contract (routes, response shapes) unchanged

---

## Remaining Known Limitations (Out of Scope)

- `SESSION_SECRET` env var is unset — server falls back to hardcoded key `"locsetu-secret-key"`. Functional but insecure for production; set `SESSION_SECRET` via env secrets before deploying.
- `ListWorkersParams` has no server-side pagination; `SearchPage` handles filtering + pagination entirely on the client (acceptable per existing architecture decision).
- Generated Zod file (`lib/api-zod/src/generated/api.ts`) was directly patched to match server reality. Proper long-term fix: update the OpenAPI spec and re-run `pnpm --filter @workspace/api-spec run codegen`.
