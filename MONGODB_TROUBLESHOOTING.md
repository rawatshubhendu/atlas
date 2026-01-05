# MongoDB Connection Troubleshooting Guide

## 🔍 Common Issues & Solutions

### 1. **`querySrv ENOTFOUND` Error** ⚠️ **CURRENT ISSUE**

This error means DNS cannot resolve the MongoDB Atlas cluster hostname. The connection string format is correct, but Next.js can't resolve it.

#### **Quick Fixes:**

1. **Restart Next.js Dev Server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

2. **Check Environment Variables:**
   ```bash
   # Verify .env.local exists and has MONGODB_URI
   cat .env.local
   ```

3. **Clear Next.js Cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Verify Connection String Format:**
   - Should be: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
   - No spaces or quotes around the value
   - Password must be URL-encoded if it contains special characters

5. **Check MongoDB Atlas Cluster:**
   - Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
   - Verify cluster is running (not paused)
   - Check IP whitelist includes your IP or `0.0.0.0/0`

#### **Why This Happens:**
- Next.js environment variables might not be loaded correctly
- Connection caching issues
- Network/DNS resolution differences between Node.js and Next.js runtime

### 2. **`querySrv ECONNREFUSED` Error**

This error means MongoDB Atlas DNS resolution failed. Here's how to fix it:

#### **Check MongoDB Atlas Cluster Status:**
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Check if your cluster is **running** (not paused)
3. If paused, click **"Resume"** to start it

#### **Check IP Whitelist:**
1. In MongoDB Atlas, go to **Network Access** → **IP Access List**
2. Add your current IP address or use `0.0.0.0/0` for development (⚠️ **NOT recommended for production**)
3. Click **"Add IP Address"**

#### **Verify Connection String:**
1. In MongoDB Atlas, go to **Database** → **Connect**
2. Click **"Connect your application"**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Update your `.env.local` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/atlas?retryWrites=true&w=majority
   ```

#### **Check Password Encoding:**
- If your password contains special characters, URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - etc.

#### **Test Connection:**
Run the test script:
```bash
node test-mongo.js
```

### 2. **Connection Timeout Issues**

I've increased the timeout values:
- `serverSelectionTimeoutMS`: 30 seconds (was 5 seconds)
- `connectTimeoutMS`: 30 seconds (was 5 seconds)
- `socketTimeoutMS`: 45 seconds (was 5 seconds)

### 3. **Duplicate Schema Index Warnings**

✅ **FIXED**: Removed duplicate index definitions in `User.js`. The schema-level `unique: true` automatically creates indexes, so manual index creation was redundant.

### 4. **Network/Firewall Issues**

If you're behind a corporate firewall or VPN:
- Try disconnecting VPN
- Check if port 27017 is blocked
- Try using a different network

### 5. **MongoDB Atlas Free Tier Limitations**

Free tier clusters:
- Auto-pause after 1 hour of inactivity
- May take 1-2 minutes to resume
- Have connection limits

**Solution**: Keep your cluster running or wait for it to resume.

## 🔧 Quick Fixes

### **Option 1: Restart MongoDB Atlas Cluster**
1. Go to MongoDB Atlas
2. Click on your cluster
3. Click **"Resume"** if paused
4. Wait 1-2 minutes for it to start

### **Option 2: Update IP Whitelist**
1. MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"**
3. Add `0.0.0.0/0` (allow all IPs) for development
4. Click **"Confirm"**

### **Option 3: Verify Environment Variables**
Check your `.env.local` file:
```bash
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/atlas?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
```

### **Option 4: Test Connection Manually**
```bash
node test-mongo.js
```

## 📊 Current Connection Settings

The connection now uses:
- ✅ **30-second timeout** for server selection
- ✅ **30-second timeout** for connection
- ✅ **45-second timeout** for socket operations
- ✅ **Automatic retry** for writes
- ✅ **Connection pooling** (max 10 connections)

## 🚨 Still Having Issues?

1. **Check MongoDB Atlas Status**: https://status.mongodb.com/
2. **Review MongoDB Atlas Logs**: Check for any service alerts
3. **Verify Database User**: Ensure your database user has proper permissions
4. **Check Connection String Format**: Must be `mongodb+srv://...` for Atlas

## ✅ Success Indicators

When MongoDB connects successfully, you'll see:
```
✅ MongoDB Connected
MongoDB connected successfully for signin
```

If you see these messages, your connection is working! 🎉

