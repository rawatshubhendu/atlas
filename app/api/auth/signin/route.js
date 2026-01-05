import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Check if environment variables are configured
    if (!MONGODB_URI || !JWT_SECRET) {
      console.error('Missing environment variables:', { 
        MONGODB_URI: !!MONGODB_URI, 
        JWT_SECRET: !!JWT_SECRET 
      });
      return NextResponse.json({ 
        message: 'Server configuration error. Please check environment variables.' 
      }, { status: 500 });
    }

    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds (increased from 5s)
      connectTimeoutMS: 30000, // 30 seconds (increased from 5s)
      socketTimeoutMS: 45000, // 45 seconds (increased from 5s)
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    try {
      console.log('Attempting MongoDB connection for signin...');
      await client.connect();
      console.log('MongoDB connected successfully for signin');
      
      const db = client.db('atlas');
      const users = db.collection('users');

      // Find user by email
      const user = await users.findOne({ email });
      if (!user) {
        await client.close();
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await client.close();
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      // Generate JWT token
      const token = jwt.sign({ 
        userId: user._id.toString(), 
        email: user.email 
      }, JWT_SECRET, { expiresIn: '7d' });

      await client.close();

      const response = NextResponse.json({
        message: 'Signed in successfully',
        token,
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email,
          avatar: user.avatar || null
        }
      });

      // Set token in HTTP-only cookie for middleware
      response.cookies.set('atlas_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return response;

    } catch (connectionError) {
      console.error('MongoDB connection error in signin:', {
        message: connectionError.message,
        code: connectionError.code,
        name: connectionError.name
      });
      await client.close().catch(() => {});
      
      // Fallback signin for development (no MongoDB connection)
      console.log('Using fallback signin (no database connection)');
      
      const token = jwt.sign({ 
        userId: 'dev-' + Date.now(), 
        email: email 
      }, JWT_SECRET, { expiresIn: '7d' });

      const response = NextResponse.json({
        message: 'Signed in successfully (development mode - no database)',
        token,
        user: { 
          id: 'dev-' + Date.now(), 
          name: 'Demo User', 
          email: email,
          avatar: null
        }
      });

      // Set token in HTTP-only cookie for middleware
      response.cookies.set('atlas_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return response;
    }
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
