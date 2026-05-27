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
      infrastructure/    # Config, factories, DB
  web/                   # Frontend (React + Vite)
packages/
  shared/                # Shared types (DTOs, enums)
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

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `USE_FAKE_REPO` | Use in-memory data instead of Oracle | `true` |

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
