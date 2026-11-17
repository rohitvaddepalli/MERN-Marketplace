# Marketplace

A full-stack e-commerce marketplace platform connecting buyers, sellers, and administrators. Built with a React single-page frontend and a Node.js/Express backend powered by serverless PostgreSQL (Neon), Clerk authentication, Cloudflare R2 storage, and Resend email.

---

## Features

### 🛍️ Buyers

- **Product Discovery**: Fast catalog search with full-text search, multi-attribute filtering (category, brand, price, color, size), and keyset cursor pagination.
- **Cart & Checkout**: Cart management with server-side pricing and stock verification, tax and shipping calculation, and bulk discount support.
- **Order Tracking**: Real-time order status updates over Socket.io and confirmation emails.
- **Social & Support**: Direct buyer-seller chat messaging and product reviews with verified purchase flags.

### 🏪 Sellers

- **Store Management**: Custom store profile, branding (logo and banner), and verified seller badges.
- **Inventory & Catalog**: Product lifecycle management, low-stock threshold alerts, and batch import/export via CSV.
- **Analytics Dashboard**: Revenue, total distinct order counts, sales velocity, customer breakdown, and inventory forecasting.
- **Order Processing**: Live order notifications and status transitions (processing, shipped, delivered).

### ⚙️ Administrators

- **Platform Analytics**: Aggregate counts, active stores, order volumes, and platform commission metrics.
- **User Management**: Search, filter by role (customer, seller, admin), and account administration.
- **Store & Product Oversight**: Store verification, activation/suspension, and catalog moderation.
- **Platform Settings**: Configurable tax rates, shipping fees, and per-order transaction fees.

---

## Tech Stack

| Domain                    | Technology                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Frontend**              | React 19, React Router v7, Context API, CSS Variables, Cloudflare Pages                                      |
| **Backend**               | Express 4, Node.js 18+ (ES Modules), Winston logger                                                          |
| **Database**              | PostgreSQL on [Neon](https://neon.tech) via `pg` connection pool with SSL enforcement                        |
| **Authentication**        | [Clerk](https://clerk.com) — Session tokens, email verification, social SSO, MFA                             |
| **Media Storage**         | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via AWS S3 SDK (presigned direct uploads) |
| **Real-time**             | Socket.io 4 with optional `@socket.io/redis-adapter` for horizontal clustering                               |
| **Transactional Email**   | [Resend](https://resend.com) with circuit breaker protection (`opossum`)                                     |
| **Validation & Security** | Zod, Helmet, Rate Limiting, Sanitization, Parameterized SQL queries                                          |
| **Observability**         | Sentry (error tracking and profiling)                                                                        |
| **Testing & Linting**     | Vitest, React Testing Library, ESLint 9, Prettier                                                            |

---

## Project Structure

```text
MERN-Marketplace/
├── backend/
│   ├── config/             # Cloudflare R2 and unified configuration
│   ├── controllers/        # Request handlers (BaseController, products, orders, etc.)
│   ├── db/                 # PostgreSQL pool, transactions, mappers, and seeders
│   ├── middleware/         # Auth (Clerk), error handling, caching, request logging
│   ├── migrations/         # Raw SQL schema migrations (0001_init.sql)
│   ├── routes/             # Express API route definitions
│   ├── scripts/            # Migration and database seeding CLI scripts
│   ├── services/           # Reusable business logic (orders, products, analytics)
│   ├── utils/              # Circuit breaker, caching, email, logger, sanitization
│   ├── validators/         # Zod schemas for payload validation
│   └── __tests__/          # Vitest unit and integration test suites
├── frontend/
│   ├── public/             # Static assets, Cloudflare Pages _headers and _redirects
│   └── src/
│       ├── components/     # Reusable UI components (Navbar, ChatBox, Common, Admin)
│       ├── context/        # React contexts (AuthContext, CartContext, SocketContext)
│       ├── hooks/          # Custom React hooks (useDocumentTitle)
│       ├── pages/          # Route views (Home, Products, Seller, Admin, Customer, Auth)
│       └── services/       # Axios API client configured with Clerk token provider
├── package.json            # Workspace root scripts
└── render.yaml             # Render deployment blueprint
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x and **npm** >= 9.x
- A **PostgreSQL** database (e.g., [Neon Serverless Postgres](https://neon.tech))
- A **Clerk** application account ([dashboard.clerk.com](https://dashboard.clerk.com))
- _(Optional)_ Cloudflare R2 bucket for uploads and Resend API key for emails

### 1. Installation

Install dependencies across root, backend, and frontend:

```bash
npm run install-all
```

### 2. Environment Configuration

#### Backend (`backend/.env`)

Create `backend/.env` with your credentials (see `backend/.env.example` for reference):

```env
NODE_ENV=development
PORT=5000

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/marketplace?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/marketplace?sslmode=require

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Frontend URL (for CORS and socket connections)
FRONTEND_URL=http://localhost:3000

# Optional: Cloudflare R2 for Image Uploads
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=marketplace-uploads
R2_PUBLIC_URL=https://pub-<hash>.r2.dev

# Optional: Resend for Transactional Email
RESEND_API_KEY=re_...
RESEND_FROM=Marketplace <onboarding@resend.dev>

# Optional: Redis (Caching & Socket clustering)
# REDIS_URL=redis://localhost:6379
```

#### Frontend (`frontend/.env.local`)

Create `frontend/.env.local` (see `frontend/.env.example` for reference):

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Database Migration & Seed

Run migrations to create database tables and seed initial demo data:

```bash
# Run SQL migrations
npm run migrate

# Seed admin, seller, store, and demo products
npm run seed
```

### 4. Run Development Servers

Start both backend and frontend concurrently:

```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)
- API Documentation: [http://localhost:5000/api/docs](http://localhost:5000/api/docs) _(development mode)_

---

## Available Scripts

| Command                 | Action                                                    |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Run backend and frontend concurrently in development mode |
| `npm run server`        | Start backend server with `nodemon` auto-reload           |
| `npm run client`        | Start React frontend development server                   |
| `npm run build`         | Build frontend production bundle and prepare backend      |
| `npm test`              | Run unit tests across backend and frontend                |
| `npm run test:backend`  | Run backend Vitest unit tests                             |
| `npm run test:frontend` | Run frontend React Testing Library tests                  |
| `npm run lint`          | Run ESLint across backend and frontend                    |
| `npm run lint:fix`      | Automatically fix ESLint warnings and errors              |
| `npm run migrate`       | Apply pending SQL migrations to PostgreSQL                |
| `npm run seed`          | Seed database with initial demo data                      |
| `npm run deploy:pages`  | Build and deploy frontend to Cloudflare Pages             |

---

## Production & Security Hardening

- **Parameterized Queries**: All database queries strictly use parameterized SQL inputs (`$1`, `$2`) to eliminate SQL injection risks.
- **Role-Based Access Control**: Route-level middleware (`protect`, `authorize('admin')`, `authorize('seller')`) validates identity and roles.
- **Session Security**: Authentication is managed by Clerk via short-lived bearer session tokens with server-side token verification.
- **Direct-to-R2 Uploads**: Large media files upload directly from client browsers to Cloudflare R2 using short-lived presigned PUT URLs, protecting the backend from memory exhaustion.
- **Circuit Breakers**: External integrations (e.g. Resend) are wrapped with circuit breakers (`opossum`) to gracefully handle upstream downtime without cascading failures.
- **Rate Limiting**: Tiered rate limiters protect public endpoints, upload signature endpoints, and API routes against abuse and DoS attacks.

---

## License

Licensed under the [MIT License](./package.json).
