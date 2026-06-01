# 📦 Inventory & Order Management System

A full-stack Inventory & Order Management System built with **FastAPI**, **React**, and **PostgreSQL**, fully containerized with **Docker Compose**.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## 👩‍🏫 Invigilator Instructions

This project is fully containerized and hosted on Docker Hub. Follow these instructions to pull and run the backend locally if you wish to review the Docker setup.

### 1. Run the Application via Docker Compose (Recommended)
If you have Docker Compose installed, you can simply clone this repository and run the entire stack (Frontend, Backend, and Database):
```bash
docker compose up --build
```
This will:
- Start PostgreSQL on port `5432`
- Start the FastAPI backend on port `8000` (accessible at `http://localhost:8000/docs`)
- Start the React frontend on port `3000` (accessible at `http://localhost:3000`)
- Automatically seed the database with 20 realistic tech products on startup.

### 2. Pulling the Docker Image Manually
If you want to pull the backend image directly from Docker Hub:
```bash
docker pull sajalsr2003/inventory-backend:latest
```

You can run this container locally. Note that it requires a `DATABASE_URL` environment variable pointing to a PostgreSQL instance (with the `postgresql+asyncpg://` driver). 

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

## 🚀 Live Public URLs

- **Frontend Application:** https://inventory-manager-delta-eight.vercel.app
- **Backend API (Swagger Docs):** https://inventory-manager-r9av.onrender.com/docs

*Note: The frontend is securely connected to the live Render backend, which automatically seeds its own remote database. CORS is globally permitted (`["*"]`) so you can interact with the API from any client.*

---

## 🛡️ Inventory Validation Logic

When an order is placed, the system:
1. **Acquires a row-level lock** on the product (`SELECT ... FOR UPDATE`)
2. **Checks available stock** against the requested quantity
3. **Rejects the order** with a `400` error if stock is insufficient
4. **Atomically reduces stock** and creates the order in a single transaction
5. **Database CHECK constraint** (`stock >= 0`) acts as a final safety net
