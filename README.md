# Marketplace - Full MERN Stack Application

A comprehensive marketplace application built with MongoDB, Express, React, and Node.js.

## 🔥 Deploy to Firebase (All-in-One)

**NEW!** Deploy your entire application (frontend + backend + database) to Firebase for **FREE**!

### Quick Deploy (3 Commands)
```powershell
npm install -g firebase-tools
firebase login
.\deploy-firebase.ps1
```

**📚 Complete Guide**: See **[FIREBASE_DEPLOYMENT_GUIDE.md](FIREBASE_DEPLOYMENT_GUIDE.md)**

**What you get:**
- ✅ Frontend on Firebase Hosting
- ✅ Backend on Cloud Functions
- ✅ MongoDB Atlas (free tier)
- ✅ Auto SSL certificate
- ✅ Global CDN
- ✅ **$0/month cost**

**Quick Reference**: See **[FIREBASE_QUICK_REF.md](FIREBASE_QUICK_REF.md)**

---


## Features

### For Customers:
-Landing page with featured products and stores
- Product browsing with filters and search
- Product detail pages
- Shopping cart functionality
- Checkout and order placement
- Order history and tracking
- User dashboard

### For Sellers:
- Seller dashboard with analytics
- Store creation and management
- Product management (CRUD operations)
- Order management and fulfillment
- Inventory tracking

### Authentication:
- User registration with role selection (Customer/Seller)
- Secure login with JWT
- Password reset functionality
- Protected routes based on user roles

## Tech Stack

### Backend:
- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads

### Frontend:
- **React** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Context API** - State management

## Installation

### Prerequisites:
- Node.js (v14 or higher)
- MongoDB installed and running locally
- npm or yarn

### Setup Instructions:

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure backend environment:**
   - Copy `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   - Update the `.env` file with your configuration:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string for JWT signing
     - Email configuration (optional, for password reset)

4. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

### Option 1: Run Both Together (from root directory)
```bash
npm run dev
```

### Option 2: Run Separately

**Backend (from root or backend directory):**
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

**Frontend (from root or frontend directory):**
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3000`

## Default Access

After setting up, you can:

1. **Register as a Customer:**
   - Visit `http://localhost:3000/register`
   - Select "Customer" role
   - Browse products, add to cart, and place orders

2. **Register as a Seller:**
   - Visit `http://localhost:3000/register`
   - Select "Seller" role
   - Create a store and add products

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateprofile` - Update user profile

### Stores
- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get single store
- `POST /api/stores` - Create store (Seller only)
- `PUT /api/stores/:id` - Update store (Seller only)
- `DELETE /api/stores/:id` - Delete store (Seller only)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured` - Get featured products
- `POST /api/products` - Create product (Seller only)
- `PUT /api/products/:id` - Update product (Seller only)
- `DELETE /api/products/:id` - Delete product (Seller only)

### Orders
- `POST /api/orders` - Create order (Customer only)
- `GET /api/orders/myorders` - Get customer orders
- `GET /api/orders/seller/orders` - Get seller orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (Seller only)

## Project Structure

```
marketplace/
├── backend/
│   ├── controllers/      # Request handlers
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Express server setup
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Context providers
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json

```

## Features Implementation Status

✅ User Authentication (Login/Register)
✅ Role-based Access Control
✅ Store Management
✅ Product Management
✅ Shopping Cart
✅ Order Placement
✅ Order Management
✅ Seller Dashboard
✅ Customer Dashboard
✅ Responsive Design
✅ Modern UI/UX


## Deployment

This application is configured for **FREE** deployment to Firebase Hosting (frontend) and other free hosting services (backend).

### 🚀 Quick Deploy

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Create Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Create a new project
   - Update `.firebaserc` with your project ID

3. **Deploy Backend:**
   - Use Render.com, Railway.app, or Cyclic.sh (all free)
   - See `FIREBASE_DEPLOYMENT.md` for detailed instructions

4. **Deploy Frontend:**
   ```bash
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

### 📚 Deployment Documentation

- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Quick reference guide (5 steps)
- **[FIREBASE_DEPLOYMENT.md](FIREBASE_DEPLOYMENT.md)** - Complete deployment guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist
- **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** - Summary of all changes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture diagram

### 💰 Hosting Costs

Everything is **100% FREE**:
- ✅ Firebase Hosting (10 GB storage, 360 MB/day bandwidth)
- ✅ Render Backend (750 hours/month)
- ✅ MongoDB Atlas (512 MB storage)
- ✅ SSL Certificates (auto-provisioned)

**Total: $0/month**

## Future Enhancements

- Payment Integration (Stripe/PayPal)
- Real-time notifications
- Chat between customers and sellers
- Product reviews and ratings
- Advanced search with Elasticsearch
- Image upload to cloud storage (AWS S3/Cloudinary)
- Email notifications
- Admin panel
- Analytics and reporting

## Troubleshooting

### MongoDB Connection Error:
- Ensure MongoDB is running: `mongod`
- Check your connection string in `.env`

### Port Already in Use:
- Change the PORT in backend `.env` file
- Or kill the process using the port

### CORS Errors:
- Ensure backend CORS is configured properly
- Check if frontend is making requests to correct URL

## License

MIT

## Author

Developed for Marketplace Platform
