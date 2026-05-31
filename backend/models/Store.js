import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide store name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide store description'],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    logo: {
        type: String,
        default: 'https://via.placeholder.com/150',
    },
    banner: {
        type: String,
        default: 'https://via.placeholder.com/1200x300',
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    contact: {
        email: String,
        phone: String,
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
    isActive: {
        type: Boolean,
        default: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    businessHours: {
        type: String,
        default: '',
        trim: true,
        // e.g. "Mon–Fri: 9 AM – 6 PM, Sat: 10 AM – 4 PM"
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Add database indexes
storeSchema.index({ owner: 1 });

// PERF: Compound index for getStores — filters isActive:true and sorts by -createdAt.
// Without this MongoDB must do a full scan + in-memory sort for every listing request.
storeSchema.index({ isActive: 1, createdAt: -1 });

// PERF: Support sort by rating for featured stores queries.
storeSchema.index({ isActive: 1, rating: -1 });

export default mongoose.model('Store', storeSchema);
