# Marketplace

A full-stack MERN marketplace platform connecting buyers, sellers, and administrators. Buyers can browse products, manage carts, and track orders. Sellers get a dedicated dashboard to manage listings, inventory, variants, and sales analytics. Administrators have full-platform oversight for users, stores, products, and orders.

## Features

### Buyer
- Browse, search, and filter products
- Cart management with checkout flow
- Order tracking and history
- Product reviews and ratings

### Seller
- Store dashboard with performance metrics
- Product listing and inventory management
- Low stock alerts
- CSV import/export for products
- Product variants with per-variant pricing, stock, and SKU
- Sales analytics — revenue, orders, average order value, trends
- Marketing tools — discount codes and promotions

### Admin
- User management — list, search, filter by role, delete
- Store management — list, activate, deactivate, delete with cascade
- Product management — list, search, filter, delete
- Order management — list, filter by status/payment, delete
- Platform-wide statistics and quick actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, CSS Variables |
| Backend | Express.js, Node.js 18 |
| Database | MongoDB via Mongoose |
| Auth | JWT, Google OAuth, Passport, Express-Session |
| Payments | Stripe |
| Media | Cloudinary |
| Real-time | Socket.io |
| Caching | Redis (in-memory fallback) |
| Monitoring | Sentry |

## API

All endpoints are available under two prefixes:

| Prefix | Usage |
|--------|-------|
| `/api/v1/` | Canonical — use this for all new integrations |
| `/api/` | Legacy alias — kept for backward compatibility |

Key route groups: `auth`, `products`, `stores`, `orders`, `admin`, `analytics`, `users`, `upload`, `chat`.

Interactive docs available at `/api/docs` (Swagger UI, dev only).

## Quick Start

See [SETUP.md](./SETUP.md) for complete installation, configuration, and test flow instructions.

## Admin Access

See [ADMIN.md](./ADMIN.md) for administrative features, default credentials, and API routes.

---

[![Deploy](https://img.shields.io/badge/Deploy-Render-blue)](https://render.com)

Licensed under the MIT License.
