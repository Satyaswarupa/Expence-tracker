import mongoose from 'mongoose'

// One document per user per month. `amount` is 0 until the user actually sets a
// budget — the doc can exist earlier because the AI coach caches its analysis here.
const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amount: { type: Number, default: 0, min: 0 },
    source: { type: String, enum: ['user', 'ai'], default: 'user' },
    insight: {
      generatedAt: { type: Date, default: null },
      data: { type: mongoose.Schema.Types.Mixed, default: null },
      // Identity of the spending the analysis was based on. Matching input means
      // a re-run would burn tokens to produce the same answer, so we serve this.
      fingerprint: { type: String, default: null },
      // The same idea in a form the client can check without extra queries —
      // /api/budget already returns these three for the month.
      basis: {
        spent: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        budget: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
)

budgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true })

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Budget
}

export default mongoose.models.Budget || mongoose.model('Budget', budgetSchema)
