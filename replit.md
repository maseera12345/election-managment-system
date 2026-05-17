# SecureVote — Secure Online Election Management System

A mission-critical civic platform for transparent, secure, and verifiable elections. Three roles: Super Admin, Election Creator, and Voter.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/election-system run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui + Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken), stored as `election_token` in localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/` — all API route files (auth, elections, candidates, voters, votes, results, dashboard, auditLogs, notifications, users, requests)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware + requireRole
- `artifacts/election-system/src/pages/` — all frontend pages by role
  - `admin/` — AdminDashboard, AdminUsers, AdminElections, AdminAuditLogs
  - `creator/` — CreatorDashboard, CreatorElections, CreateElection, CreatorCandidates, ManageVoters
  - `voter/` — VoterDashboard, VoterElections, JoinElection, VoteElection
  - `shared/` — ElectionResults (used by all three roles)
  - `public/` — Home, ElectionDetail
  - `auth/` — Login, Register
- `lib/db/src/schema.ts` — database schema (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated hooks (do not edit)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval generates React Query hooks + Zod schemas
- JWT stored in localStorage as `election_token`; `setAuthTokenGetter` registered in `main.tsx` so all generated hooks automatically attach the token
- Vote flow: voter joins (pending) → creator approves → creator finalizes voters → creator generates secret IDs → voter sees their secret ID on the join page → voter casts vote using secretId + candidateId
- Secret voting: each finalized voter gets a random 16-character secret ID; votes are cast anonymously using this ID so votes cannot be traced back to individuals
- Role-based routing: ProtectedRoute wraps each role group; `useAuth()` exposes `role`, `user`, `token`

## Product

- **Public**: Landing page with live stats, election browser, election detail with candidates
- **Voter**: Dashboard with participations, browse & join elections, view secret ID, cast vote, view live/final results
- **Election Creator**: Dashboard, CRUD elections, manage candidates (add/delete with dialog), manage voters (approve/finalize/generate secret IDs/activate election), view results with bar charts
- **Super Admin**: Dashboard with system stats, all elections overview with suspend/activate/complete actions, full user management, complete audit log trail

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@electvault.com | Admin@1234 | Super Admin |
| creator@electvault.com | Creator@1234 | Election Creator |
| voter@electvault.com | Voter@1234 | Voter |
| voter2@electvault.com | Voter@1234 | Voter |

## Gotchas

- Always run `pnpm run typecheck:libs` before typechecking `api-server` (db lib is composite and must be built first)
- Generated hooks require `queryKey` alongside `enabled` when passing query options — use the provided `get*QueryKey()` helpers
- `setAuthTokenGetter` must be called before any API hooks — it's registered in `main.tsx`
- Routes across services use path-based routing via shared proxy; never call service ports directly, always go through localhost:80
- Do NOT add leaf workspace packages to root tsconfig.json references
