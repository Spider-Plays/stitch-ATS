# Stitch ATS

React frontend + Node.js API with Prisma (SQLite for local dev; switch to PostgreSQL for production).

## Architecture

| Layer | Tech |
|--------|------|
| **Client** | React 18, Vite, TanStack Query, Tailwind |
| **API** | Express, JWT auth, Zod validation |
| **Database** | Prisma ORM (SQLite dev / PostgreSQL prod) |

## Quick start

```bash
# Install all dependencies
npm install
cd server && npm install && cd ..

# Create DB and seed demo users
npm run db:setup

# Run API (port 4000) + React (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

Password for all: **`password`**

| Role | Email |
|------|--------|
| Admin | `admin@stitch.com` |
| HR Manager | `hr@stitch.com` |
| Recruiter | `recruiter@stitch.com` |
| Team Lead | `lead@stitch.com` |
| Hiring Manager | `manager@stitch.com` |
| Interviewer | `interviewer@stitch.com` |
| Candidate | `candidate@stitch.com` |

Edit users in **`server/src/config/users.ts`**, then run:

```bash
npm run db:seed --prefix server
```

## Production scaling

1. Set `DATABASE_URL` to PostgreSQL in `server/.env`
2. Change `provider` in `server/prisma/schema.prisma` to `postgresql`
3. Run `npx prisma migrate deploy` in `server/`
4. Set a strong `JWT_SECRET`
5. Build client: `npm run build`
6. Serve API behind a reverse proxy; set `CLIENT_ORIGIN` to your app URL

## Project layout

```
ATS/
  src/              # React app
  server/
    prisma/         # Schema & SQLite DB
    src/
      routes/       # REST API
      config/users.ts
```
