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
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
    }
    next();
});

// Add database indexes
orderSchema.index({ customer: 1 });
orderSchema.index({ 'items.store': 1 });

export default mongoose.model('Order', orderSchema);
