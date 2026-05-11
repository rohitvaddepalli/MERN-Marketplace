import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    // Verified purchase badge — set server-side by checking order history
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    // Rich media: up to 5 image/video URLs (stored via Cloudinary)
    media: {
        type: [{
            url: { type: String, required: true },
            type: { type: String, enum: ['image', 'video'], required: true },
            publicId: { type: String } // Cloudinary public_id for deletion
        }],
        validate: {
            validator: (arr) => arr.length <= 5,
            message: 'A review may include at most 5 media files'
        },
        default: []
    },
    // Helpful votes
    helpfulVotes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent user from submitting more than one review per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRating = async function (productId) {
    const stats = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: '$product',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            rating: stats[0].avgRating,
            reviewCount: stats[0].nRating
        });
    } else {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            rating: 0,
            reviewCount: 0
        });
    }
};

reviewSchema.post('save', function () {
    this.constructor.calcAverageRating(this.product);
});

reviewSchema.pre('remove', function (next) {
    this.constructor.calcAverageRating(this.product);
    next();
});

export default mongoose.model('Review', reviewSchema);
