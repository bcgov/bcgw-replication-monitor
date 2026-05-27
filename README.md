# BCGW Replication Monitor

Web application for monitoring BCGW replication (ETL) job runs across different data sources.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, Vite, TypeScript
- **Architecture**: Lite hexagonal architecture
- **Deployment**: OpenShift (Kong routing + SSO)

## Project Structure

```
apps/
  api/    # Backend service
  web/    # Frontend (React)
```

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

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `USE_FAKE_REPO` | Use in-memory fake data | `true` |

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

## Notes

- Kong handles routing and authentication in deployed environments
