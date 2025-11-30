# Admin Dashboard Guide

## Overview
The Admin Dashboard allows you to monitor and manage the entire marketplace. You can manage users, stores, products, and orders from a centralized interface.

## Accessing the Dashboard
1. Log in with an admin account.
   - **Default Admin Credentials:**
     - Email: `admin@example.com`
     - Password: `adminpassword123`
2. Click on your profile in the navbar and select **Dashboard**.

## Features

### 1. Dashboard Overview
- **Statistics:** View total users, stores, products, orders, and revenue.
- **Recent Activity:** See the latest registered users and recent orders.
- **Quick Actions:** Fast access to management pages.

### 2. User Management (`/admin/users`)
- **View Users:** List all users (Customers, Sellers, Admins).
- **Search & Filter:** Search by name/email or filter by role.
- **Delete User:** Remove users from the platform (Admins cannot be deleted).

### 3. Store Management (`/admin/stores`)
- **View Stores:** List all stores with their owners and ratings.
- **Status Control:** Activate or deactivate stores.
- **Delete Store:** Permanently remove a store and all its products.

### 4. Product Management (`/admin/products`)
- **View Products:** List all products with stock and price details.
- **Search & Filter:** Find products by name or category.
- **Delete Product:** Remove inappropriate or illegal products.

### 5. Order Management (`/admin/orders`)
- **View Orders:** Track all transactions.
- **Filter:** Filter by order status (Pending, Shipped, etc.) or payment status.
- **Delete Order:** Remove order records if necessary.

## Technical Details
- **Backend Routes:** `/api/admin/*` (Protected by `admin` role middleware).
- **Frontend Pages:** Located in `src/pages/Admin/`.
- **Security:** All admin routes are protected by JWT authentication and role verification.
