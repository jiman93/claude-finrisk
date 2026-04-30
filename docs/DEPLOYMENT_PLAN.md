# Deployment Plan: FinRisk User Study

**Branch:** `deploy/user-study-setup`
**Target:** DigitalOcean Droplet, 1 GiB RAM, $6/mo
**Study window:** ~2–4 weeks, 5–8 remote participants via MS Teams

---

## Architecture

```
Participant (Teams screen share)
        │
        ▼
  nginx (port 443, HTTPS)
    ├── /        → React static build (dist/)
    └── /api/*   → FastAPI uvicorn (port 8000)
                        │
                   finrisk.db (SQLite, named volume)
                   data/tree_index/*.json (baked into image)
                        │
                   OpenAI API (external)
```

---

## What Gets Built

### 1. `requirements-prod.txt`
Lean dependency file — excludes `chromadb` and `sentence-transformers` (PyTorch, ~800MB RAM) since `RETRIEVAL_MODE=tree` is used in production.

```
fastapi
uvicorn[standard]
sqlalchemy
pydantic
pydantic-settings
httpx
```

### 2. `Dockerfile` (backend)
- Base: `python:3.11-slim`
- Copies `src/backend/`, `data/tree_index/`, `requirements-prod.txt`
- Runs uvicorn on port 8000
- SQLite DB lives on a mounted volume at `/app/data/finrisk.db`

### 3. Frontend build step
- `npm run build` in `src/frontend/`
- Sets `VITE_API_URL=/` (relative, so nginx proxy handles it)
- Output `dist/` copied into nginx image

### 4. `nginx.conf`
- Serves `dist/` as static files
- Proxies `/api` → `backend:8000`
- HTTPS via Let's Encrypt (Certbot)

### 5. `docker-compose.yml`
Two services:
- `backend` — FastAPI image, env vars from `.env`, SQLite volume
- `nginx` — serves frontend + reverse proxies backend, port 80/443

### 6. `.env.production` (not committed)
```
DATABASE_URL=sqlite:////app/data/finrisk.db
RETRIEVAL_MODE=tree
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o          # confirm model name
API_HOST=0.0.0.0
API_PORT=8000
```

---

## Deployment Steps (one-time)

1. **Provision Droplet**
   - DigitalOcean, Ubuntu 22.04, 1 GiB RAM, London or Amsterdam region
   - Add SSH key, note IP address

2. **Point DNS**
   - Add `A` record: `finrisk.yourdomain.com` → Droplet IP
   - Or use raw IP with self-signed cert (less ideal for participants)

3. **Install Docker on Droplet**
   ```bash
   apt update && apt install -y docker.io docker-compose-plugin
   ```

4. **Clone repo + copy secrets**
   ```bash
   git clone <repo> claude-finrisk
   cd claude-finrisk
   cp .env.example .env.production
   # fill in OPENAI_API_KEY etc.
   ```

5. **Build and start**
   ```bash
   docker compose up -d --build
   ```

6. **HTTPS (Certbot)**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d finrisk.yourdomain.com
   ```

7. **Seed study assignments**
   ```bash
   curl -X POST https://finrisk.yourdomain.com/api/study/assignments/generate-defaults
   ```

8. **Smoke test**
   - Visit `https://finrisk.yourdomain.com`
   - Log in as P00, run WMT tutorial query end-to-end
   - Check admin panel at `/admin`

---

## Per-Session Checklist (day of study)

- [ ] Confirm Droplet is running (`docker compose ps`)
- [ ] Verify participant assignment exists (`GET /api/study/assignments/P0X`)
- [ ] Share URL with participant before Teams call
- [ ] Start screen recording on Teams
- [ ] After session: export session data (`GET /api/admin/sessions`)

---

## Cost & Timeline

| Item | Cost |
|---|---|
| DigitalOcean 1 GiB Droplet | ~$6/mo |
| OpenAI API (per session, ~3 queries + generates) | ~$0.05–0.20/session |
| Let's Encrypt | Free |
| **Total for 4-week study** | **~$6–8** |

Droplet can be destroyed after study data is exported.

---

## Open Questions

- [ ] Do you have a domain to add a subdomain to?
- [ ] Confirm OpenAI model names in `.env` (explorer found `gpt-5.2` — is that correct?)
- [ ] Do participants need accounts/passwords, or is participant ID the only gate?
