# Free deploy ($0/month + domain)

Host Odoggle for **$0/month** using free tiers. You only pay for **odoggle.com** on Porkbun (~$10–15/year).

| Service | Free tier | Role |
|---------|-----------|------|
| **Vercel Hobby** | $0 | Website (`odoggle.com`) |
| **Render Free** | $0 | API + WebSocket (`api.odoggle.com`) |
| **Neon Free** | $0 | Postgres (optional but recommended) |
| **Upstash Free** | $0 | Redis (optional) |
| **Google STUN** | $0 | WebRTC (built in — no TURN key needed) |
| **Google OAuth** | $0 | Sign-in (optional) |

**Skip for now (costs money):** Fly.io, Twilio TURN, Stripe/Creem Pro payments, GPU ML training.

### Free-tier tradeoffs

- **Render** sleeps after ~15 min with no traffic → first API/WebSocket request may take **30–60s** to wake up.
- **No paid TURN** → arena video works for most users; some strict home routers may fail (STUN-only).
- **Neon/Upstash** optional — without them the server uses in-memory storage (resets on Render redeploy).

---

## 1. Vercel — website (free)

1. https://vercel.com/new → Import **`owenkuss/odoggle`**
2. **Root Directory:** `apps/web`
3. **Environment Variables** (Production):

```
NEXT_PUBLIC_URL=https://odoggle.com
NEXTAUTH_URL=https://odoggle.com
NEXT_PUBLIC_API_URL=https://api.odoggle.com
NEXT_PUBLIC_WS_URL=wss://api.odoggle.com/signal
NEXTAUTH_SECRET=<random 32+ chars>
```

Generate secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..32|ForEach-Object {Get-Random -Max 256})|ForEach-Object {[byte]$_})
```

4. Deploy once (you’ll get a `*.vercel.app` URL).
5. **Settings → Domains** → add `odoggle.com` and `www.odoggle.com`.

---

## 2. Render — API + WebSocket (free)

1. https://dashboard.render.com → **New → Blueprint**
2. Connect GitHub repo **`owenkuss/odoggle`** (uses `render.yaml` at repo root)
3. After create, open service **odoggle-api → Environment** and set:

| Key | Value |
|-----|-------|
| `WEB_ORIGIN` | `https://odoggle.com` |
| `DATABASE_URL` | *(Neon connection string — step 3)* |
| `REDIS_URL` | *(Upstash URL — step 4, optional)* |

4. **Settings → Custom Domains** → add `api.odoggle.com`
5. Render shows a **CNAME target** (e.g. `odoggle-api.onrender.com`) — use in Porkbun step 5.

Health check: `https://api.odoggle.com/health`  
WebSocket: `wss://api.odoggle.com/signal`

---

## 3. Neon — Postgres (free, recommended)

1. https://neon.tech → New project (free tier)
2. Copy **connection string** → Render env `DATABASE_URL`

Schema auto-migrates on server boot.

---

## 4. Upstash — Redis (free, optional)

1. https://upstash.com → New Redis database (free tier)
2. Copy **TLS URL** (`rediss://...`) → Render env `REDIS_URL`

Helps private rooms + rate limits. Skip if you want zero setup — in-memory still works.

---

## 5. Porkbun DNS for odoggle.com

**If deploy “doesn’t work”, DNS is usually the cause.**  
Run `scripts\check-deploy.cmd` — if you see `uixie.porkbun.com`, fix DNS first.

**Full fix guide:** [infra/PORKBUN-DNS.md](PORKBUN-DNS.md)

Porkbun → **Domain Management → odoggle.com → DNS**

1. **Delete** all parking records (`uixie.porkbun.com`, URL forwarding, default ALIAS).
2. Add:

| Type | Host | Value |
|------|------|-------|
| **A** | `@` *(blank)* | `76.76.21.21` *(confirm in Vercel Domains)* |
| **CNAME** | `www` | `cname.vercel-dns.com` |
| **CNAME** | `api` | `odoggle-api.onrender.com` *(Render custom domain target)* |

3. Wait 5–30 minutes, then run `scripts\check-deploy.cmd`.

---

## 6. Google OAuth (free, optional)

1. https://console.cloud.google.com → OAuth 2.0 Web client
2. **Authorized redirect URI:** `https://odoggle.com/api/auth/callback/google`
3. Add to **Vercel** env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

---

## 7. WebRTC (free — already configured)

The app uses **Google’s free STUN** server by default. No TURN keys required.

Leave these **empty** on Vercel unless you later pay for Twilio TURN:

```
NEXT_PUBLIC_TURN_URL=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=
```

---

## 8. Verify

- [ ] https://odoggle.com loads
- [ ] https://api.odoggle.com/health returns OK
- [ ] Lab scan works
- [ ] Arena queue (wake Render first if cold — wait ~60s after idle)

Local smoke test before DNS:

```cmd
scripts\smoke-test.cmd
```

---

## 9. What to skip on free tier

| Feature | Why skip |
|---------|----------|
| Fly.io | No longer free for always-on |
| Twilio TURN | Paid |
| Stripe / Creem Pro | Payment processing fees |
| ML ONNX on GPU | Use heuristic PDL (already works) |
| Custom Fly `api` subdomain | Use Render instead |

---

## Quick open (Windows)

```cmd
scripts\deploy-free.cmd
```

Opens Render, Vercel, Neon, and prints the Porkbun DNS table.

---

## Upgrading later

When you outgrow free tiers:

- Render **Starter** ($7/mo) — no sleep
- Twilio TURN — reliable WebRTC everywhere
- Fly.io or paid Render — more WebSocket headroom
- GPU ML training — real ONNX PDL models

See [DEPLOY.md](DEPLOY.md) for the paid/production path.
