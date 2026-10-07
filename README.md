# Insurly — Parametric Income Insurance Platform

Insurly is an educational insurance operations platform for food-delivery workers. A worker can lose income when external disruptions such as heavy rainfall, extreme heat, or flooding interrupt deliveries. Insurly models parametric coverage: when a recorded event meets a policy's configured type, zone, and threshold, the application creates and processes a claim using deterministic rules.

## Core workflow

```text
Worker → Policy → Disruption Event → Zone Matching → Threshold Check
       → Automatic Claim → Rule-based Risk/Fraud Score → Simulated Payout
```

Events are entered through the application/admin workflow. They are not live weather, IoT, or satellite feeds. Payout records are simulated; there is no payment gateway or bank transfer. `transaction_reference` is an internal simulated reference. Risk/fraud scoring uses deterministic rules; this project does not implement AI or machine learning.

## Technology and architecture

- **Frontend:** React 19, JavaScript/JSX, Vite 7, plain CSS
- **Backend:** Python, FastAPI, Pydantic v2
- **Database:** PostgreSQL, SQLAlchemy 2
- **Authentication/security:** JWT bearer tokens, bcrypt password hashing

```text
React
  ↓ REST/JSON
FastAPI
  ↓ SQLAlchemy
PostgreSQL
```

## Implemented features

- Login, public worker registration, JWT authentication, and role checks
- Admin dashboard summary and client-side analytics derived from returned records
- Worker listing for administrators and a current-worker endpoint
- Policy listing and administrator policy creation
- Disruption-event listing and administrator event creation
- Automatic parametric claim creation when a new event qualifies
- Rule-based risk/fraud score and simulated payout record creation
- Claims listing with worker-visible claims restricted to that worker
- Responsive operations UI with claim search, filters, sorting, and pagination; event and policy search/filter controls

The UI's analytics are calculated from data returned by the existing APIs. They do not create or estimate records. Claims and events are read-only in their management tables; policies and events can be created, but no edit/delete API is present.

## API overview

All application API routes use the `/api` prefix. Protected routes require `Authorization: Bearer <access_token>` unless indicated otherwise. `/docs` is the FastAPI Swagger UI.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a worker account; public input cannot grant an admin role |
| `POST` | `/api/auth/login` | Public | Authenticate and return a bearer token and user |
| `GET` | `/api/auth/me` | Authenticated | Return the current user |
| `GET` | `/api/workers` | Admin | List workers |
| `GET` | `/api/workers/me` | Authenticated | Return the current user |
| `GET` | `/api/policies` | Authenticated | List policies; workers see only their own |
| `POST` | `/api/policies` | Admin | Create a policy for a worker |
| `GET` | `/api/events` | Admin | List disruption events |
| `POST` | `/api/events` | Admin | Record an event and run automatic claim processing |
| `GET` | `/api/claims` | Authenticated | List claims; workers see only their own |
| `GET` | `/api/dashboard/summary` | Admin | Return worker, active-policy, event, claim, and total-payout summary values |
| `GET` | `/` | Public | API status message |
| `GET` | `/health` | Public | Health status |

FastAPI also exposes `/openapi.json` and `/docs` using its standard configuration.

## Data model

- **User (`users`)** has many policies and claims. Worker accounts include a zone.
- **Policy (`policies`)** belongs to a user through `worker_id` and can have claims.
- **DisruptionEvent (`disruption_events`)** stores event type, city, affected zones, reading, unit, severity, source, and creation time; it can have claims.
- **Claim (`claims`)** references its worker, policy, and event. It stores status, rule-based risk score/reason, payout amount, processing flag, and creation time.
- **Payout (`payouts`)** belongs to one claim; `claim_id` is unique. It stores amount, status, internal transaction reference, and processing time.

When an administrator records an event, the backend saves it and checks active workers in the affected zones. It considers active policies for the event type, checks the event reading against each policy threshold, and avoids duplicate claims for the same worker, policy, and event. Matching claims receive a deterministic score and a simulated processed payout. This is synchronous application logic, not a separate background worker.

## Local development setup

### 1. Start PostgreSQL

Docker Compose is configured to run PostgreSQL 16 locally and persist its data in the `insurly_pgdata` volume. Supply a local database password in the shell environment:

```bash
export POSTGRES_PASSWORD='choose-a-local-password'
docker compose up -d db
```

PostgreSQL binds to port `5432`. Set `backend/.env`'s `DATABASE_URL` to use the same local database password. Do not reuse local credentials for a deployed environment. Alternatively, use an existing PostgreSQL server and database, then set the backend connection URL accordingly.

### 2. Configure and start FastAPI

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
if [ ! -f .env ]; then cp .env.example .env; fi
```

Edit `backend/.env` for the local PostgreSQL connection and replace the `SECRET_KEY` placeholder with a unique, private key before starting the API. `DATABASE_URL` and `SECRET_KEY` are required settings. `CORS_ORIGINS` defaults to `http://localhost:5173`.

Start the API from the `backend` directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API is at `http://127.0.0.1:8000`; Swagger UI is at `http://127.0.0.1:8000/docs`. The application calls SQLAlchemy `create_all` during startup to create missing tables. This is a learning-project setup mechanism, not a versioned migration system.

### 3. Start the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the UI at `http://localhost:5173`. The frontend defaults to the API URL `http://127.0.0.1:8000`; set `VITE_API_URL` in a local frontend environment file if the backend runs elsewhere. To create a production frontend bundle:

```bash
npm run build
```

### Local demo accounts

`backend/seed.py` contains optional development account and sample-record setup and writes to the configured database. It is not run automatically. Before running it, provide `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_WORKER_EMAIL`, and `SEED_WORKER_PASSWORD` in the shell environment; the script has no embedded account passwords. Run it only against a disposable local development database. Public registration creates worker accounts; it does not provide a way to grant administrator access.

## Tests and build checks

- `backend/test_api.py` is a basic HTTP smoke script. With the backend running at `http://127.0.0.1:8000`, run `python test_api.py` from `backend/`; it requests `/`, `/health`, and `/docs`. It does not test claim rules, authentication flows, or database behavior.
- `npm run build` runs the Vite production build from `frontend/`.
- No dedicated automated unit/integration test suite is currently present.

## Current limitations / production considerations

**Current MVP implementation:** event data is entered through the application; claim processing runs synchronously when an event is created; risk/fraud scoring is rule-based; payouts are simulated; and there is no payment provider integration. Policy/event/claim APIs provide the create/list/read operations described above, not a complete edit/delete lifecycle. The dashboard summary provides aggregate counts and payout total, while additional UI analytics are derived from the records the APIs return.

**Future production requirements:** the application currently creates missing tables at startup rather than using versioned migrations. The default configuration includes development fallback values, so deployments must supply private database and signing-key settings. The project does not include rate limiting, audit logging, background job infrastructure, external event-feed ingestion, payment integration, or monitoring/observability. These are deployment/product gaps, not implemented features.

## Roadmap — NOT CURRENTLY IMPLEMENTED

- External weather/environmental data ingestion
- Background event processing and operational retry handling
- Production session management, rate limiting, and secrets management
- Versioned database migrations
- Real payment integration
- Expanded deterministic fraud rules and review workflows
- ML-based risk prediction (proposed; no ML model exists in this project)
- Cloud deployment, monitoring, and observability

## Project structure

```text
insurly-react-fastapi-postgresql/
├── backend/
│   ├── app/
│   │   ├── routers/          # auth, workers, policies, events, claims, dashboard
│   │   ├── services/         # claim automation
│   │   ├── config.py         # environment-backed settings
│   │   ├── database.py       # SQLAlchemy engine and session
│   │   ├── main.py           # FastAPI app, CORS, startup table creation
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   └── security.py       # password hashing, JWT, authorization
│   ├── seed.py               # development account/sample data script
│   ├── test_api.py           # basic HTTP smoke script
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── docker-compose.yml
└── README.md
```
