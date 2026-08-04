import mongoose from 'mongoose'

// A challenge is always "spend no more than `targetAmount` between startDate and
// endDate" — optionally narrowed to one category. Progress is never stored; it is
// recomputed from expenses on every read so it can't drift.
const challengeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    scope: { type: String, enum: ['category', 'total'], default: 'total' },
    category: { type: String, default: null },
    targetAmount: { type: Number, required: true, min: 0 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'completed', 'failed', 'abandoned'], default: 'active' },
    source: { type: String, enum: ['ai', 'user'], default: 'ai' },
  },
  { timestamps: true }
)

challengeSchema.index({ userId: 1, status: 1, endDate: -1 })

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Challenge
}

export default mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema)
