# Marketplace - Full MERN Stack Application

A comprehensive marketplace application built with MongoDB, Express, React, and Node.js.




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
- Google OAuth sign-in support
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
