import User from '@/models/User'
import { connectDB, isMockDatabase, getMockDB } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

export async function POST(request) {
  try {
    console.log('📤 Signup request received')
    const body = await request.json()
    console.log('📦 Request body:', { ...body, email: body.email?.substring(0, 5) + '...' })

    const { name, email, phone } = body

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      console.log('❌ Missing fields')
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }

    console.log('🔗 Connecting to database...')
    await connectDB()
    
    const useMock = isMockDatabase()
    const dbType = useMock ? '🗄️ Mock DB' : '✅ MongoDB'
    console.log(dbType + ' connected')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      console.log('❌ Invalid email format')
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      console.log('❌ Invalid phone format:', phone)
      return Response.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    const normalizedPhone = phone.replace(/\s/g, '')
    const normalizedEmail = email.trim().toLowerCase()

    console.log('🔍 Checking for existing user...')
    
    let existing
    if (useMock) {
      const mockDB = getMockDB()
      existing = await mockDB.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      })
    } else {
      existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      })
    }

    if (existing) {
      console.log('❌ User already exists')
      if (existing.email === normalizedEmail) {
        return Response.json({ error: 'Email already registered' }, { status: 409 })
      }
      if (existing.phone === normalizedPhone) {
        return Response.json({ error: 'Phone number already registered' }, { status: 409 })
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    console.log('👤 Creating new user with OTP:', otp)
    
    let newUser
    if (useMock) {
      const mockDB = getMockDB()
      newUser = await mockDB.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        otp,
        otpExpiry,
        isPhoneVerified: false,
      })
    } else {
      newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        otp,
        otpExpiry,
        isPhoneVerified: false,
      })
      await newUser.save()
    }
    
    console.log('✅ User saved')

    await sendOtpViaHanuotp(normalizedPhone, otp)

    const token = jwt.sign(
      { userId: newUser._id.toString(), email: normalizedEmail, phone: normalizedPhone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    )

    console.log('✅ Signup successful, token generated')
    return Response.json({
      success: true,
      message: 'OTP sent to your phone',
      phone: normalizedPhone.replace(/(?<=^\+?1?)(.*?)(\d{4})$/, '$1****$2'),
      token,
      expiresIn: 600,
      _devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    })
  } catch (err) {
    console.error('❌ Signup error:', err.message, err.stack)
    return Response.json({ error: 'Internal server error: ' + err.message }, { status: 500 })
  }
}

async function sendOtpViaHanuotp(phone, otp) {
  try {
    const apiKey = process.env.HANUOTP_API_KEY
    if (!apiKey) {
      console.warn('⚠️ HANUOTP_API_KEY not configured')
      console.log('📱 [DEV MODE] OTP for', phone, ':', otp)
      return { success: true }
    }

    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone

    const response = await fetch('https://api.hanuotp.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: `Your MoneyJot verification code is: ${otp}. Valid for 10 minutes.`,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.warn('⚠️ HANUOTP API error:', error.message)
      console.log('📱 [DEV MODE] OTP for', phone, ':', otp)
      return { success: true }
    }

    console.log('✅ OTP sent to', phone)
    return { success: true }
  } catch (err) {
    console.warn('⚠️ HANUOTP error:', err.message)
    console.log('📱 [DEV MODE] OTP:', otp)
    return { success: true }
  }
}
