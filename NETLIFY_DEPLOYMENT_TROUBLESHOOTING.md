# 🚀 Netlify Deployment Troubleshooting Guide

## ⚠️ Common Issues & Solutions

### 1. **Changes Not Showing After Deployment**

#### **Solution A: Clear Netlify Build Cache**
1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Build & deploy** → **Build settings**
3. Click **"Clear cache and deploy site"**
4. Trigger a new deployment

#### **Solution B: Force Rebuild**
1. In Netlify dashboard, go to **Deploys**
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for build to complete

#### **Solution C: Check Build Logs**
1. Go to **Deploys** tab in Netlify
2. Click on the latest deployment
3. Check **Build log** for errors
4. Look for:
   - Build failures
   - Missing environment variables
   - Compilation errors

### 2. **Browser Cache Issues**

#### **Clear Browser Cache:**
- **Chrome/Edge**: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Firefox**: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Safari**: `Cmd+Option+E` to empty cache

#### **Hard Refresh:**
- **Windows**: `Ctrl+F5` or `Ctrl+Shift+R`
- **Mac**: `Cmd+Shift+R`

#### **Incognito/Private Mode:**
Test your site in incognito/private mode to bypass cache completely.

### 3. **Git Push Issues**

#### **Verify Changes Were Pushed:**
```bash
# Check git status
git status

# Check if changes are committed
git log --oneline -5

# Verify remote is up to date
git remote -v

# Force push if needed (be careful!)
git push origin main --force
```

#### **Check Netlify is Connected to Correct Branch:**
1. Netlify dashboard → **Site settings** → **Build & deploy**
2. Under **Continuous Deployment**, verify:
   - Correct repository is connected
   - Correct branch is set (usually `main` or `master`)
   - Build command is `npm run build`

### 4. **Environment Variables Missing**

#### **Check Environment Variables in Netlify:**
1. Netlify dashboard → **Site settings** → **Environment variables**
2. Verify all required variables are set:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NEXT_PUBLIC_APP_URL`

#### **Redeploy After Adding Variables:**
After adding/updating environment variables, **trigger a new deployment**.

### 5. **Build Configuration Issues**

#### **Verify netlify.toml:**
```toml
[build]
  command = "npm run build"
  # publish directory is handled by @netlify/plugin-nextjs

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

### 6. **Next.js Cache Issues**

#### **Clear Next.js Cache Locally:**
```bash
# Delete .next folder
rm -rf .next

# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### 7. **Check Deployment Status**

#### **In Netlify Dashboard:**
1. Go to **Deploys** tab
2. Check latest deployment status:
   - ✅ **Published** = Success
   - ⚠️ **Failed** = Check build logs
   - 🔄 **Building** = Wait for completion

### 8. **Verify Files Were Changed**

#### **Check What Changed:**
```bash
# See what files changed
git diff HEAD~1 HEAD

# See commit history
git log --oneline -10

# Verify specific file was changed
git show HEAD:app/dashboard/page.js | head -20
```

### 9. **Netlify Build Cache**

#### **Disable Build Cache Temporarily:**
1. Netlify dashboard → **Site settings** → **Build & deploy**
2. Under **Build settings**, add:
   ```
   NETLIFY_NEXT_PLUGIN_SKIP=true
   ```
3. Redeploy

### 10. **Check Build Output**

#### **Verify Build Succeeded:**
1. Check Netlify build logs for:
   - ✅ "Build successful"
   - ✅ "Deploy preview ready"
   - ❌ Any errors or warnings

#### **Common Build Errors:**
- **Missing dependencies**: `npm install` failed
- **Type errors**: Check TypeScript/ESLint errors
- **Environment variables**: Missing required vars
- **Memory issues**: Increase build timeout

## 🔧 Quick Fix Checklist

- [ ] Cleared Netlify build cache
- [ ] Triggered new deployment with cache clear
- [ ] Checked build logs for errors
- [ ] Verified environment variables are set
- [ ] Cleared browser cache / tested in incognito
- [ ] Verified git push was successful
- [ ] Checked correct branch is deployed
- [ ] Verified files were actually changed
- [ ] Checked deployment status is "Published"
- [ ] Waited 2-3 minutes after deployment

## 🚀 Force Fresh Deployment

### **Method 1: Via Netlify Dashboard**
1. Go to **Deploys** tab
2. Click **"Trigger deploy"**
3. Select **"Clear cache and deploy site"**
4. Wait for completion

### **Method 2: Via Git**
```bash
# Make a small change to trigger rebuild
echo "" >> README.md
git add README.md
git commit -m "Trigger rebuild"
git push origin main
```

### **Method 3: Via Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy with cache clear
netlify deploy --build --prod
```

## 📊 Debugging Steps

1. **Check Build Logs**: Look for errors or warnings
2. **Check Deployment URL**: Verify correct site URL
3. **Check Browser Console**: Look for JavaScript errors
4. **Check Network Tab**: Verify assets are loading
5. **Compare Local vs Production**: Test locally first

## 🎯 Most Common Solution

**90% of the time, this fixes it:**
1. Go to Netlify dashboard
2. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**
3. Wait 2-3 minutes
4. Hard refresh browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)

## 📝 Still Not Working?

1. Check Netlify build logs for specific errors
2. Verify all environment variables are set correctly
3. Ensure `netlify.toml` is correct
4. Try deploying from a different branch
5. Contact Netlify support with build log URL

