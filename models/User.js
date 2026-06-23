import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    clerkId: { type: String, unique: true, sparse: true, index: true },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
)

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.User
}

export default mongoose.models.User || mongoose.model('User', userSchema)
