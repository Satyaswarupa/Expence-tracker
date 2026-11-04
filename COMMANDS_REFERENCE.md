# 🔧 Command Reference - Clerk to HANUOTP Migration

## Quick Command Reference

### 1️⃣ Install Dependencies
```bash
npm install jsonwebtoken
```

### 2️⃣ Update Environment Variables
```bash
# Edit .env.local and add/replace:
HANUOTP_API_KEY=sk_live_your_key_here
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

Or manually:
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output and paste into .env.local as JWT_SECRET value
```

### 3️⃣ Start Development Server
```bash
npm run dev
```

### 4️⃣ Test Signup
```
Visit: http://localhost:3000/signup
Enter: Name, Email, Phone (+91 format)
Receive: OTP on phone
Enter: 6-digit OTP
Result: Should be logged in ✅
```

### 5️⃣ Test Login
```
Visit: http://localhost:3000/login
Enter: Phone number
Receive: OTP on phone
Enter: 6-digit OTP
Result: Should be logged in ✅
```

---

## Advanced Commands

### Clear All Cache
```bash
rm -r .next node_modules package-lock.json
npm install
```

### Production Build
```bash
npm run build
npm start
```

### View Environment Variables
```bash
grep -E "HANUOTP|JWT" .env.local
```

### Generate New JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Check MongoDB Connection
```bash
# From any route file:
// Just test by creating/reading a user
const user = await User.findOne({ email: 'test@example.com' })
console.log(user)
```

### View Migration Files
```bash
# See all new/modified files
git status

# See detailed changes
git diff

# See only HANUOTP-related changes
git diff | grep -E "HANUOTP|otp|phone|JWT"
```

---

## Environment Variable Templates

### Development (.env.local)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
HANUOTP_API_KEY=sk_test_your_test_key_here
JWT_SECRET=dev-secret-key-change-in-production
GEMINI_API_KEY=your_gemini_key
PORT=3000
NEXT_PUBLIC_DEBUG_LATENCY=true
```

### Production (Vercel)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
HANUOTP_API_KEY=sk_live_your_live_key_here
JWT_SECRET=<generate-secure-random-string>
GEMINI_API_KEY=your_gemini_key
PORT=3000
NEXT_PUBLIC_DEBUG_LATENCY=false
```

---

## File Reference Commands

### View Modified Files
```bash
# All changes
git diff

# Specific file
git diff app/login/page.js

# See what was removed vs added
git diff --stat
```

### View Migration Documentation
```bash
cat MIGRATION_GUIDE.md
cat SETUP_CHECKLIST.md
cat MIGRATION_COMPLETE.md
cat MIGRATION_VISUAL_SUMMARY.md
```

### Check API Routes
```bash
# See all auth endpoints
ls -la app/api/auth/

# View login endpoint
cat app/api/auth/login/route.js

# View signup endpoint
cat app/api/auth/signup/route.js

# View me endpoint
cat app/api/auth/me/route.js
```

---

## Troubleshooting Commands

### Fix: Module Not Found
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install jsonwebtoken
npm install
npm run dev
```

### Fix: PORT Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Fix: Clear Browser Cache
```bash
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
# Safari: Cmd+Option+E

# Or clear localStorage via console:
localStorage.clear()
location.reload()
```

### Fix: MongoDB Connection Error
```bash
# Check if MongoDB_URI is correct in .env.local
grep MONGODB_URI .env.local

# Verify connection string format:
mongodb+srv://username:password@cluster.mongodb.net/?appName=DBName
```

### Fix: HANUOTP Not Sending OTP
```bash
# 1. Check API key is set
echo $HANUOTP_API_KEY

# 2. Verify API key is valid
# Go to: https://hanuotp.com/dashboard

# 3. Check SMS balance
# Ensure account has SMS credits

# 4. Check phone number format
# Must be: +countrycode phonenumber
# Example: +919876543210

# 5. Check logs for error
# npm run dev (watch console)
```

---

## Git Commands

### Commit Migration
```bash
git add .
git commit -m "Migrate from Clerk to HANUOTP SMS OTP

- Replaced Clerk authentication with HANUOTP SMS OTP
- Implemented JWT token-based sessions
- Updated login/signup UI for OTP flow
- All user data preserved in MongoDB
- Added phone field to User schema
- Removed Clerk dependencies

Files changed:
- app/layout.js
- context/AuthContext.js
- app/login/page.js
- app/signup/page.js
- app/api/auth/login/route.js
- app/api/auth/signup/route.js
- lib/auth.js
- models/User.js"
```

### Push to Remote
```bash
git push origin main
```

### Deploy to Vercel
```bash
# Vercel will auto-deploy on git push
# Or manually:
vercel
```

---

## Database Commands (MongoDB)

### Connect to MongoDB
```bash
# Using MongoDB Compass
connection_string: mongodb+srv://user:pass@cluster.mongodb.net/?appName=DBName

# Using mongosh
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/?authSource=admin"
```

### View User Collection
```javascript
// In MongoDB Compass or mongosh:
db.users.find()

// See one user:
db.users.findOne({ email: "test@example.com" })

// Count users:
db.users.countDocuments()

// See new fields:
db.users.findOne({ phone: { $exists: true } })
```

### Update User Document (if needed)
```javascript
// Add phone field to existing user
db.users.updateOne(
  { email: "existing@example.com" },
  { $set: { phone: "+919876543210", isPhoneVerified: true } }
)
```

---

## Testing Checklist Commands

```bash
# 1. Check installation
npm list jsonwebtoken

# 2. Check environment
cat .env.local | grep -E "HANUOTP|JWT"

# 3. Start server
npm run dev

# 4. Test in different terminal - check if running
curl http://localhost:3000

# 5. Test signup endpoint
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+919876543210"
  }'

# 6. Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "action": "send-otp"
  }'

# 7. Test me endpoint (with token from login)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/auth/me
```

---

## Vercel Deployment Commands

### Setup Vercel
```bash
npm i -g vercel
vercel login
```

### Deploy
```bash
vercel --prod
```

### Set Environment Variables
```bash
# Via CLI
vercel env add HANUOTP_API_KEY
vercel env add JWT_SECRET

# Or in Vercel Dashboard:
# Settings → Environment Variables → Add
```

### View Logs
```bash
vercel logs
```

---

## Performance Testing

### Check Build Time
```bash
npm run build
# Check output for build duration
```

### Check Package Size
```bash
npm install -g webpack-bundle-analyzer
```

### Monitor Runtime Performance
```bash
# Open DevTools → Console
console.time('otp-send')
// ... run OTP send ...
console.timeEnd('otp-send')
```

---

## Documentation Links in Project

```bash
# Read migration docs in order:
1. cat MIGRATION_VISUAL_SUMMARY.md  # Overview
2. cat SETUP_CHECKLIST.md           # Quick setup
3. cat MIGRATION_GUIDE.md           # Detailed guide
4. cat MIGRATION_COMPLETE.md        # Full summary
```

---

## One-Liner Helpers

```bash
# Quick setup (run all at once)
npm install jsonwebtoken && npm run dev

# Check if all required fields in .env.local
grep -E "HANUOTP_API_KEY|JWT_SECRET|MONGODB_URI" .env.local

# Count lines changed
git diff --stat

# See all OTP-related code
grep -r "otp" app/ --include="*.js" --include="*.jsx"

# See all JWT-related code
grep -r "jsonwebtoken\|jwt.sign\|jwt.verify" . --include="*.js"

# Show modified vs added files
git status --short

# List all API endpoints
find app/api -name "route.js" | xargs ls -la
```

---

## Common Error Solutions

### Error: Cannot find module 'jsonwebtoken'
```bash
npm install jsonwebtoken
npm run dev
```

### Error: HANUOTP_API_KEY not configured
```bash
# Add to .env.local:
HANUOTP_API_KEY=your_actual_key_here

# Then restart:
npm run dev
```

### Error: OTP expired
```bash
# OTP is valid for 10 minutes
# Just request a new OTP
# It will replace the old one
```

### Error: Invalid JWT token
```bash
# Clear localStorage
localStorage.clear()

# Reload and login again
location.reload()
```

---

## Support Resources

```
HANUOTP Docs:     https://hanuotp.com/docs
JWT:              https://jwt.io
Next.js:          https://nextjs.org/docs
MongoDB:          https://docs.mongodb.com
Node.js:          https://nodejs.org/docs
```

---

## Final Checklist

```bash
# Run these in order:
✅ npm install jsonwebtoken
✅ Update .env.local with HANUOTP_API_KEY and JWT_SECRET
✅ npm run dev
✅ Test signup at http://localhost:3000/signup
✅ Test login at http://localhost:3000/login
✅ Verify OTP received
✅ Confirm dashboard loads
✅ Check git status: git status
✅ Commit changes: git commit -m "..."
✅ Push to GitHub: git push origin main
✅ Deploy to Vercel: vercel --prod
```

**All commands ready! Pick any and run. 🚀**
