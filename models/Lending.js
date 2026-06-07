import mongoose from 'mongoose'

const lendingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    person: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, enum: ['Cash', 'UPI'], default: 'Cash' },
    dateGiven: { type: Date, required: true, default: Date.now },
    expectedReturnDate: { type: Date, default: null },
  },
  { timestamps: true }
)

lendingSchema.index({ userId: 1, dateGiven: -1 })

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Lending
}

export default mongoose.models.Lending || mongoose.model('Lending', lendingSchema)
