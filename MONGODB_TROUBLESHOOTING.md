# MongoDB Connection Troubleshooting

## Current Issue
```
querySrv ENOTFOUND _mongodb._tcp.cluster0.v2whido.mongodb.net
```

This means the application cannot reach your MongoDB Atlas cluster.

---

## Quick Fixes (Try in Order)

### 1. **Check MongoDB Atlas Security Settings** ⚠️
Your MongoDB cluster might be blocking incoming connections.

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your cluster → **Security** tab
3. Click **Network Access**
4. Look for your IP address in the whitelist
5. If not there, click **Add IP Address** and choose one of:
   - Add Current IP (your computer)
   - Add 0.0.0.0/0 (allow all - for testing only)

**This is the most likely cause** ✓

---

### 2. **Verify Cluster is Running**

1. Go to MongoDB Atlas Dashboard
2. Check if your cluster shows status "Active" (not "Paused")
3. If paused, click **Resume**

---

### 3. **Use Standard Connection String** (No SRV)

Some networks/firewalls block `mongodb+srv://` DNS SRV lookups.

**Steps:**
1. In MongoDB Atlas, go to **Clusters → Connect**
2. Click **Drivers** tab
3. Look for "Connection String" option - choose **Standard** (not SRV)
4. Copy the connection string (should start with `mongodb://` not `mongodb+srv://`)
5. Update `.env.local`:
   ```
   MONGODB_URI=mongodb://user:pass@cluster0-shard-00-00.xxxxx.mongodb.net:27017,cluster0-shard-00-01.xxxxx.mongodb.net:27017,cluster0-shard-00-02.xxxxx.mongodb.net:27017/?replicaSet=atlas-xxxxx&retryWrites=true
   ```
6. Restart the dev server: `npm run dev`

---

### 4. **Check Credentials**

Verify your `.env.local` has:
- Correct username
- Correct password (no special characters causing parsing issues)
- Correct cluster name

---

### 5. **Test DNS Resolution**

Open PowerShell and run:
```powershell
nslookup cluster0.v2whido.mongodb.net
Resolve-DnsName cluster0.v2whido.mongodb.net
```

If both fail with "Non-existent domain" → cluster name might be wrong

---

## Alternative: Use Local MongoDB

If MongoDB Atlas continues to not work, set up local MongoDB:

### With Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then update `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/expence-tracker
```

### Without Docker:
1. [Download MongoDB Community](https://www.mongodb.com/try/download/community)
2. Install and start the service
3. Update `.env.local`:
   ```
   MONGODB_URI=mongodb://localhost:27017/expence-tracker
   ```

---

## Debugging Steps

1. **Check what URI is loaded:**
   - Look for log: `📊 MongoDB URI (masked): ...`
   - If it's masked properly, credentials are being read

2. **Check error type:**
   - `querySrv ENOTFOUND` → DNS/Network issue
   - `MongoAuthenticationError` → Wrong username/password
   - `MongoServerError` → Cluster running but rejecting connection

3. **Enable verbose logging:**
   - Add to `lib/mongodb.js` if needed for debugging

---

## Success Indicator

Once MongoDB connects, you should see:
```
✅ MongoDB connected
```

And signup should complete with:
```
✅ Signup successful, token generated
```

---

## Questions?

1. Can you access MongoDB Atlas website right now? → Confirms internet works
2. Is your cluster status "Active" (not "Paused")?
3. Did you check Network Access whitelist for your IP?
4. Can you try the standard connection string format?

**Most common fix:** Add your IP to MongoDB Atlas Network Access whitelist.
