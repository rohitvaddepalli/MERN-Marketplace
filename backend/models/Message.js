import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            maxlength: 500,
            trim: true,
        },
    },
    { timestamps: true }
);

// Fetch last N messages for a room efficiently
messageSchema.index({ roomId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
