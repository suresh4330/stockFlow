# StockFlow backend and DevOps implementation plan

## Current scope

This repository is built as a full-stack DevOps project. The backend and DevOps foundation are implemented, and the frontend has been added as a production-style React dashboard based on the StockFlow frontend design prompt.

## Implemented in this stage

- FastAPI backend with structured app modules, routers, services, schemas, and tests.
- PostgreSQL integration through SQLAlchemy, with SQLite fallback for tests and quick local runs.
- JWT-style bearer authentication with `admin`, `manager`, and `staff` roles.
- Product, category, supplier, stock transaction, alert, report, dashboard, health, DevOps status, and metrics endpoints.
- Demo seed data for users, categories, suppliers, products, stock transactions, and alerts.
- Dockerfile for the backend service.
- Docker Compose services for backend, PostgreSQL, Nginx, Prometheus, and Grafana.
- Nginx reverse proxy for `/api`, `/docs`, `/openapi.json`, and `/grafana`.
- Prometheus scraping of backend `/api/metrics`.
- Grafana datasource and API monitoring dashboard provisioning.
- GitHub Actions workflow for backend tests, backend Docker build, and Docker Compose validation.
- Makefile commands for common local operations.
- React + Vite + TypeScript frontend with Tailwind CSS, React Router, TanStack Query, Zustand, Recharts, Framer Motion, and Lucide icons.
- Frontend pages for login, dashboard, products, stock transactions, suppliers, reports, and DevOps status.
- Frontend Dockerfile and Docker Compose frontend service.
- Nginx route `/` proxies to the frontend container while `/api`, `/docs`, `/openapi.json`, and `/grafana` proxy to their services.
- GitHub Actions frontend dependency install, frontend build, and frontend Docker image build.

## Frontend scope

The frontend follows the quiet SaaS dashboard direction: flat surfaces, subtle borders, zinc backgrounds, emerald accent, dense information layout, skeleton loading states, dark mode, and no decorative gradients or shadows.

## Backend API summary

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Products: `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`
- Categories: `GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`
- Suppliers: `GET/POST /api/suppliers`, `GET/PUT/DELETE /api/suppliers/{id}`
- Stock: `POST /api/stock/in`, `POST /api/stock/out`, `GET /api/stock/transactions`, `GET /api/stock/transactions/{id}`
- Alerts: `GET /api/alerts/low-stock`, `GET /api/alerts/out-of-stock`, `PUT /api/alerts/{id}/resolve`
- Reports: `GET /api/reports/inventory`, `GET /api/reports/low-stock`, `GET /api/reports/transactions`, `GET /api/reports/export/csv`
- Dashboard: `GET /api/dashboard/summary`, `GET /api/dashboard/charts`, `GET /api/dashboard/recent-transactions`, `GET /api/dashboard/low-stock`
- DevOps: `GET /api/health`, `GET /api/devops/status`, `GET /api/metrics`

## Validation

- Run backend tests with `make test`.
- Start the local stack with `make up`.
- Check service health at `http://localhost:8080/api/health`.
- Open API docs at `http://localhost:8080/docs`.
- Open Prometheus at `http://localhost:9090`.
- Open Grafana at `http://localhost:3000` or `http://localhost:8080/grafana`.
