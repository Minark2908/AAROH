# AAROH

Monorepo for the AAROH farm intelligence platform: a **Next.js** web app and a **FastAPI** ML/API backend.

## Repository layout

```
AAROH_PROJECT/
├── README.md          # This file
├── .gitignore
├── ml-service/        # FastAPI API, auth, ML inference
│   ├── database/      # SQLAlchemy engine/session + DB setup & migration scripts
│   ├── models.py      # ORM models
│   └── ...
├── ui/                # Next.js 16 app (farmer + admin UI)
└── training/          # Dataset prep & model training scripts (optional)
```

| Path | Role |
|------|------|
| [`ui/`](ui/) | Farmer and admin dashboards (Next.js 16, App Router). Run `npm install` and `npm run dev` here. |
| [`ml-service/`](ml-service/) | REST API, auth, pest model, reports (Python 3.12 + FastAPI). |
| [`ml-service/database/`](ml-service/database/) | Engine, sessions, and DB utilities. From `ml-service/`: `python -m database.setup_db`, `python -m database.upgrade_db`, `python -m database.check_db`. |
| [`training/`](training/) | Dataset prep and training scripts; generated `processed_dataset/` and zips are gitignored. |

There is a single canonical frontend under **`ui/`**. Do not add a second Next app at the repo root.

## Quick start

**API (from `ml-service/`):**

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**First-time database setup** (from `ml-service/` after dependencies are installed):

```bash
python -m database.setup_db
# Optional: apply incremental SQL migrations
python -m database.upgrade_db
```

**Web (from `ui/`):**

```bash
cd ui
npm install
npm run dev
```

Point the UI at your API (see `ui` env variables and `next.config.ts` rewrites). By default the UI can proxy the API via `/api-proxy` when `NEXT_PUBLIC_API_URL` / `INTERNAL_API_URL` are set appropriately.

## Git and hygiene

- Do not commit `venv/`, `__pycache__/`, `*.pyc`, `*.log`, `ui/.next/`, `node_modules/`, or files under `ml-service/uploads/` (only `.gitkeep` is tracked).
- Large weights (`*.pth`) and training bundles are ignored by default; distribute them via release assets or Git LFS if you need them in automation.
