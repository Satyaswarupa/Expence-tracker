import User from '@/models/User'
import { connectDB, isMockDatabase, getMockDB } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const { phone, action, otp } = body

    if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
      return Response.json({ error: 'Valid phone number is required' }, { status: 400 })
    }

    const normalizedPhone = phone.replace(/\s/g, '')

    if (action === 'send-otp') {
      return await handleSendOtp(normalizedPhone)
    } else if (action === 'verify-otp') {
      return await handleVerifyOtp(normalizedPhone, otp)
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Login error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleSendOtp(phone) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    const useMock = isMockDatabase()
    let user

    if (useMock) {
      const mockDB = getMockDB()
      user = await mockDB.findOne({ phone })
      if (!user) {
        user = await mockDB.create({
          phone,
          email: '',
          name: '',
          otp,
          otpExpiry,
        })
      } else {
        user.otp = otp
        user.otpExpiry = otpExpiry
        await mockDB.save(user)
      }
    } else {
      user = await User.findOne({ phone })
      if (!user) {
        user = new User({
          phone,
          email: '',
          name: '',
          otp,
          otpExpiry,
        })
      } else {
        user.otp = otp
        user.otpExpiry = otpExpiry
      }
      await user.save()
    }

    const hanuResponse = await sendOtpViaHanuotp(phone, otp)
    if (!hanuResponse.success) {
      console.warn('HANUOTP failed, proceeding with dev OTP:', otp)
    }

    return Response.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 600,
      _devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
    })
  } catch (err) {
    console.error('Send OTP error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleVerifyOtp(phone, otp) {
  try {
    const useMock = isMockDatabase()
    let user

    if (useMock) {
      const mockDB = getMockDB()
      user = await mockDB.findOne({ phone })
    } else {
      user = await User.findOne({ phone })
    }

    if (!user) {
      return Response.json({ error: 'Phone number not found' }, { status: 404 })
    }

    if (!user.otp || user.otp !== otp) {
      return Response.json({ error: 'Invalid OTP' }, { status: 401 })
    }

    if (new Date() > user.otpExpiry) {
      return Response.json({ error: 'OTP expired' }, { status: 401 })
    }

    user.otp = null
    user.otpExpiry = null
    user.isPhoneVerified = true

    if (useMock) {
      const mockDB = getMockDB()
      await mockDB.save(user)
    } else {
      await user.save()
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, phone: user.phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    )

    return Response.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendOtpViaHanuotp(phone, otp) {
  try {
    const apiKey = process.env.HANUOTP_API_KEY
    if (!apiKey) {
      console.warn('HANUOTP_API_KEY not configured, OTP:', otp)
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
      console.warn('HANUOTP API error:', error.message)
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 [DEV MODE] OTP for phone', phone, ':', otp)
        return { success: true }
      }
      return { success: false, error: error.message || 'Failed to send OTP' }
    }

    console.log('✅ OTP sent to', phone)
    return { success: true }
  } catch (err) {
    console.warn('HANUOTP error:', err.message)
    if (process.env.NODE_ENV === 'development') {
      console.log('📱 [DEV MODE] OTP:', otp)
      return { success: true }
    }
    return { success: false, error: err.message }
  }
}
