import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/mongodb.js';
import User from '../../../lib/models/User.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

// Initialize Google OAuth client
const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

export async function GET(request) {
  try {
    // Check if environment variables are configured
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !JWT_SECRET) {
      console.error('Missing Google OAuth environment variables:', { 
        GOOGLE_CLIENT_ID: !!GOOGLE_CLIENT_ID, 
        GOOGLE_CLIENT_SECRET: !!GOOGLE_CLIENT_SECRET,
        JWT_SECRET: !!JWT_SECRET
      });
      return NextResponse.json({ 
        message: 'Google OAuth not configured. Please check environment variables.' 
      }, { status: 500 });
    }


    const url = new URL(request.url);
    const { searchParams } = url;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const origin = url.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const redirectUri = configuredRedirectUri || `${origin}/api/auth/google`;

    // Handle OAuth error
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(`${origin}/login?error=oauth_error`);
    }

    // Handle missing code
    if (!code) {
      // Redirect to Google OAuth consent screen
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        redirect_uri: redirectUri
      });
      
      return NextResponse.redirect(authUrl);
    }

    // Exchange code for tokens
    const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
    client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=no_email`);
    }

    try {
      // Connect to MongoDB
      if (MONGODB_URI) {
        const dbConnection = await connectDB();
        if (!dbConnection) {
          throw new Error('MongoDB connection failed');
        }
        console.log('MongoDB connected successfully for Google OAuth');
        
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (!user) {
          // Create new user
          user = new User({
            name,
            email,
            googleId,
            profilePicture: picture,
            isGoogleUser: true
          });
          await user.save();
          console.log('New Google user created:', email);
        } else {
          // Update existing user with Google info if not already set
          if (!user.googleId) {
            user.googleId = googleId;
            user.profilePicture = picture;
            user.isGoogleUser = true;
            await user.save();
            console.log('Existing user updated with Google info:', email);
          }
        }

        // Generate JWT token
        const token = jwt.sign({ 
          userId: user._id.toString(), 
          email: user.email 
        }, JWT_SECRET, { expiresIn: '7d' });

        // Set HTTP-only cookie for middleware and redirect to client callback
        const redirectUrl = `${origin}/auth/callback`;
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set('atlas_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60
        });
        return response;

      } else {
        // Development mode without MongoDB
        console.log('MongoDB not configured - using development mode for Google OAuth');
        
        const token = jwt.sign({ 
          userId: 'google-dev-' + Date.now(), 
          email: email 
        }, JWT_SECRET, { expiresIn: '7d' });

        const redirectUrl = `${origin}/auth/callback`;
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set('atlas_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60
        });
        return response;
      }

    } catch (connectionError) {
      console.error('MongoDB connection error in Google OAuth:', connectionError);
      
      // Fallback: Create user without MongoDB for development
      console.log('MongoDB connection failed - using fallback Google OAuth');
      
      const token = jwt.sign({ 
        userId: 'google-dev-' + Date.now(), 
        email: email 
      }, JWT_SECRET, { expiresIn: '7d' });

      const redirectUrl = `${origin}/auth/callback`;
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set('atlas_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60
      });
      return response;
    }

  } catch (error) {
    console.error('Google OAuth error:', error);
    const url = new URL(request.url);
    const origin = url.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
}

// Handle POST requests (for testing)
export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ message: 'ID token is required' }, { status: 400 });
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return NextResponse.json({ message: 'No email found in Google token' }, { status: 400 });
    }

    try {
      // Connect to MongoDB
      if (MONGODB_URI) {
        const dbConnection = await connectDB();
        if (!dbConnection) {
          throw new Error('MongoDB connection failed');
        }
        
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (!user) {
          // Create new user
          user = new User({
            name,
            email,
            googleId,
            profilePicture: picture,
            isGoogleUser: true
          });
          await user.save();
        } else {
          // Update existing user with Google info if not already set
          if (!user.googleId) {
            user.googleId = googleId;
            user.profilePicture = picture;
            user.isGoogleUser = true;
            await user.save();
          }
        }

        // Generate JWT token
        const token = jwt.sign({ 
          userId: user._id.toString(), 
          email: user.email 
        }, JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({
          message: 'Google authentication successful',
          token,
          user: { 
            id: user._id, 
            name: user.name, 
            email: user.email,
            profilePicture: user.profilePicture
          }
        });

      } else {
        // Development mode without MongoDB
        const token = jwt.sign({ 
          userId: 'google-dev-' + Date.now(), 
          email: email 
        }, JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({
          message: 'Google authentication successful (development mode)',
          token,
          user: { 
            id: 'google-dev-' + Date.now(), 
            name: name, 
            email: email,
            profilePicture: picture
          }
        });
      }

    } catch (connectionError) {
      console.error('MongoDB connection error in Google OAuth POST:', connectionError);
      
      // Fallback: Create user without MongoDB for development
      const token = jwt.sign({ 
        userId: 'google-dev-' + Date.now(), 
        email: email 
      }, JWT_SECRET, { expiresIn: '7d' });

      return NextResponse.json({
        message: 'Google authentication successful (fallback mode)',
        token,
        user: { 
          id: 'google-dev-' + Date.now(), 
          name: name, 
          email: email,
          profilePicture: picture
        }
      });
    }

  } catch (error) {
    console.error('Google OAuth POST error:', error);
    return NextResponse.json({ message: 'Google authentication failed' }, { status: 500 });
  }
}
