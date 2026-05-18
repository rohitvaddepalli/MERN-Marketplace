import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide product name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide product description'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide product price'],
        min: 0,
    },
    compareAtPrice: {
        type: Number,
        min: 0,
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
    },
    subcategory: {
        type: String,
    },
    brand: {
        type: String,
        trim: true,
    },
    images: [
        {
            type: String,
        },
    ],
    stock: {
        type: Number,
        required: [true, 'Please provide stock quantity'],
        min: 0,
        default: 0,
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    tags: [
        {
            type: String,
        },
    ],
    specifications: {
        type: Map,
        of: String,
    },
    variants: [
        {
            name: String,
            options: [String],
            price: Number,
            stock: Number,
            sku: String,
        },
    ],
    lowStockThreshold: {
        type: Number,
        default: 10,
    },
    bulkDiscounts: [
        {
            quantity: { type: Number, required: true },
            discountPercentage: { type: Number, required: true },
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt timestamp before saving
productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Add database indexes
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ store: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

export default mongoose.model('Product', productSchema);
