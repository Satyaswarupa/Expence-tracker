import mongoose from 'mongoose'

const pendingPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    person: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    note: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, enum: ['Cash', 'UPI'], default: 'Cash' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
)

pendingPaymentSchema.index({ userId: 1, date: -1 })

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.PendingPayment
}

export default mongoose.models.PendingPayment || mongoose.model('PendingPayment', pendingPaymentSchema)
