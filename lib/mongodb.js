import mongoose from 'mongoose'
import { mockDB } from './mockDatabase.js'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local')
}

// Debug: log the URI (masked) to see what's being used
if (process.env.NODE_ENV === 'development') {
  const maskedUri = MONGODB_URI.replace(/\/\/.*@/, '//***:***@')
  console.log('📊 MongoDB URI (masked):', maskedUri)
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, useMock: false }
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    }).catch(err => {
      console.error('MongoDB connection failed:', err.message)
      if (err.message.includes('querySrv ENOTFOUND') || err.message.includes('getaddrinfo ENOTFOUND')) {
        console.error('⚠️ DNS SRV lookup failed. This usually means:')
        console.error('  1. Network/firewall is blocking SRV lookups')
        console.error('  2. Cluster hostname is wrong')
        console.error('  3. MongoDB Atlas cluster is not accessible')
        console.error('Try: Update MONGODB_URI to use standard connection string (mongodb:// not mongodb+srv://)')
        
        // Fallback to mock database for testing
        if (process.env.USE_MOCK_DB === 'true') {
          console.warn('⚠️ Falling back to MOCK DATABASE (in-memory) for testing')
          console.warn('⚠️ This is TEMPORARY - data will be lost on restart')
          cached.useMock = true
          return { mock: true }
        }
      }
      throw err
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export function isMockDatabase() {
  return cached?.useMock === true
}

export function getMockDB() {
  return mockDB
}
