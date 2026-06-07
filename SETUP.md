# Odoggle setup (Windows)

**Important:** All commands must run from the project folder:

```
C:\Users\owenk\Projects\odoggle
```

## Push to GitHub + deploy

**One-time GitHub auth + push** (opens browser as owenkuss):

```cmd
cd C:\Users\owenk\Projects\odoggle
scripts\setup-github.cmd
```

**Deploy:** [infra/VERCEL.md](infra/VERCEL.md) (web) · [infra/DEPLOY.md](infra/DEPLOY.md) (server) · or run `scripts\deploy.ps1`

---

## Easiest: double-click or run setup script

**Command Prompt (cmd.exe):**

```cmd
cd C:\Users\owenk\Projects\odoggle
setup.cmd
dev.cmd
```

**PowerShell** (if `npm` fails with “running scripts is disabled”):

```powershell
cd C:\Users\owenk\Projects\odoggle
.\setup.cmd
.\dev.cmd
```

Or use `npm.cmd run dev` instead of `npm run dev`.

Open http://localhost:3000

---

## Manual setup (Command Prompt)

```cmd
cd C:\Users\owenk\Projects\odoggle
npm install
npm run build -w @odoggle/shared
copy infra\env.web.example apps\web\.env.local
copy infra\.env.example apps\server\.env
npm run dev
```

## Manual setup (PowerShell)

```powershell
cd C:\Users\owenk\Projects\odoggle
npm install
npm run build -w @odoggle/shared
Copy-Item infra\env.web.example apps\web\.env.local
Copy-Item infra\.env.example apps\server\.env
npm run dev
```

---

## Postgres + Redis (optional)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```cmd
cd C:\Users\owenk\Projects\odoggle
npm run db:up
npm run dev
```

Without Docker, the server uses in-memory storage — fine for local testing.

---

## Common errors

| Error | Fix |
|-------|-----|
| `Could not read package.json` in `C:\Users\owenk\` | Run `cd C:\Users\owenk\Projects\odoggle` first |
| `npm.ps1 cannot be loaded` / scripts disabled | Use **Command Prompt**, run `dev.cmd`, or `npm.cmd run dev` |
| `ECONNREFUSED` on port 5432 | Remove `DATABASE_URL` from `apps/server/.env`, or install Docker and run `npm run db:up` |
| `'Copy-Item' is not recognized` | You're in cmd, not PowerShell — use `copy` or `setup.cmd` |
| `'docker' is not recognized` | Install Docker Desktop, or skip `db:up` (app works without it) |

---

## ML models

See [ml/README.md](ml/README.md).

```cmd
cd C:\Users\owenk\Projects\odoggle
pip install -r ml/requirements.txt
python ml/scripts/download_dogflw.py
python ml/scripts/run_pipeline.py
```

## Production

See [infra/DEPLOY.md](infra/DEPLOY.md).
