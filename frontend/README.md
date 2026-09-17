# Career Guidance — Frontend

React 19 + Vite single-page application for the Career Guidance System.

This is the `frontend/` piece of a three-service local stack (frontend +
Node/Express backend + Python ML service + PostgreSQL). It does not run
standalone — see the project root [README.md](../README.md) and
[SETUP.md](../SETUP.md) for full setup instructions.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api to localhost:4000
```

## Structure

```
src/
├── components/   Reusable UI: CareerCard, SkillChips, Loading/Error/Empty states, ProtectedRoute
├── pages/        One file per route: Dashboard, Profile, Recommendations, Careers, Skills, Resume, Jobs, Game...
├── layouts/       AppLayout (the "trail map" sidebar), AuthLayout styles
├── context/       AuthContext (JWT held in memory + localStorage, not cookies)
├── hooks/         useAsync (shared loading/error/data fetching pattern)
└── services/api.js   Single fetch client — every backend call goes through here
```

## Environment

`VITE_API_BASE_URL` — leave unset for local dev (Vite's dev server proxy
in `vite.config.js` forwards `/api` and `/files` to `http://localhost:4000`).
Set it explicitly when building for a deployment where the frontend and
backend aren't served from the same origin.

## Design system

Custom CSS (no framework) defined in `src/index.css` — see the "trail
map" token system: `--ink`, `--paper`, `--trail`, `--waypoint` etc. The
sidebar nav in `AppLayout.jsx`/`.css` is the signature visual element: a
dashed vertical "trail" connecting each stage of the user's real journey
through the product (profile → recommendations → skills → resume → jobs).
