# Tax and Shipping Configuration Feature

## Overview
Implemented a dynamic tax and shipping fee configuration system that allows the admin to set these values instead of having them hardcoded.

## Backend Changes

### 1. Settings Model (`backend/models/Settings.js`)
- Created a new Settings model to store:
  - `taxRate`: Tax percentage (0-100)
  - `shippingFee`: Flat shipping fee
  - `updatedBy`: Reference to the admin who last updated
- Implemented static methods:
  - `getSettings()`: Get or create settings
  - `updateSettings()`: Update settings with validation

### 2. Admin Controller (`backend/controllers/admin.js`)
- Added two new endpoints:
  - `GET /api/admin/settings`: Get current settings (admin only)
  - `PUT /api/admin/settings`: Update settings (admin only)
- Includes validation:
  - Tax rate must be between 0-100
  - Shipping fee must be >= 0

### 3. Public Settings Endpoint (`backend/server.js`)
- Added `GET /api/settings`: Public endpoint for frontend to fetch tax and shipping rates
- Returns only taxRate and shippingFee (no sensitive data)

### 4. Admin Routes (`backend/routes/admin.js`)
- Added routes for settings management

## Frontend Changes

### 1. API Service (`frontend/src/services/api.js`)
- Added `adminAPI.getSettings()` and `adminAPI.updateSettings()`
- Added `settingsAPI.getSettings()` for public access

### 2. Cart Component (`frontend/src/pages/Cart/Cart.js`)
- Fetches settings on component mount
- Uses dynamic `taxRate` and `shippingFee` instead of hardcoded values
- Displays tax percentage in the summary
- Falls back to default values (8% tax, ₹10 shipping) if fetch fails

### 3. Checkout Component (`frontend/src/pages/Checkout/Checkout.js`)
- Fetches settings on component mount
- Uses dynamic values for order calculations
- Displays tax percentage in the summary
- Sends correct tax and shipping values to backend when creating order

### 4. Admin Settings Page (`frontend/src/pages/Admin/Settings.js`)
- New admin page for configuring tax and shipping
- Features:
  - Input fields for tax rate (%) and shipping fee (₹)
  - Validation (tax: 0-100, shipping: >= 0)
  - Live preview showing how settings affect a sample order
  - Save button with loading state

### 5. App Routes (`frontend/src/App.js`)
- Added route `/admin/settings` for the settings page

## How to Use

### For Admin:
1. Navigate to `/admin/settings`
2. Enter desired tax rate (percentage)
3. Enter desired shipping fee (in rupees)
4. Preview shows how it affects orders
5. Click "Save Settings"

### For Customers:
- Tax and shipping are automatically calculated based on admin settings
- Cart and checkout pages show the current rates
- Tax percentage is displayed (e.g., "Tax (8%)")

## Default Values
- Tax Rate: 8%
- Shipping Fee: ₹10

These defaults are used:
- When settings haven't been configured yet
- If there's an error fetching settings (fallback)

## Database
The settings are stored in a MongoDB collection called `settings`. Only one document exists in this collection (singleton pattern).
