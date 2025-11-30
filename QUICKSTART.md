# 🚀 QUICK START - Marketplace Application

## ⚡ Start in 3 Steps

### 1️⃣ Setup Environment (First Time Only)
```bash
cd backend
copy .env.example .env
```
Edit `backend/.env` and set:
```
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=change_this_to_a_secure_random_string
```

### 2️⃣ Start MongoDB
```bash
mongod
```

### 3️⃣ Run the App
```bash
# From project root directory:
npm run dev
```

**That's it!** 🎉

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 📱 Test Flow

### Create First Seller:
1. Go to http://localhost:3000/register
2. Name: "John Seller"
3. Email: "seller@example.com"
4. Password: "password123"
5. Role: **Seller**
6. Click "Create Account"

### Create a Store:
1. Click "Create Store" button
2. Store Name: "Tech Store"
3. Description: "Best electronics"
4. Category: "Electronics"
5. Click "Create Store"

### Add a Product:
1. Click "+ Add Product"
2. Product Name: "Laptop"
3. Description: "Gaming laptop"
4. Price: 999
5. Stock: 10
6. Category: "Electronics"
7. Image URL: `https://via.placeholder.com/400/FF6B35/FFFFFF?text=Laptop`
8. Click "Create Product"

### Create Customer & Buy:
1. Logout (user menu → Logout)
2. Register new account:
   - Name: "Jane Customer"
   - Email: "customer@example.com"
   - Password: "password123"
   - Role: **Customer**
3. Browse Products
4. Click on the laptop
5. Click "Add to Cart"
6. Go to Cart
7. Click "Proceed to Checkout"
8. Fill shipping info
9. Click "Place Order"

### Manage Order (as Seller):
1. Logout
2. Login as seller@example.com
3. Go to "Order Management"
4. Click "Mark Processing"
5. Then "Mark Shipped"
6. Then "Mark Delivered"

---

## 🎯 Quick Commands

```bash
# Install all dependencies
npm run install-all

# Run both backend and frontend together
npm run dev

# Run backend only
cd backend && npm run dev

# Run frontend only
cd frontend && npm start

# Check MongoDB is running
mongo --eval "db.version()"
```

---

## 🔑 Default Ports

- Frontend: `3000`
- Backend: `5000`  
- MongoDB: `27017`

---

## 📂 Important Files

- `backend/.env` - Environment configuration
- `backend/server.js` - Backend entry point
- `frontend/src/App.js` - Frontend entry point
- `README.md` - Full documentation
- `SETUP.md` - Detailed setup guide
- `PROJECT_SUMMARY.md` - Complete feature list

---

## ❗ Troubleshooting

### MongoDB won't connect?
```bash
# Make sure MongoDB is running
mongod

# Or check if it's already running
mongo
```

### Port 3000 already in use?
```bash
# Kill the process (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Port 5000 already in use?
Change in `backend/.env`:
```
PORT=5001
```

### Packages not found?
```bash
# Re-install dependencies
cd backend && npm install
cd ../frontend && npm install
```

---

## 💡 Pro Tips

1. **Use Chrome DevTools** for debugging (F12)
2. **Check terminal logs** for backend errors
3. **Use MongoDB Compass** to view database
4. **Test API with Postman** or Thunder Client
5. **Keep MongoDB running** in a separate terminal

---

## 🎨 Quick Links

- **Login Page:** http://localhost:3000/login
- **Register:** http://localhost:3000/register
- **Products:** http://localhost:3000/products
- **Stores:** http://localhost:3000/stores
- **API Health:** http://localhost:5000/api/health

---

## 📞 Need Help?

1. Check `SETUP.md` for detailed instructions
2. Check `PROJECT_SUMMARY.md` for all features
3. Review `README.md` for API documentation
4. Check browser console for errors (F12)
5. Check terminal for backend errors

---

**Happy Coding! 🚀**

Built with ❤️ using MERN Stack
