# Sales Insight Automator 📊

> Upload a sales dataset → AI analyzes it → Executive summary lands in your inbox.

[![CI](https://github.com/YOUR_USERNAME/sales-insight-automator/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/sales-insight-automator/actions/workflows/ci.yml)

## Architecture Overview

```
┌──────────────────┐     HTTPS/multipart-form     ┌─────────────────────────┐
│                  │ ─────────────────────────────▶│                         │
│  React SPA       │                               │  FastAPI Backend         │
│  (Vite, port     │                               │  (uvicorn, port 8000)   │
│   3000 / Vercel) │◀─────────────────────────────│                         │
│                  │     JSON (summary + status)   └──────────┬──────────────┘
└──────────────────┘                                          │
                                                   ┌──────────▼──────────────┐
                                                   │   pandas (parse)        │
                                                   │   Gemini API (analyze)  │
                                                   │   Resend / SMTP (email) │
                                                   └─────────────────────────┘
```

**Data flow:**
1. User uploads `.csv` / `.xlsx` + enters email via React SPA
2. FastAPI validates file (type, size), parses with **pandas**
3. Structured data context sent to **Google Gemini 1.5 Flash**
4. AI-generated executive summary emailed via **Resend** (or SMTP fallback)
5. Summary returned to frontend for in-browser preview

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Python | 3.11 |
| Node.js | 20 |
| Docker + Docker Compose | 24 |

---

## Quick Start (Docker — Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/sales-insight-automator.git
cd sales-insight-automator

# 2. Set up environment variables
cp .env.example .env
# Edit .env — fill in GEMINI_API_KEY and RESEND_API_KEY (or SMTP_* fields)

# 3. Build and run
docker compose up --build

# 4. Open the app
open http://localhost:3000

# 5. API docs
open http://localhost:8000/docs
```

---

## Local Development (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your API keys

# Run development server
uvicorn app.main:app --reload --port 8000
```

API docs → **http://localhost:8000/docs**

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server (proxies /api → localhost:8000)
npm run dev
```

App → **http://localhost:3000**

---

## Environment Variables

Copy [`.env.example`](.env.example) to `.env` in the project root and set the following:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key — [get one here](https://aistudio.google.com/app/apikey) |
| `RESEND_API_KEY` | ⭐ Recommended | [Resend](https://resend.com) API key for email delivery |
| `EMAIL_FROM` | ✅ Yes | Sender address (must be a verified domain with Resend) |
| `SMTP_HOST` | ⚠️ If no Resend | SMTP server hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | ⚠️ If no Resend | SMTP port (default `587`) |
| `SMTP_USERNAME` | ⚠️ If no Resend | SMTP login username |
| `SMTP_PASSWORD` | ⚠️ If no Resend | SMTP login password / app password |
| `SMTP_USE_TLS` | No | Use STARTTLS (default `true`) |
| `ALLOWED_ORIGINS` | No | JSON array of allowed CORS origins |
| `MAX_FILE_SIZE_MB` | No | Max upload size in MB (default `10`) |
| `VITE_API_URL` | No | Backend URL for frontend (leave blank for same-origin) |

> **Note:** `RESEND_API_KEY` takes priority. SMTP is only used if Resend is not configured.

---

## Project Structure

```
sales-insight-automator/
├── .env.example                  # Environment variable template
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI
├── docker-compose.yml            # Local orchestration
├── README.md
│
├── backend/
│   ├── Dockerfile                # Multi-stage Python image
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # FastAPI app, CORS, routing
│       ├── config.py             # Pydantic Settings
│       ├── routers/
│       │   └── upload.py         # POST /api/v1/analyze
│       ├── services/
│       │   ├── parser.py         # pandas CSV/XLSX parsing
│       │   ├── ai_service.py     # Gemini API integration
│       │   └── email_service.py  # Resend + SMTP fallback
│       ├── models/
│       │   └── schemas.py        # Pydantic response models
│       └── utils/
│           └── validators.py     # File type/size validation
│
└── frontend/
    ├── Dockerfile                # Node build → nginx serve
    ├── nginx.conf                # SPA routing, security headers
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx               # Main UI shell
        ├── index.css             # Design system
        ├── api/client.js         # Axios instance
        ├── hooks/useUpload.js    # Upload state + logic
        └── components/
            ├── FileUpload.jsx    # Drag-and-drop upload
            ├── EmailInput.jsx    # Email input + validation
            ├── StatusCard.jsx    # Loading/success/error UI
            └── SummaryPreview.jsx # Summary + copy button
```

---

## API Reference

Base URL: `http://localhost:8000`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/analyze` | Upload file + email → AI summary + email sent |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/docs` | Swagger / OpenAPI UI |
| `GET` | `/redoc` | ReDoc API docs |

### `POST /api/v1/analyze`

**Request** — `multipart/form-data`:
- `file` — `.csv`, `.xlsx`, or `.xls` (max 10 MB)
- `recipient_email` — valid email address (string)

**Response** — `200 OK`:
```json
{
  "status": "success",
  "message": "Executive summary generated and emailed to you@example.com.",
  "summary": "# Executive Summary\n\n## Performance Overview\n...",
  "recipient_email": "you@example.com"
}
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Set **Root Directory** to `frontend`
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Backend → Render

1. Create a new **Web Service** in [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Runtime**: Docker
5. **Port**: `8000`
6. Add all environment variables from `.env.example`
7. Set `ALLOWED_ORIGINS=["https://your-app.vercel.app"]`

---

## Security Features

- ✅ File type whitelist (`.csv`, `.xlsx`, `.xls` only)
- ✅ File size limit (configurable, default 10 MB)
- ✅ CORS protection with configurable origin list
- ✅ Non-root Docker user (`appuser`)
- ✅ Nginx security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ All secrets loaded from environment variables — never hardcoded
- ✅ `.env` excluded from version control via `.gitignore`

---

## CI/CD

GitHub Actions runs on every **push** and **pull request** to `main`:

| Job | What it checks |
|---|---|
| `backend-lint` | `ruff check app/` |
| `backend-build` | Docker image builds successfully |
| `frontend-lint` | `eslint src/` |
| `frontend-build` | `vite build` produces valid `dist/` |
| `frontend-docker-build` | Frontend Docker image builds successfully |

---

## License

MIT
