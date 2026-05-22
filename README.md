# StockFlow

![status](https://img.shields.io/badge/status-active-brightgreen)
![backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20PostgreSQL%20%7C%20SQLAlchemy-blue)
![frontend](https://img.shields.io/badge/frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-61dafb)
![auth](https://img.shields.io/badge/auth-JWT-orange)
![devops](https://img.shields.io/badge/devops-Docker%20%7C%20Nginx%20%7C%20Prometheus%20%7C%20Grafana-9cf)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

**StockFlow** is a full-stack DevOps-focused inventory management system that enables businesses to manage products, track stock levels, handle purchase and sales orders, and monitor system health — all through a clean, responsive dashboard powered by React and FastAPI.

---

## ✨ Features

### 📦 Inventory Management
- Add, update, and delete **products** with categories and suppliers
- Track **stock levels** in real time with low-stock alerts
- Record **stock-in / stock-out** transactions with history
- View out-of-stock and low-stock **alert reports**

### 🛒 Purchase & Sales Orders
- Create and manage **Purchase Orders** from suppliers
- Create and manage **Sales Orders** for customers
- Track order status and transaction history

### 📊 Dashboard & Reports
- Real-time **summary dashboard** with charts (Recharts)
- Inventory reports, low-stock reports, and transaction reports
- Export reports as **CSV**

### 🔐 Authentication & Roles
- JWT-based authentication with **role-based access control**
- Three default roles: **Admin**, **Manager**, and **Staff**

### 🚀 DevOps & Monitoring
- Fully containerized with **Docker Compose**
- **Nginx** reverse proxy for routing
- **Prometheus** metrics scraping
- **Grafana** dashboards for request rate, error rate, and latency
- **GitHub Actions** CI pipeline for testing and building

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Recharts |
| **Backend** | FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| **Database** | PostgreSQL |
| **Auth** | JWT (JSON Web Tokens) |
| **Testing** | Pytest |
| **DevOps** | Docker, Docker Compose, Nginx, Prometheus, Grafana |
| **CI/CD** | GitHub Actions |

---

## ⚡ Local Setup

Copy the environment file:

```bash
cp .env.example .env
```

Start the full stack:

```bash
make up
```

Or using Docker Compose directly:

```bash
docker compose up --build -d
```

---

## 🌐 Useful URLs

| Service | URL |
|---------|-----|
| **App (via Nginx)** | http://localhost:8081 |
| **API Docs (Swagger)** | http://localhost:8081/docs |
| **Backend Direct** | http://localhost:8000 |
| **Prometheus** | http://localhost:9090 |
| **Grafana** | http://localhost:3000 |
| **Grafana (via Nginx)** | http://localhost:8081/grafana |

---

## 👤 Default Demo Users

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@stockflow.local` | `admin12345` |
| **Manager** | `manager@stockflow.local` | `manager12345` |
| **Staff** | `staff@stockflow.local` | `staff12345` |

---

## 🔧 Commands

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

> The Vite dev server proxies `/api` requests to the backend at `http://localhost:8000`.

---

## 🔌 Backend API

### Authentication
| Method | Endpoint |
|--------|----------|
| `POST` | `/api/auth/register` |
| `POST` | `/api/auth/login` |
| `GET`  | `/api/auth/me` |

### Inventory
| Method | Endpoint |
|--------|----------|
| `GET / POST` | `/api/products` |
| `GET / PUT / DELETE` | `/api/products/{id}` |
| `GET / POST` | `/api/categories` |
| `PUT / DELETE` | `/api/categories/{id}` |
| `GET / POST` | `/api/suppliers` |
| `GET / PUT / DELETE` | `/api/suppliers/{id}` |

### Stock & Alerts
| Method | Endpoint |
|--------|----------|
| `POST` | `/api/stock/in` |
| `POST` | `/api/stock/out` |
| `GET`  | `/api/stock/transactions` |
| `GET`  | `/api/alerts/low-stock` |
| `GET`  | `/api/alerts/out-of-stock` |
| `PUT`  | `/api/alerts/{id}/resolve` |

### Orders
| Method | Endpoint |
|--------|----------|
| `GET / POST` | `/api/purchases` |
| `GET / POST` | `/api/sales` |

### Reports & Dashboard
| Method | Endpoint |
|--------|----------|
| `GET` | `/api/reports/inventory` |
| `GET` | `/api/reports/low-stock` |
| `GET` | `/api/reports/transactions` |
| `GET` | `/api/reports/export/csv` |
| `GET` | `/api/dashboard/summary` |
| `GET` | `/api/dashboard/charts` |

### DevOps & Health
| Method | Endpoint |
|--------|----------|
| `GET` | `/api/health` |
| `GET` | `/api/devops/status` |
| `GET` | `/api/metrics` |

---

## 📈 Monitoring

Prometheus scrapes the backend metrics endpoint:

```
backend:8000/api/metrics
```

Grafana is provisioned with a Prometheus datasource and a StockFlow API monitoring dashboard showing:
- Request rate
- Error rate
- Request latency
- Endpoint traffic breakdown

---

## ⚙️ CI/CD Pipeline

GitHub Actions runs on every push and pull request to `main`:

- ✅ Install backend dependencies
- ✅ Run backend tests (Pytest)
- ✅ Install frontend dependencies
- ✅ Build frontend (Vite)
- ✅ Build backend Docker image (tagged with commit SHA)
- ✅ Build frontend Docker image (tagged with commit SHA)
- ✅ Validate Docker Compose configuration

---

## 🚀 Deployment

| Service | Platform |
|---------|----------|
| **Frontend** | [Vercel](https://vercel.com) |
| **Backend** | [Render](https://render.com) |
| **Database** | Render PostgreSQL |

---

## 📄 License

This project is licensed under the **MIT License**.
