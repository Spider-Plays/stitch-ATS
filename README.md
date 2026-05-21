# Stitch ATS

React frontend + Node.js API with Prisma (PostgreSQL in production).

## Architecture

| Layer | Tech |
|--------|------|
| **Client** | React 18, Vite, TanStack Query, Tailwind |
| **API** | Express, JWT auth, Zod validation |
| **Database** | Prisma ORM + PostgreSQL |

## Quick start

```bash
npm install
cd server && npm install && cd ..

# IMPORTANT: server/.env DATABASE_URL must be your NEON URL (same as Render).
# Do NOT use file:./dev.db — bootstrap would write to local SQLite, not production.
cp server/.env.example server/.env
# Edit server/.env: paste Neon "Pooled connection" string from the console

npm run db:setup --prefix server
npm run db:verify --prefix server

# Create your first admin (PowerShell)
cd server
$env:ADMIN_EMAIL="you@company.com"
$env:ADMIN_PASSWORD="your-secure-password"
$env:ADMIN_NAME="Your Name"
npm run db:bootstrap
npm run db:verify
cd ..

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database commands (server/)

| Command | Purpose |
|---------|---------|
| `npm run db:setup` | Apply Prisma schema |
| `npm run db:bootstrap` | Create first admin (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`) |
| `npm run db:clear` | Delete all users and hiring data |
| `npm run db:seed` | Seed dev users from `server/src/config/devUsers.ts` |
| `npm run db:seed-demo` | Full demo dataset (17+ candidates, 6 reqs, portal & vendor users). Use `-- --fresh` to replace hiring data only |

**Skill catalog:** On first API load, default IT skills are seeded. Admins use **Edit skills** on Add Candidate / Post Job to add more. Matching uses the same catalog for requirements and candidates.

## Email (Resend)

Team invites are sent from **Admin → User Management → Invite New User**.

1. Create an API key at [resend.com](https://resend.com/api-keys)
2. Add to **Render** (and `server/.env` locally):

| Variable | Example |
|----------|---------|
| `RESEND_API_KEY` | `re_...` |
| `EMAIL_FROM` | `Stitch ATS <onboarding@resend.dev>` (testing) |
| `APP_NAME` | `Stitch ATS` |

For production, verify your domain in Resend and set `EMAIL_FROM` to e.g. `Stitch ATS <noreply@yourdomain.com>`.

## Production (Netlify + Render + Neon)

1. Set `DATABASE_URL` (Neon), `JWT_SECRET`, `CLIENT_ORIGIN` on Render
2. **Root directory:** `server`  
3. **Build command:** `npm install && npm run build`  
4. **Start command:** `npm run start:deploy` (runs `prisma db push` then starts the API — do not run `db push` in the build step; a sleeping Neon DB would fail the build)  
5. **Environment:** `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` (your Netlify URL)
6. Clear Neon data (free — no Render Shell):  
   - **Option A:** Neon Console → **SQL Editor** → paste `server/prisma/clear-all.sql` → Run  
   - **Option B:** On your PC, set `DATABASE_URL` in `server/.env` to your Neon string, then `npm run db:clear --prefix server`  
7. Create your admin from your PC:  
   ```bash
   cd server
   # ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run db:bootstrap
   ```
8. Netlify serves the React app; `netlify.toml` proxies `/api` to Render

## Project layout

```
ATS/
  src/              # React app
  server/
    prisma/         # Schema
    src/
      routes/       # REST API
      scripts/      # clear-db, bootstrap-admin
```
