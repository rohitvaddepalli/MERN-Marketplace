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
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

settingsSchema.statics.updateSettings = async function (data, userId) {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ ...data, updatedBy: userId });
    } else {
        Object.assign(settings, data);
        settings.updatedBy = userId;
        await settings.save();
    }
    return settings;
};

export default mongoose.model('Settings', settingsSchema);
