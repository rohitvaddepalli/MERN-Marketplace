# Setup Guide

## Prerequisites

- **Node.js** 18 or later
- **MongoDB** 6 or later (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git**

## Clone & Install

```bash
git clone <repo-url>
cd Marketplace
npm install
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=<random-string>
SESSION_SECRET=<random-string>
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

STRIPE_SECRET_KEY=sk_test_<your-stripe-secret>
STRIPE_PUBLISHABLE_KEY=pk_test_<your-stripe-publishable>

NODE_ENV=development
PORT=5000
```

### Variable Reference

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `SESSION_SECRET` | Secret key for Express sessions (Passport) |
| `NEXTAUTH_SECRET` | Secret key for NextAuth.js sessions |
| `NEXTAUTH_URL` | Frontend base URL |
| `CLOUDINARY_*` | Cloudinary credentials for image uploads |
| `STRIPE_*` | Stripe API keys (test mode) |
| `NODE_ENV` | Environment mode |
| `PORT` | Backend server port |

## Database Setup

### Migrate

```bash
npm run db:migrate
```

### Seed (optional)

Populates the database with sample data:

```bash
npm run db:seed
```

## Development Mode

Run both frontend and backend concurrently:

```bash
npm run dev
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`

## Production Build

```bash
npm run build
npm start
```

## Test Flow

Follow these steps to verify the platform end-to-end.

### 1. Register a Seller

1. Go to `http://localhost:3000/register`
2. **Email:** `seller@example.com` / **Password:** `password123`
3. Select **Seller** as the role

### 2. Create a Store

1. Log in as seller and go to **My Store**
2. **Store Name:** `Tech Store`
3. Submit

### 3. Add a Product

1. Go to **Products** → **Add Product**
2. **Name:** `Laptop`
3. **Price:** `999`
4. **Image URL:** `https://via.placeholder.com/150`
5. **Stock Quantity:** `10`
6. Submit

### 4. Register a Customer

1. Open an incognito window and go to `http://localhost:3000/register`
2. **Email:** `customer@example.com` / **Password:** `password123`
3. Select **Customer** as the role

### 5. Purchase the Product

1. Browse to the Laptop and add it to the cart
2. Go to checkout
3. Use the Stripe test card:

   **Card number:** `4242 4242 4242 4242`  
   **Expiry:** any future date  
   **CVC:** any 3 digits

4. Complete the purchase

### 6. Manage the Order

- **Customer** — view order status in **Order History**
- **Seller** — view and update order status in **Store Dashboard** → **Orders**
- **Admin** — view and manage all orders in the **Admin Dashboard**

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Database connection fails | Ensure MongoDB is running and `MONGODB_URI` is correct |
| Port already in use | Change `PORT` in `.env` or kill the process on that port |
| Image uploads fail | Verify Cloudinary credentials and that the cloud name exists |
| Stripe payment fails | Use test card `4242 4242 4242 4242` — live cards won't work in test mode |

## Deployment

Recommended stack:

- **Hosting:** [Render.com](https://render.com) — Node web service
  - Build command: `npm run build`
  - Start command: `npm start`
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas)
  - Whitelist `0.0.0.0/0` for public access
- **Media:** [Cloudinary](https://cloudinary.com)
- **Custom Domain:** Configure via Render dashboard
