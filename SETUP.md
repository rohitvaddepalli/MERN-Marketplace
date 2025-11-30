# MERN Marketplace - Quick Setup Guide

## 🚀 Quick Start

Follow these steps to get your marketplace up and running:

### 1. Install Dependencies

```bash
# Install all dependencies (root + backend + frontend)
npm run install-all
```

Or install manually:
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Setup MongoDB

Make sure MongoDB is running on your local machine:
```bash
mongod
```

Or use MongoDB Atlas (cloud):
- Create a free account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get your connection string
- Update the connection string in `backend/.env`

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
copy .env.example .env
```

Edit the `.env` file with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=your_very_secure_random_string_here
JWT_EXPIRE=7d
NODE_ENV=development
```

**Important:** Change `JWT_SECRET` to a secure random string!

### 4. Start the Application

#### Option A: Run Both Together (Recommended)
From the root directory:
```bash
npm run dev
```

#### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

## 📝 Test the Application

### Create a Customer Account:
1. Go to http://localhost:3000/register
2. Fill in the form and select "Customer" role
3. Login and browse products

### Create a Seller Account:
1. Go to http://localhost:3000/register  
2. Fill in the form and select "Seller" role
3. Login and create your store
4. Add products to your store

### Test the Full Flow:
1. **As Seller:**
   - Create a store
   - Add some products with images (use placeholder URLs like `https://via.placeholder.com/300`)
   
2. **As Customer:**
   - Browse products
   - Add products to cart
   - Checkout and place an order
   - View order history

3. **As Seller:**
   - View orders
   - Update order status

## 🎨 Sample Product Image URLs

You can use these URLs for testing:
```
https://via.placeholder.com/400x400/FF6B35/FFFFFF?text=Product+1
https://via.placeholder.com/400x400/06D6A0/FFFFFF?text=Product+2
https://via.placeholder.com/400x400/667eea/FFFFFF?text=Product+3
```

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running (`mongod` command)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in `backend/.env` or kill the process using port 5000

### CORS Errors in Browser
**Solution:** Make sure backend is running on port 5000 and frontend on port 3000

### Module Not Found Errors
**Solution:** Run `npm install` in both backend and frontend directories

## 📱 Features Implemented

✅ **Authentication**
- User registration (Customer/Seller)
- Login/Logout
- Protected routes
- JWT authentication

✅ **Customer Features**
- Browse products and stores
- Product filtering and search
- Shopping cart
- Checkout process
- Order history
- Customer dashboard

✅ **Seller Features**
- Store creation and management
- Product CRUD operations
- Order management
- Order status updates
- Seller dashboard with analytics

✅ **UI/UX**
- Modern, responsive design
- Premium styling with gradients
- Smooth animations
- Mobile-friendly

## 🔄 Next Steps

To enhance your marketplace:

1. **Add Image Upload:**
   - Integrate Multer for image uploads
   - Use Cloudinary or AWS S3 for storage

2. **Payment Integration:**
   - Add Stripe or PayPal
   - Process real payments

3. **Email Notifications:**
   - Use Nodemailer
   - Send order confirmations

4. **Search Enhancement:**
   - Add Elasticsearch
   - Advanced filtering

5. **Real-time Features:**
   - Socket.io for notifications
- Chat between buyers and sellers

## 📚 Project Structure

```
marketplace/
├── backend/              # Node.js + Express backend
│   ├── controllers/     # Business logic
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth & error handling
│   └── server.js       # Entry point
├── frontend/            # React frontend  
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # State management
│   │   ├── pages/      # Page components
│   │   ├── services/   # API calls
│   │   └── App.js      # Main app
│   └── public/
└── README.md
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Stores
- `GET /api/stores` - Get all stores
- `POST /api/stores` - Create store (Seller)
- `PUT /api/stores/:id` - Update store (Seller)

### Products
- `GET /api/products` - Get products (with filters)
- `POST /api/products` - Create product (Seller)
- `PUT /api/products/:id` - Update product (Seller)
- `DELETE /api/products/:id` - Delete product (Seller)

### Orders
- `POST /api/orders` - Create order (Customer)
- `GET /api/orders/myorders` - Get customer orders
- `GET /api/orders/seller/orders` - Get seller orders
- `PUT /api/orders/:id/status` - Update status (Seller)

## 💡 Tips

- Use the Chrome DevTools for debugging
- Check Network tab for API call errors
- Monitor MongoDB with MongoDB Compass
- Use Postman to test API endpoints

## 🤝 Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal for backend errors
3. Verify MongoDB is running
4. Ensure all environment variables are set

Happy coding! 🚀
