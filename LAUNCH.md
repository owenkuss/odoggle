# Odoggle launch checklist

Complete steps in order. Items marked **YOU** need your accounts/keys.

---

## 0. Local verify (5 min)

```cmd
cd C:\Users\owenk\Projects\odoggle
setup.cmd
dev.cmd
```

In another terminal:

```cmd
scripts\smoke-test.cmd
```

Manual: Camera check → Lab → Arena (two tabs) → `/spectate` vote.

---

## 1. Push code to GitHub

```cmd
cd C:\Users\owenk\Projects\odoggle
scripts\launch-all.cmd
```

Or step-by-step:

```cmd
git add -A
git commit -m "your message"
scripts\setup-github.cmd
```

Repo: https://github.com/owenkuss/odoggle

**Never paste tokens in chat.**

---

## 2. Neon Postgres **YOU**

1. https://neon.tech → New project
2. Copy connection string → `DATABASE_URL`

---

## 3. Upstash Redis **YOU**

1. https://upstash.com → New Redis database
2. Copy TLS URL → `REDIS_URL` (`rediss://...`)

---

## 4. Fly.io server **YOU**

```cmd
winget install Fly-io.flyctl
fly auth login
cd C:\Users\owenk\Projects\odoggle
fly apps create odoggle-server --org personal
fly secrets set ^
  DATABASE_URL="postgresql://..." ^
  REDIS_URL="rediss://..." ^
  WEB_ORIGIN="https://YOUR-VERCEL-URL.vercel.app" ^
  DEV_JURY="false" ^
  --app odoggle-server
fly deploy --config infra/fly.toml --dockerfile infra/Dockerfile
```

Note your Fly URL: `https://odoggle-server.fly.dev` (or custom `api.odoggle.com`).

Health: `GET https://YOUR-FLY-URL/health`

See [infra/DEPLOY.md](infra/DEPLOY.md)

---

## 5. Vercel web **YOU**

1. https://vercel.com/new → Import `owenkuss/odoggle`
2. **Root Directory:** `apps/web`
3. Environment variables from `infra/env.production.web.example`:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://odoggle-server.fly.dev` |
| `NEXT_PUBLIC_WS_URL` | `wss://odoggle-server.fly.dev/signal` |
| `NEXT_PUBLIC_URL` | Your Vercel URL or `https://odoggle.com` |
| `NEXTAUTH_SECRET` | Random 32+ char string |
| `NEXTAUTH_URL` | Same as `NEXT_PUBLIC_URL` |
| `GOOGLE_CLIENT_ID` | GCP OAuth |
| `GOOGLE_CLIENT_SECRET` | GCP OAuth |

4. Deploy → copy production URL
5. Update Fly `WEB_ORIGIN` to match Vercel URL if you used a placeholder

See [infra/VERCEL.md](infra/VERCEL.md)

---

## 6. Google OAuth **YOU**

1. GCP Console → APIs → OAuth consent → Credentials → Web client
2. Redirect URI: `https://YOUR-DOMAIN/api/auth/callback/google`
3. Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` to Vercel env

---

## 7. TURN (WebRTC) **YOU**

Required for arena video across NAT. Add to Vercel env:

```
NEXT_PUBLIC_TURN_URL=turn:global.turn.twilio.com:3478?transport=udp
NEXT_PUBLIC_TURN_USERNAME=...
NEXT_PUBLIC_TURN_CREDENTIAL=...
```

Twilio: Console → Programmable Voice → TURN credentials.

---

## 8. Payments (optional) **YOU**

**Stripe:** Dashboard → Webhook → `https://YOUR-FLY-URL/api/pro/webhook`  
Events: `checkout.session.completed`  
Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` on Fly and Vercel.

**Creem:** Set `CREEM_*` vars per `infra/env.production.web.example`.

---

## 9. ML models (optional, production PDL)

1. Download DogFLW from Kaggle ([ml/README.md](ml/README.md))
2. `python ml/scripts/run_pipeline.py` on GPU
3. Deploy `apps/web/public/models/*.onnx`

Until then: heuristic fallback works.

---

## 10. Custom domain **YOU**

| Record | Target |
|--------|--------|
| `@` | Vercel |
| `www` | Vercel |
| `api` | Fly (`odoggle-server.fly.dev`) |

```cmd
fly certs add api.odoggle.com --app odoggle-server
```

Update env URLs to production domain.

---

## 11. Production smoke test

- [ ] `GET /health` on Fly
- [ ] Home page loads on Vercel
- [ ] Lab scan on mobile
- [ ] Two-browser arena match + video
- [ ] `/spectate` vote resolves ELO
- [ ] Private room code
- [ ] Leaderboard persists after Fly restart (needs Neon)
- [ ] Google sign-in merges profile
- [ ] Pro checkout (if enabled)

---

## CI / auto-deploy

- **CI:** GitHub Actions builds on every push
- **Fly:** Add `FLY_API_TOKEN` secret → Actions → Deploy workflow
- **Vercel:** Auto-deploy on push to `main` once repo is linked

---

## Completion status

| Layer | Status |
|-------|--------|
| App code | Ready |
| Local dev | Ready (`dev.cmd`) |
| GitHub push | Run `scripts\launch-all.cmd` |
| Fly + Vercel | Needs your accounts |
| Neon + Upstash | Needs your accounts |
| OAuth + TURN + payments | Needs your keys |
| ML ONNX models | Optional GPU training |
