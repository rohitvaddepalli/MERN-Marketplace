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

// Existing single-field indexes (kept for targeted seller/category/store lookups)
productSchema.index({ seller: 1, stock: 1 }); // Replaces or augments seller:1 for low stock queries
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ store: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

// PERF: Compound indexes for common product listing filter + sort combinations.
// getProducts filters on { isActive, category, price } and sorts by -createdAt or -rating.
productSchema.index({ isActive: 1, category: 1, price: 1 });
productSchema.index({ isActive: 1, rating: -1 });

export default mongoose.model('Product', productSchema);
