# 📦 Inventory & Order Management System

A full-stack Inventory & Order Management System built with **FastAPI**, **React**, and **PostgreSQL**, fully containerized with **Docker Compose**.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## ✨ Features

- **Product Management** — Create, read, update, and delete products with SKU, name, price, and stock tracking
- **Customer Management** — Full CRUD with unique email enforcement
- **Order Processing** — Place orders with real-time inventory validation
- **Transactional Integrity** — Row-level locking (`SELECT ... FOR UPDATE`) prevents race conditions and overselling
- **Stock Constraints** — Database-level `CHECK` constraints ensure stock never drops below zero
- **Premium UI** — Dark-themed glassmorphism design with micro-animations
- **Fully Containerized** — One-command startup with Docker Compose

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend   │────▶│  PostgreSQL  │
│  React/Vite  │     │   FastAPI   │     │     16       │
│  Nginx :80   │     │  Uvicorn    │     │   :5432      │
│  Port 3000   │     │  Port 8000  │     │              │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) installed

### 1. Clone & Configure

```bash
git clone <your-repo-url>
cd Antigravity

# Copy the example environment file
cp .env.example .env
# Edit .env if you want to change default credentials
```

### 2. Start All Services

```bash
docker compose up --build
```

This will:
- Start a PostgreSQL 16 database
- Build and start the FastAPI backend on port `8000`
- Build and serve the React frontend on port `3000`

### 3. Access the Application

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000         |
| Backend API| http://localhost:8000        |
| API Docs   | http://localhost:8000/docs   |

---

## 🔌 API Endpoints

### Customers

| Method   | Endpoint              | Description          |
|----------|-----------------------|----------------------|
| `GET`    | `/api/customers`      | List all customers   |
| `POST`   | `/api/customers`      | Create a customer    |
| `GET`    | `/api/customers/{id}` | Get customer by ID   |
| `PUT`    | `/api/customers/{id}` | Update customer      |
| `DELETE` | `/api/customers/{id}` | Delete customer      |

### Products

| Method   | Endpoint              | Description          |
|----------|-----------------------|----------------------|
| `GET`    | `/api/products`       | List all products    |
| `POST`   | `/api/products`       | Create a product     |
| `GET`    | `/api/products/{id}`  | Get product by ID    |
| `PUT`    | `/api/products/{id}`  | Update product       |
| `DELETE` | `/api/products/{id}` | Delete product       |

### Orders

| Method   | Endpoint              | Description                              |
|----------|-----------------------|------------------------------------------|
| `GET`    | `/api/orders`         | List all orders                          |
| `POST`   | `/api/orders`         | Create order (validates stock atomically)|

### Health

| Method   | Endpoint      | Description     |
|----------|---------------|-----------------|
| `GET`    | `/api/health` | Health check    |

---

## 🛡️ Inventory Validation

When an order is placed, the system:

1. **Acquires a row-level lock** on the product (`SELECT ... FOR UPDATE`)
2. **Checks available stock** against the requested quantity
3. **Rejects the order** with a `400` error if stock is insufficient
4. **Atomically reduces stock** and creates the order in a single transaction
5. **Database CHECK constraint** (`stock >= 0`) acts as a final safety net

This ensures **no overselling**, even under concurrent requests.

---

## 🗂️ Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Environment configuration
│   │   ├── database.py      # Async SQLAlchemy setup
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── routers/
│   │       ├── customers.py # Customer CRUD
│   │       ├── products.py  # Product CRUD
│   │       └── orders.py    # Order processing
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application
│   │   ├── api.js           # API client
│   │   └── components/      # React components
│   ├── nginx.conf           # Production Nginx config
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚙️ Environment Variables

| Variable           | Default              | Description                       |
|--------------------|----------------------|-----------------------------------|
| `POSTGRES_USER`    | `postgres`           | PostgreSQL username               |
| `POSTGRES_PASSWORD`| `postgres`           | PostgreSQL password               |
| `POSTGRES_DB`      | `inventory_db`       | PostgreSQL database name          |
| `DB_PORT`          | `5432`               | Exposed PostgreSQL port           |
| `BACKEND_PORT`     | `8000`               | Exposed backend API port          |
| `FRONTEND_PORT`    | `3000`               | Exposed frontend port             |
| `CORS_ORIGINS`     | `*`                  | Allowed CORS origins              |

---

## 🐳 Docker Hub

### Build & Push Backend Image

```bash
# Build the backend image
docker build -t your-dockerhub-username/inventory-backend:latest ./backend

# Push to Docker Hub
docker login
docker push your-dockerhub-username/inventory-backend:latest
```

---

## ☁️ Deployment Guide

### Backend + Database → Render

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create a **PostgreSQL** database (free tier)
4. Create a **Web Service** from your GitHub repo
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add env var: `DATABASE_URL` = your Render PostgreSQL connection string (change `postgresql://` to `postgresql+asyncpg://`)

### Frontend → Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repo
3. Set root directory: `frontend`
4. Framework preset: Vite
5. Add env var: `VITE_API_URL` = your Render backend URL (e.g., `https://your-backend.onrender.com/api`)
6. Deploy

---

## 📝 License

MIT
