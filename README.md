# BCGW Replication Monitor

Web application for monitoring BCGW replication job runs across different data sources.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, TypeScript
- **Architecture**: Lite hexagonal architecture

## Architecture

Monorepo with lite hexagonal architecture.

```
apps/
  api/                   # Backend (Express + TypeScript)
    src/
      domain/            # Core business models (JobRun)
      ports/             # Interfaces (e.g. JobRunRepository)
      adapters/          # Implementations (Fake, Oracle)
      http/              # Routes and mappers
      infrastructure/    # Config, DB
  web/                   # Frontend (React + Vite)
```

The backend uses ports and adapters to decouple the domain from data sources.

## Running Locally

### Backend

```bash
cd apps/api
npm install
npm run dev
```

Runs on `http://localhost:3000`

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Runs on `http://localhost:5173`

## Running with Fake vs Oracle Data

Controlled by `USE_FAKE_REPO` in `apps/api/.env`:

- `USE_FAKE_REPO=true` — uses in-memory test data (default)
- `USE_FAKE_REPO=false` — connects to Oracle

## Authentication (local vs deployed)

In deployed environments, Kong handles SSO and forwards the
authenticated user's info to the API via an `X-Userinfo` header. The API
restricts access to members of the admin group and exposes the current
user's roles at `GET /api/me`.

Locally there is no Kong, so no `X-Userinfo` header is present. To allow
local development, the API injects a fake admin user **only** when
`NODE_ENV=development` (set in env file). This is fail-safe: any
other value (including `production`, `test`, or an unset value) skips the
injection and enforces real authentication.

## Testing

```bash
# Backend
cd apps/api && npm run test

# Frontend
cd apps/web && npm run test
```

## Environment Variables

### API (`repl-monitor-api`)


| Variable        | Example      | Description                       |
|-----------------|--------------|-----------------------------------|
| `PORT`          | `3000`       | Port the API listens on           |
| `NODE_ENV`      | `development` | Node environment (`development` locally, `production` when deployed) |
| `USE_FAKE_REPO` | `false`      | Use in-memory fake data if `true` |


| Variable                | Description                             |
|-------------------------|-----------------------------------------|
| `ORACLE_USER`           | Oracle username                         |
| `ORACLE_PASSWORD`       | Oracle password                         |
| `ORACLE_CONNECT_STRING` | Oracle connection (`host:port/service`) |
| `ORACLE_VIEW`           | Main-page view name                     |
| `ORACLE_HISTORY_VIEW`   | History view name                       |

### Web (`repl-monitor-web`)

No runtime environment variables. The frontend is pre-built static files served by nginx, calling the API via relative `/api` paths.

## Docker

### Build and run with Docker Compose

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- API: `http://localhost:3000`

### Build individually

```bash
cd apps/api
docker build -t repl-monitor-api .

cd apps/web
docker build -t repl-monitor-web .
```
