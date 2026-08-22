import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 'mentor_session' (human-to-human) is added when the Mentor module is built — this model
    // currently only serves the AI-driven chat types.
    chatType: { type: String, enum: ['ai_chatbot', 'mock_interview'], required: true },
    metadata: {
      targetRole: { type: String, default: null }, // used by mock_interview
    },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, chatType: 1, updatedAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);
