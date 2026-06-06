# Connect repo to Vercel (one-time, after GitHub push)

1. Open **https://vercel.com/new**
2. Import **`owenkuss/odoggle`**
3. Settings:
   - **Root Directory:** `apps/web`
   - **Framework:** Next.js (auto)
4. Environment variables — paste from `infra/env.production.web.example`:
   - `NEXT_PUBLIC_API_URL` → your Fly.io server URL (e.g. `https://api.odoggle.com`)
   - `NEXT_PUBLIC_WS_URL` → `wss://api.odoggle.com/signal`
   - `NEXT_PUBLIC_URL` → `https://odoggle.com` (or your Vercel URL)
5. Deploy

After deploy, every push to `main` auto-rebuilds the site.

# Connect server to Fly.io

```cmd
winget install Fly-io.flyctl
fly auth login
cd C:\Users\owenk\Projects\odoggle
fly launch --config infra/fly.toml --no-deploy
fly secrets set DATABASE_URL=... REDIS_URL=... WEB_ORIGIN=https://your-vercel-url
fly deploy --config infra/fly.toml --dockerfile infra/Dockerfile
```

Full details: [DEPLOY.md](DEPLOY.md)
