import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
    {
        taxRate: {
            type: Number,
            default: 8,
            min: 0,
            max: 100,
        },
        shippingFee: {
            type: Number,
            default: 10,
            min: 0,
        },
        fixedFeePerOrder: {
            type: Number,
            default: 2,
            min: 0,
            description: 'Fixed platform fee charged per order',
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one settings document exists.
// Both methods use atomic findOneAndUpdate + upsert to eliminate the
// "check-then-act" race condition where two concurrent calls could each
// see findOne() return null and then both attempt to create a document.
settingsSchema.statics.getSettings = async function () {
    const settings = await this.findOneAndUpdate(
        {}, // match the single settings doc (any)
        { $setOnInsert: {} }, // only write on insert — don't touch existing fields
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return settings;
};

settingsSchema.statics.updateSettings = async function (data, userId) {
    const update = { ...data, updatedBy: userId };
    const settings = await this.findOneAndUpdate(
        {}, // match the single settings doc
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return settings;
};

export default mongoose.model('Settings', settingsSchema);
