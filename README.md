# FinRisk HITL

Research prototype for studying how Human-in-the-Loop oversight affects AI-generated financial risk summaries from SEC 10-K filings.

16 participants complete a 3-phase within-subjects study across 4 HITL modes (Baseline, HITL-R, HITL-G, HITL-Full) with Latin-square counterbalancing.

## Quick Start

```bash
# Backend
cd src/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# Frontend
cd src/frontend
npm install
npm run dev
```

Open http://localhost:5173. Swagger UI at http://localhost:8000/swagger.

## Configuration

Copy `.env.example` to `.env`. Key settings:

- `RETRIEVAL_MODE` — `tree` (default, LLM-guided traversal), `local` (ChromaDB), or `pageindex` (remote API)
- `OPENAI_API_KEY` — required for generation (gpt-5.2) and tree navigation (o3-mini)
- `PAGEINDEX_API_KEY` / `PAGEINDEX_DOC_MAP` — required for tree index building and pageindex retrieval mode

## Data Setup

```bash
# 1. Download 10-K filings from SEC EDGAR
python scripts/download_10k_html.py --tickers MSFT AAPL TSLA JPM PFE WMT XOM BA

# 2. Build tree indexes (requires PageIndex API)
python scripts/build_tree_index.py --tickers MSFT AAPL TSLA JPM PFE WMT XOM BA

# 3. (Optional) Ingest into ChromaDB for local fallback
python scripts/ingest_10k.py --tickers MSFT AAPL TSLA JPM PFE WMT XOM BA
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Zustand, Vite |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |
| Retrieval | LLM-guided tree traversal (o3-mini), ChromaDB fallback |
| Generation | OpenAI (gpt-5.2) with template fallback |

## Documentation

See [docs/SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md) for the full system reference — architecture, study design, API surface, data model, and file structure.
