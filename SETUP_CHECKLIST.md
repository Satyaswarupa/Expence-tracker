# 🎯 Quick Setup Checklist - Clerk to HANUOTP Migration

## ⚡ 5-Minute Setup

### Step 1: Install jsonwebtoken (1 min)
```bash
npm install jsonwebtoken
```

### Step 2: Update Environment Variables (2 min)
Edit `.env.local`:

```bash
# REPLACE THIS:
HANUOTP_API_KEY=YOUR_HANUOTP_API_KEY_HERE

# CHANGE JWT_SECRET to a secure value:
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Step 3: Restart Dev Server (1 min)
```bash
npm run dev
```

### Step 4: Test Login (1 min)
1. Visit `http://localhost:3000/signup`
2. Enter name, email, and phone (with country code, e.g., +91)
3. You should receive OTP via SMS
4. Enter OTP and verify
5. ✅ Logged in!

---

## 📊 What's Changed at a Glance

| Component | Before | After |
|-----------|--------|-------|
| **Auth Method** | Clerk | HANUOTP SMS OTP |
| **Password** | Required | Not needed |
| **Phone** | Optional | Required |
| **Session** | Clerk tokens | JWT tokens |
| **User Data** | Preserved ✅ | Preserved ✅ |

---

## 🔑 File Changes Summary

✅ `app/layout.js` - Removed ClerkProvider  
✅ `context/AuthContext.js` - Replaced with OTP context  
✅ `app/login/page.js` - New OTP login UI  
✅ `app/signup/page.js` - New OTP signup UI  
✅ `app/api/auth/login/route.js` - OTP endpoints  
✅ `app/api/auth/signup/route.js` - Registration with OTP  
✅ `lib/auth.js` - JWT verification  
✅ `models/User.js` - Added phone, otp fields  
✅ `.env.local` - Added HANUOTP_API_KEY, JWT_SECRET  

---

## 💾 Data Safety

✅ **All expenses preserved**  
✅ **All lendings preserved**  
✅ **All pending payments preserved**  
✅ **User profiles preserved**  
✅ **Existing clerkId retained for reference**

---

## 🚀 Next: Production Deployment

### Before Going Live:

1. **Generate Secure JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Update `.env.local` with the generated key

2. **Verify HANUOTP Account**
   - Check you have SMS credits
   - Confirm API key is live (not test)
   - Test with your own phone number

3. **Build & Test**
   ```bash
   npm run build
   npm start
   ```

4. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Migrate from Clerk to HANUOTP SMS OTP"
   git push origin main
   ```

5. **Update Vercel Environment Variables**
   - Set `HANUOTP_API_KEY` (live key)
   - Set `JWT_SECRET` (secure random string)
   - Remove old Clerk variables if present

---

## ❓ Common Questions

**Q: Will my existing users be affected?**
A: Their data is safe. They'll need to sign up again with phone number to log in.

**Q: Can I still use email?**
A: Users sign up with name, email, AND phone. SMS OTP is sent to the phone number.

**Q: What if user loses access to their phone?**
A: Implement account recovery via email (future enhancement).

**Q: How long is OTP valid?**
A: 10 minutes. Users can request a new one anytime.

**Q: Is data encrypted?**
A: Yes. MongoDB stores encrypted data, JWT tokens use HMAC-SHA256.

---

## 🆘 Troubleshooting

**"Cannot find module 'jsonwebtoken'"**
→ Run: `npm install jsonwebtoken`

**"HANUOTP_API_KEY not configured"**
→ Add it to `.env.local` and restart server

**"OTP not received"**
→ Check HANUOTP account SMS balance & API key validity

**Old Clerk code still running**
→ Clear node_modules & package-lock.json, then reinstall

---

## 📞 Support Resources

- HANUOTP: https://hanuotp.com/docs
- JWT: https://jwt.io
- Next.js API Routes: https://nextjs.org/docs/api-routes

---

**Ready to go! 🎉 Start the server with `npm run dev`**
