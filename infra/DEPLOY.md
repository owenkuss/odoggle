# Odoggle production deployment

## Architecture

| Service | Host | Notes |
|---------|------|-------|
| Web (Next.js) | Vercel | `apps/web`, SSR + static |
| API + WebSocket | Fly.io | `infra/Dockerfile`, port 3001 |
| Postgres | Neon / Supabase | `DATABASE_URL` |
| Redis | Upstash | `REDIS_URL` |
| ONNX models | Vercel Blob / Cloudflare R2 | CDN cache headers |
| TURN | Twilio / Cloudflare Calls | WebRTC NAT traversal |
| DNS | odoggle.com | A/CNAME to Vercel + API subdomain |

## 1. Database (Neon)

1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string → `DATABASE_URL`
3. Schema auto-migrates on server boot

## 2. Redis (Upstash)

1. Create database at [upstash.com](https://upstash.com)
2. Copy `REDIS_URL` (TLS URL works with ioredis)

## 3. Server (Fly.io)

```bash
# Install flyctl, login
fly auth login

# Create app (once)
fly apps create odoggle-server --org personal

# Set secrets
fly secrets set \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="rediss://..." \
  WEB_ORIGIN="https://odoggle.com" \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  DEV_JURY="false" \
  --app odoggle-server

# Deploy from repo root
fly deploy --config infra/fly.toml --dockerfile infra/Dockerfile
```

Health check: `GET https://api.odoggle.com/health`

WebSocket: `wss://api.odoggle.com/signal`

## 4. Web (Vercel)

1. Import repo, set **Root Directory** to `apps/web`
2. Framework: Next.js (auto-detected)
3. Env vars from `infra/env.production.web.example`
4. Set `NEXT_PUBLIC_API_URL=https://api.odoggle.com`
5. Set `NEXT_PUBLIC_WS_URL=wss://api.odoggle.com/signal`

## 5. Google OAuth

1. GCP Console → OAuth 2.0 Client (Web)
2. Redirect: `https://odoggle.com/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

## 6. Payments

**Stripe:** Dashboard → Webhook → `https://api.odoggle.com/api/pro/webhook`  
Events: `checkout.session.completed`

**Creem (alternative MoR):** Set `CREEM_API_KEY`, `CREEM_PRODUCT_ID`, `CREEM_WEBHOOK_SECRET`  
Webhook → same URL (Creem signature header)

## 7. TURN (required for reliable P2P)

**Twilio:**
```
NEXT_PUBLIC_TURN_URL=turn:global.turn.twilio.com:3478?transport=udp
NEXT_PUBLIC_TURN_USERNAME=<twilio username>
NEXT_PUBLIC_TURN_CREDENTIAL=<twilio credential>
```

**Cloudflare Calls:** use their TURN credentials similarly.

## 8. ONNX models

Train locally or on GPU cloud:

```bash
pip install -r ml/requirements.txt
python ml/scripts/run_pipeline.py
```

Upload `apps/web/public/models/*.onnx` to R2/Blob, update manifest URLs or keep in Vercel static.

## 9. DNS

| Record | Value |
|--------|-------|
| `@` | Vercel |
| `www` | Vercel |
| `api` | Fly.io (CNAME to `odoggle-server.fly.dev`) |

## 10. Post-deploy checklist

- [ ] Lab scan + Arena camera check on join (mobile)
- [ ] Two-browser arena match end-to-end
- [ ] Two-browser arena match end-to-end (battle timer → ELO result)
- [ ] Private room 4-letter code flow
- [ ] Leaderboard persists after server restart
- [ ] Google profile merge works
- [ ] Pro checkout (Stripe or Creem)
- [ ] TURN verified behind NAT (use WebRTC internals)

## CI

GitHub Actions runs build + lint on every push.  
Manual deploy: Actions → Deploy workflow (requires `FLY_API_TOKEN` secret).
