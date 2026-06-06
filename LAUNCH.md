# Odoggle launch checklist

## 1. Push code to GitHub

Local branch is **5+ commits ahead** of https://github.com/owenkuss/odoggle

```cmd
cd C:\Users\owenk\Projects\odoggle
scripts\setup-github.cmd
```

Or: `git push -u origin main` (username `owenkuss`, password = **new** PAT with `repo` scope)

**Never paste tokens in chat.**

---

## 2. Vercel (website)

1. https://vercel.com/new → Import `owenkuss/odoggle`
2. **Root Directory:** `apps/web`
3. Environment variables from `infra/env.production.web.example`
4. Deploy → you get `https://odoggle-xxx.vercel.app`

See `infra/VERCEL.md`

---

## 3. Fly.io (API + WebSocket)

```cmd
winget install Fly-io.flyctl
fly auth login
cd C:\Users\owenk\Projects\odoggle
fly launch --config infra/fly.toml --no-deploy
fly secrets set WEB_ORIGIN=https://YOUR-VERCEL-URL
fly deploy --config infra/fly.toml --dockerfile infra/Dockerfile
```

Update Vercel env:
- `NEXT_PUBLIC_API_URL` = `https://YOUR-APP.fly.dev`
- `NEXT_PUBLIC_WS_URL` = `wss://YOUR-APP.fly.dev/signal`

See `infra/DEPLOY.md`

---

## 4. Optional: Postgres + Redis

- **Neon** → `DATABASE_URL`
- **Upstash** → `REDIS_URL`
- Set on Fly: `fly secrets set DATABASE_URL=... REDIS_URL=...`

Without these, server runs in-memory (fine for demos).

---

## 5. ML models (production quality PDL)

1. Download DogFLW from Kaggle (see `ml/README.md`)
2. `python ml/scripts/run_pipeline.py` on a GPU machine
3. Upload `apps/web/public/models/*.onnx` to CDN or commit to repo

Until then: heuristic fallback works for testing.

---

## 6. Smoke test

- [ ] Camera check → Lab scan → Arena queue
- [ ] `/spectate` vote on active match
- [ ] Private room 4-letter code
- [ ] Leaderboard loads
- [ ] Profile shows PDL + ELO

---

## 7. Custom domain

- Vercel: add `odoggle.com`
- Fly: `fly certs add api.odoggle.com`
- DNS: `@` → Vercel, `api` → Fly
