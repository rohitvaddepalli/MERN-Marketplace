import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    guestInfo: {
        name: String,
        email: String,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            name: String,
            price: Number,
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            image: String,
            store: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Store',
            },
            seller: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        },
    ],
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['card', 'paypal', 'cod'],
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    itemsPrice: {
        type: Number,
        required: true,
    },
    shippingPrice: {
        type: Number,
        default: 0,
    },
    taxPrice: {
        type: Number,
        default: 0,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    deliveredAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate order number before saving
import crypto from 'crypto';

orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.orderNumber = `ORD-${Date.now()}-${randomSuffix}`;
    }
    next();
});

// Add database indexes
orderSchema.index({ customer: 1 });
orderSchema.index({ 'items.store': 1 });
// Supports the seller-orders aggregation pipeline ($unwind + $lookup on product seller)
orderSchema.index({ 'items.product': 1 });
// Supports admin order listing with status filter + sort
orderSchema.index({ status: 1, createdAt: -1 });
// Supports revenue aggregation $match on paymentStatus
orderSchema.index({ paymentStatus: 1 });
// PERF: Compound index for seller aggregation pipeline — covers the common
// pattern of matching on items.product and then sorting/grouping by createdAt.
orderSchema.index({ 'items.product': 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
