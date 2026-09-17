# Local Setup

Exact steps to run all three services locally. For the Git/GitHub
push workflow, see [SETUP.md](../SETUP.md) at the project root — this
document only covers getting the application running on your machine.

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20+ | `node -v` |
| Python | 3.11+ | `python3 --version` |
| PostgreSQL | 16 | `psql --version` |

Docker + Docker Compose are optional — see [Option B](#option-b--docker-compose) below.

## Option A — run each service natively

### 1. Database

```bash
createdb career_guidance
psql career_guidance -f db/schema.sql
psql career_guidance -f db/seeds/dev_seed.sql   # optional demo user
```

Demo login (from the seed): `demo@example.com` / `password123`.

### 2. ML service (FastAPI)

```bash
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

The defaults keep feedback ratings in a local JSON file
(`FEEDBACK_STORE=json`), so no database is needed to run the ML service
on its own. In Docker/deployed environments this should be
`FEEDBACK_STORE=postgres` — both Compose files already set it — so
ratings survive container recreation. See
[AI_ML.md](./AI_ML.md#feedback-loop-end-to-end).

Verify: `curl http://localhost:8000/health` → `{"status":"ok","model_loaded":true,...}`

### 3. Backend (Express)

```bash
cd backend
npm install
cp .env.example .env
```

Set at minimum in `.env`:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/career_guidance
AUTH_SECRET=<generate one, e.g. `openssl rand -hex 32`>
ML_SERVICE_URL=http://localhost:8000
```

For local development `AUTH_SECRET` can be anything (it falls back to a
dev default if left blank). With `NODE_ENV=production` the backend
**refuses to start** unless it is set explicitly, is not a known
placeholder, and is at least 32 characters — see
[SECURITY.md](./SECURITY.md#production-startup-validation).

Rate limiting is on by default. If you're load-testing locally and start
seeing `429`s, set `RATE_LIMIT_ENABLED=false` or raise
`RATE_LIMIT_MULTIPLIER` rather than editing the buckets in code.

```bash
node server.js
```

Verify: `curl http://localhost:4000/api/health` →
`{"success":true,"data":{"api":"ok","database":"ok","mlService":"ok"}}`

### 4. Frontend (Vite/React)

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL — leave blank for local dev
npm run dev
```

Open **http://localhost:5173**.

### Ports reference

| Service | Port |
|---|---|
| PostgreSQL | 5432 |
| ML service | 8000 |
| Backend API | 4000 |
| Frontend (dev) | 5173 |
| Frontend (docker `serve`) | 4173 |

## Option B — Docker Compose

```bash
docker compose up --build
```

This starts `postgres`, `ml-service`, `backend`, and `frontend` together
and loads `db/schema.sql` automatically via Postgres's
`docker-entrypoint-initdb.d` mechanism. `postgres` has a healthcheck
(`pg_isready`), and `backend` waits on it (`condition:
service_healthy`) before starting, so there's no startup race between
the database and the API.

The frontend container serves the production build via `serve` on
`:4173`, not the Vite dev server, so hot reload isn't available in this
mode — use Option A while actively developing the UI.

**Frontend → backend URL in Docker:** the frontend's API base URL
(`VITE_API_BASE_URL`) is inlined into the JS bundle at *build* time by
Vite — there's no dev-server proxy in the production build the
container serves. `docker-compose.yml` passes it as a build arg
(`VITE_API_BASE_URL: http://localhost:4000`), matching the backend's
host-mapped port, since the browser making the request runs on your
host machine, not inside the Docker network. If you change which host
port the backend is published on, update this build arg to match.

This compose file is written to spec but was not build-tested against
a live Docker daemon in the environment this project was assembled in
— validate it end-to-end before relying on it (`docker compose config`
to lint, then `docker compose up --build` and check each service's
logs).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `psql: command not found` | PostgreSQL client not installed / not on PATH | Install PostgreSQL, or use the full path to `psql` |
| Backend health check shows `"database":"error"` | `DATABASE_URL` wrong, or Postgres not running | Check `.env`, confirm `pg_isready` |
| Backend health check shows `"mlService":"error"` | ML service not running, or wrong `ML_SERVICE_URL` | Confirm the ML service is up on port 8000 |
| Frontend shows network errors calling `/api/...` | Backend not running, or wrong port | Confirm backend is on port 4000; Vite proxies `/api` → `:4000` |
| `ModuleNotFoundError` in the ML service | Virtualenv not activated, or deps not installed | Re-run `pip install -r requirements.txt` inside the activated `.venv` |
