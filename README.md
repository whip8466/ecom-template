# Eco Next JS MVP

Full-stack e-commerce MVP using:

- `frontend`: Next.js + Tailwind CSS + Zustand + React Hook Form
- `backend`: Node.js + Fastify + PostgreSQL + MikroORM + jose JWT auth

## Architecture

- Single `users` table for all user types (`ADMIN`, `MANAGER`, `CUSTOMER`)
- RBAC enforced by `role` field
- Backend modules:
  - `auth`
  - `catalog`
  - `addresses`
  - `orders`

## Backend Setup

1. Create env file:

```bash
cd backend
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run migrations:

```bash
npm run db:migrate
```

4. Seed sample data:

```bash
npm run db:seed
```

5. Start backend:

```bash
npm run dev
```

Backend runs on `http://localhost:4000`.

### Seeded users

- Admin: `admin@example.com` / `password123`
- Manager: `manager@example.com` / `password123`
- Customer: `customer@example.com` / `password123`

## Frontend Setup

1. Create env file:

```bash
cd frontend
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Key API Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Catalog: `/api/products`, `/api/products/:slug`, `/api/categories`
- Admin products: `/api/admin/products`
- Admin categories: `/api/admin/categories`
- User addresses: `/api/user/addresses`
- Orders: `/api/orders`, `/api/user/orders`, `/api/admin/orders`


