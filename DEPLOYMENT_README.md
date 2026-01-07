# 🚀 Atlas Deployment Guide

## Environment Variables Required

Set these in your deployment platform (Vercel/Netlify):

### Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Authentication
```
JWT_SECRET=your-super-secret-jwt-key-here-at-least-32-characters
```

### Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
```

### File Upload (Cloudinary)
```
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## MongoDB Atlas Setup

1. Create a cluster in MongoDB Atlas
2. Add your IP address to Network Access (0.0.0.0/0 for testing, restrict in production)
3. Create a database user in Database Access
4. Get your connection string and replace `<password>` with your actual password

## Vercel Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set all environment variables above in Vercel dashboard
3. Deploy
4. Update Google OAuth redirect URI with your Vercel domain

## Common Issues

### User Update "Not Found" Error
- Ensure MONGODB_URI is correct in deployment environment
- Check that user exists in production database
- Verify JWT_SECRET matches between environments

### Blog Publishing Issues
- Ensure editor content is being saved properly
- Check that validation passes with substantial content
- Verify API routes are working in production

### Authentication Issues
- Ensure Google OAuth credentials are set correctly
- Verify redirect URIs match your deployment domain
- Check JWT token handling
