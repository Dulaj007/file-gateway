# FileGateway

**A self-hosted file host with a timed, multi-hop download gateway.**
Upload a file and get a link — but visitors don't land straight on the
download. They pass through one or two normal-looking blog posts first, each
gated behind a short timer and a signed, single-use, anti-skip token, before
the real file unlocks. Every part of the site — brand, theme, limits, timers,
domains, and the article content itself — is configurable at runtime from a
hidden admin dashboard, with zero code changes.

Built as a single host-aware Next.js application (one app, one database,
three public-facing domain roles) rather than separate services.

---

## How it works

```
Visitor uploads a file  →  gets a link (MAIN domain)
        │
        ▼
  /d/{slug}  (start page, timer)
        │  signed step token, nonce-rotated on every hop
        ▼
  Article 1  (ARTICLE_1 domain — a normal-looking post, gate hidden until a valid token arrives)
        │
        ▼
  Article 2  (ARTICLE_2 domain — same, if articleHops = 2)
        │
        ▼
  /dl/{slug}  (final page, timer)
        │  one-time download token
        ▼
  File streams to the visitor (Range support, correct Content-Type/Disposition)
```

Skipping any step, reusing an old token, or hitting the file endpoint
directly without a valid last-step token is rejected server-side — the flow
has no client-only gate.

## Features

**Upload & delivery**
- Drag-and-drop upload with real-time progress; magic-byte file-type
  detection (never trusts the extension); per-type size ceilings; per-IP
  daily quota; global storage cap
- Configurable link expiry (1d / 7d / 30d / never); Range-request support for
  large files; one-time-view result screen (the link is lost on refresh, but
  stays valid and shareable once copied)

**The gateway flow**
- HS256-signed, short-TTL, nonce-rotated step tokens; a one-time final
  download token; every hop server-verified
- One or two article hops (`articleHops`), each drawing a random active post
  per site so the "blog" never looks static

**Admin dashboard** (hidden at a configurable secret path, never linked
publicly)
- Full file management: search/filter, quick-download, enable/disable,
  change expiry, delete
- Site Identity & Appearance editor with a live header/share-card preview —
  rebrand the whole site (name, tagline, meta tags, accent color,
  light/dark default) without touching code
- Limits, timers, and domain configuration, all live — no restart needed
- Article CRUD per site, with an active toggle and live counts
- Storage/file stats, recomputed from the database on every load

**Security & housekeeping**
- argon2 password hashing, rate-limited login with a generic failure
  message, `httpOnly`/`secure`/`sameSite=lax` session cookie, CSRF on every
  admin mutation
- Rate limiting on upload, the flow, and the gate endpoints; a honeypot field
  against naive upload bots
- Per-request nonce-based Content-Security-Policy plus the standard hardening
  headers; audit log for upload/download/login/delete
- Self-cleaning storage: expired files, expired sessions, and orphaned disk
  files are reclaimed automatically on a schedule (with a system-cron
  fallback for anyone who'd rather not rely on the in-process scheduler)

**Design**
- Modern, minimal UI — Tailwind v4 + CSS variables + `next-themes`, one
  admin-configurable accent color, light/dark/system with no flash-of-wrong-theme

## Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript · Prisma 7 (SQLite via
`better-sqlite3`) · Tailwind CSS v4 · iron-session · `jose` (JWT) · argon2 ·
`rate-limiter-flexible` · `node-cron` · Zod · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in secrets — see below
npx prisma migrate dev
npm run db:seed              # creates the admin account
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A health check is
available at `/api/health`. The admin dashboard lives at
`/{ADMIN_SECRET_PATH}/login` — never linked from any public page.

### Environment

See [`.env.example`](./.env.example) for the full list. At minimum you need:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file path |
| `SESSION_SECRET` / `TOKEN_SECRET` | generate with `openssl rand -base64 48` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | seeded once by `npm run db:seed`, then rotate from the dashboard |
| `UPLOAD_DIR` | where files are stored on disk |
| `MAIN_DOMAIN` / `ARTICLE1_DOMAIN` / `ARTICLE2_DOMAIN` / `DISPLAY_DOMAIN` | seed the initial routing config (all editable later in the dashboard) |
| `ADMIN_SECRET_PATH` | the hidden admin path segment |

Locally, `*.localhost` subdomains (e.g. `article1.localhost:3000`) resolve to
loopback with no hosts-file changes, which is enough to exercise real
host-based routing in a browser.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run format` / `format:check` | Prettier |
| `npm run test` | Vitest |
| `npm run db:seed` | create the admin account (idempotent) |
| `npm run db:seed-articles` | seed a few sample article posts |
| `npm run cleanup` | run the housekeeping job once (see below) |

## Self-cleaning storage

`scripts/cleanup.ts` deletes files past their expiry (DB row + disk bytes),
purges expired download sessions, and reclaims orphaned disk files with no
matching database row (skipping anything written in the last 15 minutes, so
it never touches a file an upload is still mid-write on). It runs two ways —
use either, or both:

1. **Built-in scheduler (default).** `src/instrumentation.ts` runs it via
   `node-cron` every 15 minutes, plus once at startup. No setup needed.
2. **System cron fallback**, if you'd rather schedule it externally:
   ```cron
   */15 * * * * cd /path/to/file-gateway && npm run cleanup >> /var/log/filegateway-cleanup.log 2>&1
   ```
   Running both is harmless — every deletion tolerates a concurrent
   not-found.

## Project status

Built phase by phase against [`file-gateway-SDD.md`](./file-gateway-SDD.md),
the source-of-truth design document.

Phases 0–9 of 11 are done: scaffold & design system, data model, public
upload, the gateway flow, article sites with hidden gates, admin auth, full
file management, site-wide settings/domains/articles, self-cleaning storage,
and security hardening. **Phase 10 (deployment & ops — Caddy config, process
management, backups, the final runbook) is the only phase remaining.**
