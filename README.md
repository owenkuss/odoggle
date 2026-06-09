# Odoggle

Privacy-first 1v1 dog face battle platform. On-device PDL scoring, WebRTC matches, server-authoritative ELO.

## Quick start

**Windows (cmd):** open Command Prompt, then:

```cmd
cd C:\Users\owenk\Projects\odoggle
setup.cmd
dev.cmd
```

If PowerShell blocks `npm`, use `dev.cmd` or `npm.cmd run dev` instead.

**Windows (PowerShell) / macOS / Linux:**

```bash
cd C:\Users\owenk\Projects\odoggle   # adjust path on your machine
npm install
cp infra/env.web.example apps/web/.env.local
cp infra/.env.example apps/server/.env
npm run dev
```

With Postgres + Redis:

```bash
npm run db:up
npm run dev
```

- Web: http://localhost:3000
- Server: http://localhost:3001

## Feature matrix

| Feature | Status |
|---------|--------|
| Landing, Arena (free), Lab (Pro only), Rooms | Done |
| Browser PDL (ONNX + heuristic fallback) | Done |
| WebRTC 1v1 + 15s battle + ELO | Done |
| Postgres + Redis persistence | Done |
| Google profile merge | Done |
| Stripe + Creem lifetime Pro checkout | Done (needs keys) |
| ML training pipeline | Done (needs GPU + DogFLW) |
| CI (GitHub Actions) | Done |
| Production deploy guide | [infra/DEPLOY.md](infra/DEPLOY.md) |

## Commands

```bash
npm run dev          # web + server (Windows: dev.cmd if PowerShell blocks npm)
npm run build        # full monorepo build
npm run db:up        # postgres + redis via docker
npm run ml:download  # clone DogFLW dataset
npm run ml:train     # train + export ONNX
```

## Structure

- `apps/web` — Next.js 15 + onnxruntime-web
- `apps/server` — Express + WebSocket + pg + redis
- `packages/shared` — ELO, types, constants
- `ml/` — Training scripts + pipeline
- `infra/` — Docker, Fly.io, deploy docs

## Production

**Free ($0/month + domain):** [infra/FREE-DEPLOY.md](infra/FREE-DEPLOY.md) — Vercel + Render + Neon + Porkbun DNS.

**Paid / scale:** [infra/DEPLOY.md](infra/DEPLOY.md) — Fly.io, TURN, Stripe.

```cmd
scripts\deploy-free.cmd
```
