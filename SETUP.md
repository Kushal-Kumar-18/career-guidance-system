# Setup Guide

Step-by-step instructions to get the Career Guidance System running
locally, and to put the project under Git version control and push it to
a remote (e.g. GitHub).

---

## Part 1 — Prerequisites

Install these before starting:

| Tool | Version used in development | Check with |
|---|---|---|
| Node.js | 20+ (tested on 22) | `node -v` |
| Python | 3.11+ (tested on 3.12) | `python3 --version` |
| PostgreSQL | 16 | `psql --version` |
| Git | any recent version | `git --version` |

---

## Part 2 — Local application setup

Do these in order. Each service runs in its own terminal/tab and keeps
running while you work.

### Step 1 — Create the database

```bash
# Start Postgres if it isn't already running (varies by OS):
#   macOS (Homebrew):  brew services start postgresql@16
#   Linux (systemd):   sudo service postgresql start
#   Windows:            starts automatically as a service after install

createdb career_guidance
```

### Step 2 — Load the schema

```bash
cd career-guidance-modernized
psql career_guidance -f db/schema.sql
```

You should see a series of `CREATE TABLE` / `CREATE INDEX` lines with no
errors. This creates all 15 tables (users, profiles, recommendation
history, skill tests, resumes, job postings, etc.).

### Step 3 — (Optional) Load demo data

```bash
psql career_guidance -f db/seeds/dev_seed.sql
```

This adds one synthetic demo account you can log in with immediately:
- **Email:** `demo@example.com`
- **Password:** `password123`

### Step 4 — Start the ML service (Python/FastAPI)

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Leave this running. Verify it's healthy in a new terminal:

```bash
curl http://localhost:8000/health
# {"status":"ok","model_loaded":true, ...}
```

### Step 5 — Start the backend (Node/Express)

In a **new terminal**:

```bash
cd career-guidance-modernized/backend
npm install
cp .env.example .env
```

Open `.env` and set at minimum:

```
DATABASE_URL=postgresql://<your-pg-user>:<your-pg-password>@localhost:5432/career_guidance
AUTH_SECRET=<generate one — e.g. `openssl rand -hex 32`>
```

Then start it:

```bash
node server.js
```

Verify:

```bash
curl http://localhost:4000/api/health
# {"success":true,"data":{"api":"ok","database":"ok","mlService":"ok"}}
```

If `database` or `mlService` don't say `"ok"`, double-check Steps 1-4.

### Step 6 — Start the frontend (React/Vite)

In another **new terminal**:

```bash
cd career-guidance-modernized/frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. Log in with the demo
account from Step 3, or register a new one.

### Quick reference — what runs where

| Service | Port | Start command |
|---|---|---|
| PostgreSQL | 5432 | (system service) |
| ML service | 8000 | `uvicorn app.main:app --reload --port 8000` |
| Backend API | 4000 | `node server.js` |
| Frontend | 5173 | `npm run dev` |

---

## Part 3 — Connect the project to Git

### Suggested repository details

- **Name:** `career-guidance-modernized`
- **Description:** *A career guidance platform (React + Node/Express +
  PostgreSQL + Python ML service) that recommends careers from a user's
  skills and profile, verifies skills through generated quizzes, tracks
  skill gaps, builds ATS-scored resumes, and surfaces live job-market
  trends — powered by a hybrid fuzzy-matching + gradient-boosted ML
  recommender.*
- **Visibility:** Private is recommended while `AUTH_SECRET`/API keys are
  still placeholder values in your local `.env` files (those files are
  git-ignored already, but keep visibility in mind regardless).

### Step 1 — Initialize Git in the project

If this is your first time using Git on this machine, set your identity
first (skip if already configured):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Then initialize the repo:

```bash
cd career-guidance-modernized
git init
git branch -M main
```

### Step 2 — Confirm secrets are excluded

The project's `.gitignore` already excludes `node_modules/`, `.venv/`,
`.env` files (but keeps `.env.example`), build output, and local
storage. Double-check before your first commit:

```bash
git status
```

You should **not** see `backend/.env`, `ml-service/.env`, or anything
under `node_modules/`/`.venv/` in the list of files to be added. If you
do, check that `.gitignore` is present at the project root.

### Step 3 — Make the first commit

```bash
git add .
git commit -m "Initial commit: modernized Career Guidance System (React + Express + PostgreSQL + FastAPI ML service)"
```

### Step 4 — Create the remote repository

Pick one:

**Option A — GitHub CLI (fastest, if installed):**
```bash
gh repo create career-guidance-modernized \
  --description "React + Node/Express + PostgreSQL + Python ML career guidance platform" \
  --private \
  --source=. \
  --remote=origin \
  --push
```
This single command creates the repo, sets the remote, and pushes —
skip to Step 6 if you use this.

**Option B — GitHub website:**
1. Go to https://github.com/new
2. Repository name: `career-guidance-modernized`
3. Description: paste the description from "Suggested repository
   details" above
4. Choose **Private** or **Public**
5. Do **not** initialize with a README, .gitignore, or license (this
   project already has them — that avoids a merge conflict on first push)
6. Click **Create repository**

### Step 5 — Connect the local repo to the remote (Option B only)

GitHub will show you a remote URL after creating the repo. Use it here:

```bash
git remote add origin https://github.com/<your-username>/career-guidance-modernized.git
```

(Using SSH instead: `git remote add origin git@github.com:<your-username>/career-guidance-modernized.git`)

### Step 6 — Push

```bash
git push -u origin main
```

### Step 7 — Verify

```bash
git remote -v
```

You should see `origin` listed with your fetch/push URLs. Refresh the
GitHub repo page — your code should now be there.

---

## Part 4 — Everyday Git workflow (for future changes)

```bash
git status                 # see what changed
git add <files>            # stage specific files (or `git add .` for everything)
git commit -m "Describe the change"
git push                   # after the first `-u` push, plain `git push` works
```

For feature branches:

```bash
git checkout -b feature/some-change
# ... make changes ...
git add .
git commit -m "Add some-change"
git push -u origin feature/some-change
# then open a Pull Request on GitHub
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `psql: command not found` | PostgreSQL client not installed / not on PATH | Install PostgreSQL, or use the full path to `psql` |
| Backend health check shows `"database":"error"` | `DATABASE_URL` wrong, or Postgres not running | Check `.env`, confirm `pg_isready` |
| Backend health check shows `"mlService":"error"` | ML service not running, or wrong `ML_SERVICE_URL` | Confirm Step 4 is running on port 8000 |
| Frontend shows network errors calling `/api/...` | Backend not running, or wrong port | Confirm Step 5 is running on port 4000; Vite proxies `/api` → `:4000` by default |
| `git push` asks for credentials repeatedly | Using HTTPS without a saved credential | Use `gh auth login`, a Personal Access Token, or switch the remote to SSH |
