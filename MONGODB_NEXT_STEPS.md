# MongoDB Connection Issue - Next Steps

## Current Status ✅/❌

✅ **Completed:**
- Migrated from Clerk to OTP/JWT authentication
- Updated all routes, models, and auth context
- Fixed syntax errors in API routes
- Set up MongoDB connection configuration
- Dependencies installed (`jsonwebtoken`)
- Dev server running successfully

❌ **Blocked:**
- MongoDB Atlas cluster not accessible via DNS
- Error: `querySrv ENOTFOUND _mongodb._tcp.cluster0.v2whido.mongodb.net`

---

## What's Happening?

Your application tries to connect to MongoDB Atlas using the connection string:
```
mongodb+srv://ghghaaa83_db_user:m3gVl5NK2aDd99gs@cluster0.v2whido.mongodb.net/?appName=Cluster0
```

But the DNS lookup is failing, meaning:
1. Network can't reach `_mongodb._tcp.cluster0.v2whido.mongodb.net` (SRV record)
2. This could be a firewall/network issue, or the cluster isn't accessible

---

## Three Solutions

### **OPTION 1: Fix MongoDB Atlas (RECOMMENDED)** ⭐

This is the most likely fix:

1. **Go to MongoDB Atlas** → https://cloud.mongodb.com
2. **Select your cluster** → "Clusters" menu
3. **Click "Security" tab** at the top
4. **Click "Network Access"** on the left sidebar
5. **Look at the IP Whitelist:**
   - If your computer's IP is NOT there, click **"Add IP Address"**
   - Choose **"Add Current IP"** to add your computer
   - Or add **"0.0.0.0/0"** to allow any IP (testing only)
6. **Click "Confirm"**
7. **Restart the dev server:** `npm run dev`
8. **Try again:** POST to `/api/auth/signup`

**Expected result:** MongoDB connects successfully ✅

---

### **OPTION 2: Use Standard Connection String** (No SRV)

Some networks block `mongodb+srv://` DNS lookups. Use the standard format instead:

1. **In MongoDB Atlas:**
   - Go to **Clusters > Connect > Drivers**
   - Select **Node.js** driver
   - Click the **"Connection String"** tab dropdown
   - Choose **"Standard"** (not "SRV") if available
   - Copy the entire connection string

2. **Example format (standard, no SRV):**
   ```
   mongodb://username:password@cluster0-shard-00-00.xxxxx.mongodb.net:27017,cluster0-shard-00-01.xxxxx.mongodb.net:27017,cluster0-shard-00-02.xxxxx.mongodb.net:27017/?replicaSet=atlas-xxxxx&retryWrites=true
   ```

3. **Update `.env.local`:**
   - Replace the current `MONGODB_URI=...` with the standard format string
   - Make sure credentials are correct (username and password)

4. **Restart:** `npm run dev`

---

### **OPTION 3: Use Local MongoDB (Quick Testing)**

If MongoDB Atlas isn't working and you want to test the OTP flow immediately:

#### With Docker (easiest):
```bash
# Install Docker first if you don't have it
# Then run:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Without Docker:
1. [Download MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Install it
3. Start the MongoDB service

#### Either way, update `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/expence-tracker
```

---

### **OPTION 4: Use Mock Database (INSTANT TESTING)**

For quick testing WITHOUT any MongoDB setup:

1. **Update `.env.local`:**
   ```
   USE_MOCK_DB=true
   ```

2. **This uses an in-memory database** - perfect for testing OTP logic

3. **Limitations:**
   - Data is lost when you restart the server
   - Good for testing only, NOT production
   - Auto-expires when you fix the real MongoDB connection

4. **To re-enable MongoDB:**
   ```
   USE_MOCK_DB=false
   ```

---

## Testing the OTP Flow

Once any of the above works, test with:

### **Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+919876543210"
  }'
```

**Success response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "phone": "9876****3210",
  "token": "eyJ...",
  "expiresIn": 600,
  "_devOtp": "123456"  // (only in dev mode)
}
```

### **Login - Send OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "action": "send-otp"
  }'
```

### **Login - Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "action": "verify-otp",
    "otp": "123456"  // Use _devOtp from above
  }'
```

---

## Debugging

### Check logs in dev server console:
```
📊 MongoDB URI (masked): ******cluster0.v2whido.mongodb.net/?appName=Cluster0
🔗 Connecting to MongoDB...
✅ MongoDB connected   ← This means it worked!
```

### Common error messages:

| Error | Cause | Fix |
|-------|-------|-----|
| `querySrv ENOTFOUND` | DNS blocked or cluster not reachable | Add IP to MongoDB Network Access whitelist |
| `ECONNREFUSED` | MongoDB not running | Start MongoDB or use docker run command |
| `MongoAuthenticationError` | Wrong username/password | Check credentials in connection string |
| `ENOTFOUND _mongodb...` | Network issue | Try standard connection string format |

---

## Files Changed/Created

**Modified:**
- `lib/mongodb.js` - Added mock DB fallback and better error messages
- `.env.local` - Added `USE_MOCK_DB` setting

**Created:**
- `lib/mockDatabase.js` - In-memory database for testing
- `MONGODB_TROUBLESHOOTING.md` - Detailed troubleshooting guide

---

## Recommended Next Steps

**1. Try OPTION 1 first** (add IP to MongoDB whitelist) - highest success rate
**2. If that doesn't work, try OPTION 2** (standard connection string)
**3. If still blocked, use OPTION 4** (mock DB) to test OTP flow immediately
**4. Once OTP logic is verified, fix MongoDB and switch back**

---

## Questions?

**Still getting `querySrv ENOTFOUND`?**
- Can you access MongoDB Atlas website right now?
- Is your cluster showing "Active" status (not "Paused")?
- Did you click "Confirm" after adding your IP to the whitelist?

**Want to test OTP immediately?**
- Set `USE_MOCK_DB=true` in `.env.local`
- Data won't persist, but OTP/JWT logic will work

---

## Important Notes

- ⚠️ Do NOT commit `.env.local` to git (already in `.gitignore`)
- 🔒 Keep HANUOTP_API_KEY and JWT_SECRET secure
- 📱 In development mode, OTPs are returned in `_devOtp` field for testing
- 🔄 Once MongoDB works, existing Clerk users will auto-migrate on first signup with their email

**Let me know which option you choose, or if you need help with any of these steps!**
