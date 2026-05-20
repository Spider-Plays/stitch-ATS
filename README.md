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

# Create schema (local: set DATABASE_URL in server/.env)
npm run db:setup --prefix server

# Create your first admin (set credentials in the shell)
cd server
set ADMIN_EMAIL=you@company.com
set ADMIN_PASSWORD=your-secure-password
set ADMIN_NAME=Your Name
npm run db:bootstrap
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
| `npm run db:seed` | Seed users from `src/config/users.ts` (empty by default) |

## Production (Netlify + Render + Neon)

1. Set `DATABASE_URL` (Neon), `JWT_SECRET`, `CLIENT_ORIGIN` on Render
2. **Build command** (no demo seed):  
   `npm install && npx prisma generate && npm run build && npx prisma db push`
3. Clear Neon data (free — no Render Shell):  
   - **Option A:** Neon Console → **SQL Editor** → paste `server/prisma/clear-all.sql` → Run  
   - **Option B:** On your PC, set `DATABASE_URL` in `server/.env` to your Neon string, then `npm run db:clear --prefix server`  
4. Create your admin from your PC:  
   ```bash
   cd server
   # ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run db:bootstrap
   ```
4. Netlify serves the React app; `netlify.toml` proxies `/api` to Render

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
