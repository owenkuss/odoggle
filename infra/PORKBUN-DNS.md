# Porkbun DNS fix for odoggle.com

Your domain is currently pointing at **Porkbun parking**, not Vercel or Render.

If `nslookup api.odoggle.com` shows **`uixie.porkbun.com`**, follow this guide.

---

## Step 1 — Delete parking / wrong records

Porkbun → **Domain Management → odoggle.com → DNS**

**Delete** anything like:

| Delete these |
|--------------|
| ALIAS / A records pointing to `uixie.porkbun.com` or Porkbun IPs |
| CNAME for `www` → `uixie.porkbun.com` |
| CNAME for `api` → `uixie.porkbun.com` |
| URL forwarding records for `@` or `www` |
| Any “Parking” or default Porkbun templates |

Keep only what you add in Step 3.

---

## Step 2 — Deploy apps first (get real targets)

### Vercel (website)

1. https://vercel.com → your **odoggle** project
2. **Settings → Domains** → Add `odoggle.com` and `www.odoggle.com`
3. Vercel shows the exact records — **copy those** (usually below)

### Render (API)

1. https://dashboard.render.com → **New → Blueprint** → repo `owenkuss/odoggle`
2. Wait until **odoggle-api** shows **Live** (not failed build)
3. Open service → **Settings → Custom Domains** → add `api.odoggle.com`
4. Copy the CNAME target Render gives you (e.g. `odoggle-api.onrender.com`)

Test before DNS:

- `https://YOUR-SERVICE.onrender.com/health` → should return JSON, not `Not Found`

---

## Step 3 — Add correct Porkbun records

| Type | Host | Value |
|------|------|-------|
| **A** | *(blank = apex)* | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |
| **CNAME** | `api` | `odoggle-api.onrender.com` *(use Render’s exact target)* |

**Important:**

- Use **blank** host for apex `@`, not `odoggle.com` (Porkbun accepts both, blank is standard).
- Do **not** use Porkbun URL forwarding for `@`.
- If Vercel shows a **different A IP**, use Vercel’s value instead of `76.76.21.21`.

---

## Step 4 — Vercel environment variables

Project → **Settings → Environment Variables → Production**:

```
NEXT_PUBLIC_URL=https://odoggle.com
NEXTAUTH_URL=https://odoggle.com
NEXT_PUBLIC_API_URL=https://api.odoggle.com
NEXT_PUBLIC_WS_URL=wss://api.odoggle.com/signal
NEXTAUTH_SECRET=<random string>
```

Redeploy after saving.

---

## Step 5 — Render environment variables

Service **odoggle-api → Environment**:

```
WEB_ORIGIN=https://odoggle.com
DEV_JURY=true
```

Optional: `DATABASE_URL` from Neon free tier.

---

## Step 6 — Verify (wait 5–30 min after DNS save)

```cmd
scripts\check-deploy.cmd
```

Or manually:

```cmd
nslookup odoggle.com
nslookup api.odoggle.com
```

**Good DNS:**

- `odoggle.com` → `76.76.21.21` (not Porkbun IPs)
- `api.odoggle.com` → `odoggle-api.onrender.com` (NOT `uixie.porkbun.com`)

**Good HTTP:**

- https://odoggle.com loads
- https://api.odoggle.com/health returns `{"ok":true,...}`

---

## Still broken?

| Symptom | Fix |
|---------|-----|
| `uixie.porkbun.com` in nslookup | Delete parking records in Step 1 |
| Render `/health` = Not Found | Blueprint not deployed — redeploy on Render |
| Vercel SSL error on apex | Wrong A record — match Vercel Domains page |
| Site loads but arena fails | Set `WEB_ORIGIN` + Vercel `NEXT_PUBLIC_*` URLs |
| CORS errors | `WEB_ORIGIN` must be exactly `https://odoggle.com` |
