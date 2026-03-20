# Multi-User Blog Platform

A full-stack blog platform built for **DevOps practice**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (HTTP-only cookies) |
| Images | Multer (local disk) |
| DevOps | Docker + Docker Compose |

## Features

- ✅ User registration & login (JWT)
- ✅ Create / edit / delete blog posts (Markdown)
- ✅ Cover image upload
- ✅ Comments system
- ✅ Admin dashboard (user management, post moderation, stats)
- ✅ Dockerized for DevOps workflows

## Quick Start (Docker)

```bash
# 1. Clone and navigate
cd multi-user-blog-app

# 2. (Optional) Set a custom JWT secret
export JWT_SECRET=my_secret_here

# 3. Build and start all services
docker compose up --build

# 4. Open in browser
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000/api/health
```

The `migrate` service will automatically run database migrations and seed demo data on first startup.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@blog.com | admin123 |
| User | demo@blog.com | user123 |

## Local Development (without Docker)

### Backend
```bash
cd backend
cp .env.example .env   # Edit DATABASE_URL to point to your local Postgres
npm install
npm run migrate        # Run Prisma migrations
npm run seed           # Seed demo data
npm run dev            # Start dev server on :5000
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev            # Start Next.js on :3000
```

## Project Structure

```
multi-user-blog-app/
├── backend/
│   ├── src/
│   │   ├── routes/        # auth, posts, comments, upload, admin
│   │   ├── middleware/     # authGuard, adminGuard, errorHandler
│   │   └── lib/           # Prisma client
│   └── Dockerfile
├── frontend/
│   ├── src/app/           # Next.js App Router pages
│   ├── src/components/
│   └── Dockerfile
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/posts` | List published posts |
| POST | `/api/posts` | Create post (auth) |
| PUT | `/api/posts/:id` | Update post (author/admin) |
| DELETE | `/api/posts/:id` | Delete post (author/admin) |
| POST | `/api/comments` | Add comment (auth) |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/upload` | Upload image (auth) |
| GET | `/api/admin/stats` | Dashboard stats (admin) |
| GET | `/api/admin/users` | All users (admin) |
| GET | `/api/admin/posts` | All posts (admin) |
