# FileGateway

File hosting with a public upload page, a secret admin dashboard, and a timed
multi-hop download gateway. Built phase by phase against
[`file-gateway-SDD.md`](./file-gateway-SDD.md); see [`CLAUDE.md`](./CLAUDE.md)
for how the build is being run.

Currently at **Phase 8** (expiry, cleanup & quota jobs) of 11 — see the phase
plan in the SDD §12.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A health check is
available at `/api/health`.

Local secrets live in `.env.local` (gitignored). `.env.example` documents
every variable — see SDD §9.

## Scripts

- `npm run dev` / `build` / `start` — Next.js dev/build/serve.
- `npm run lint` — ESLint.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run format` / `format:check` — Prettier.
- `npm run db:seed` — create the admin account from `ADMIN_USERNAME`/`ADMIN_PASSWORD` (idempotent).
- `npm run db:seed-articles` — seed a few sample article1/article2 posts.
- `npm run cleanup` — run the housekeeping job once (see below).

## Cleanup (expired files, sessions, orphaned disk files)

`scripts/cleanup.ts` (via `lib/cleanup.ts`'s `runCleanup()`) deletes files
past their `expiresAt` (DB row + disk bytes), purges expired
`DownloadSession` rows, and reclaims orphaned files on disk that have no
matching `FileItem` row (skipping anything written in the last 15 minutes,
so it never touches a file an upload is still mid-write on).

There are two ways this runs — pick whichever fits your deployment, or use
both:

1. **Built-in scheduler (default, no setup needed).** `src/instrumentation.ts`
   schedules it via `node-cron` every 15 minutes for as long as the app
   process is running, plus once immediately at startup. This is enough on
   its own for a typical `next start` / systemd / pm2 deployment.
2. **System cron fallback**, for anyone who'd rather schedule it externally
   (e.g. if the app runs somewhere that doesn't keep a long-lived process,
   or you just prefer cron owning the schedule):
   ```cron
   */15 * * * * cd /path/to/file-upload-site && npm run cleanup >> /var/log/filegateway-cleanup.log 2>&1
   ```
   Running both at once is harmless — every deletion is independent and a
   not-found on the DB side (e.g. the other run already deleted the same
   row) is treated as already-done, not an error.

A full deployment runbook (Caddy, systemd, backups, secret rotation) lands in
Phase 10.
