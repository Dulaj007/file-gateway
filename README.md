# FileGateway

File hosting with a public upload page, a secret admin dashboard, and a timed
multi-hop download gateway. Built phase by phase against
[`file-gateway-SDD.md`](./file-gateway-SDD.md); see [`CLAUDE.md`](./CLAUDE.md)
for how the build is being run.

Currently at **Phase 0** (scaffold + design system) of 11 — see the phase plan
in the SDD §12. There is no upload, gateway flow, or admin dashboard yet.

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

A full deployment runbook (Caddy, systemd, backups, secret rotation) lands in
Phase 10.
