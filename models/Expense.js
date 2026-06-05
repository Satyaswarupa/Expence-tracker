import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Fuel', 'Labour', 'Material', 'Investment', 'Other'],
    },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
)

expenseSchema.index({ userId: 1, date: -1 })
expenseSchema.index({ userId: 1, category: 1 })

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema)
