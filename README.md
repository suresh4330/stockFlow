# StockFlow

StockFlow is a DevOps-focused inventory management project with a polished React dashboard frontend, FastAPI backend, PostgreSQL database, Docker Compose orchestration, Nginx reverse proxy, Prometheus metrics, Grafana dashboards, tests, and GitHub Actions CI.

## Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- Pytest
- Docker and Docker Compose
- Nginx
- Prometheus
- Grafana
- GitHub Actions
- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- Recharts

## Local setup

Copy the environment example if you want to customize values:

```bash
cp .env.example .env
```

Start the backend and DevOps stack:

```bash
make up
```

Useful URLs:

- App through Nginx: `http://localhost:8081`
- Frontend direct container: served internally by Docker Compose
- Backend health: `http://localhost:8081/api/health`
- API docs: `http://localhost:8081/docs`
- Backend direct: `http://localhost:8000`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Grafana through Nginx: `http://localhost:8081/grafana`

Default demo users seeded into the database:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@stockflow.local` | `admin12345` |
| Manager | `manager@stockflow.local` | `manager12345` |
| Staff | `staff@stockflow.local` | `staff12345` |

## Commands

```bash
make up              # Start the local stack
make down            # Stop containers
make logs            # Follow container logs
make test            # Run backend tests
make seed            # Seed local backend database
make ps              # Show containers
make compose-config  # Validate compose config
```

For frontend-only development:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to the backend at `http://localhost:8000`.

## Backend API

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Inventory:

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/{id}`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`
- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/suppliers/{id}`
- `PUT /api/suppliers/{id}`
- `DELETE /api/suppliers/{id}`

Stock and alerts:

- `POST /api/stock/in`
- `POST /api/stock/out`
- `GET /api/stock/transactions`
- `GET /api/stock/transactions/{id}`
- `GET /api/alerts/low-stock`
- `GET /api/alerts/out-of-stock`
- `PUT /api/alerts/{id}/resolve`

Reports and dashboard:

- `GET /api/reports/inventory`
- `GET /api/reports/low-stock`
- `GET /api/reports/transactions`
- `GET /api/reports/export/csv`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/charts`
- `GET /api/dashboard/recent-transactions`
- `GET /api/dashboard/low-stock`

DevOps:

- `GET /api/health`
- `GET /api/devops/status`
- `GET /api/metrics`

## Monitoring

Prometheus scrapes the backend metrics endpoint:

```text
backend:8000/api/metrics
```

Grafana is provisioned with a Prometheus datasource and a StockFlow API monitoring dashboard showing request rate, error rate, latency, and endpoint traffic.

## CI

GitHub Actions runs on pushes and pull requests to `main`:

- Install backend dependencies
- Run backend tests
- Install frontend dependencies
- Build frontend
- Build backend Docker image tagged with the commit SHA
- Build frontend Docker image tagged with the commit SHA
- Validate Docker Compose configuration
