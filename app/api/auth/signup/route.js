import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/mongodb.js';
import User, { validateUser, sanitizeUser } from '../../../lib/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

export async function POST(request) {
  try {
    const userData = await request.json();

    // Validate user data
    const validation = validateUser(userData);
    if (!validation.isValid) {
      return NextResponse.json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      }, { status: 400 });
    }

    // Check if JWT_SECRET is configured
    if (!JWT_SECRET) {
      console.error('Missing JWT_SECRET environment variable');
      return NextResponse.json({ 
        message: 'Server configuration error. Please check environment variables.' 
      }, { status: 500 });
    }

    // Check if MongoDB URI is configured
    if (!MONGODB_URI) {
      console.log('MongoDB URI not configured - using development mode');
      
      // Development mode: Create user without database
      const sanitizedData = sanitizeUser(userData);
      
      // Hash password for security even in dev mode
      const hashedPassword = await bcrypt.hash(sanitizedData.password, 12);
      
      const token = jwt.sign({ 
        userId: 'dev-' + Date.now(), 
        email: sanitizedData.email 
      }, JWT_SECRET, { expiresIn: '7d' });

      const response = NextResponse.json({
        message: 'Account created successfully! (Development mode - data not persisted)',
        token,
        user: { 
          id: 'dev-' + Date.now(), 
          name: sanitizedData.name, 
          email: sanitizedData.email 
        }
      });

      response.cookies.set('atlas_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return response;
    }

    try {
      // Connect to MongoDB using mongoose
      const dbConnection = await connectDB();
      if (!dbConnection) {
        throw new Error('MongoDB connection failed');
      }
      console.log('MongoDB connected successfully via mongoose');
      
      // Sanitize user data
      const sanitizedData = sanitizeUser(userData);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: sanitizedData.email });
      if (existingUser) {
        return NextResponse.json({ message: 'User already exists' }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(sanitizedData.password, 12);

      // Create user with mongoose
      const newUser = new User({
        ...sanitizedData,
        password: hashedPassword
      });

      const savedUser = await newUser.save();

      // Generate JWT token
      const token = jwt.sign({ 
        userId: savedUser._id.toString(), 
        email: savedUser.email 
      }, JWT_SECRET, { expiresIn: '7d' });

      const response = NextResponse.json({
        message: 'User created successfully',
        token,
        user: { 
          id: savedUser._id, 
          name: savedUser.name, 
          email: savedUser.email 
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
      console.error('MongoDB connection error details:', {
        message: connectionError.message,
        code: connectionError.code,
        name: connectionError.name
      });
      
      // Fallback: Create user without MongoDB for development
      console.log('MongoDB connection failed - using fallback authentication');
      const sanitizedData = sanitizeUser(userData);
      
      const token = jwt.sign({ 
        userId: 'dev-' + Date.now(), 
        email: sanitizedData.email 
      }, JWT_SECRET, { expiresIn: '7d' });

      return NextResponse.json({
        message: 'Account created successfully! (Fallback mode - check MongoDB connection)',
        token,
        user: { 
          id: 'dev-' + Date.now(), 
          name: sanitizedData.name, 
          email: sanitizedData.email 
        }
      });
    }

  } catch (error) {
    console.error('Signup error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      return NextResponse.json({ 
        message: 'Invalid MongoDB connection string. Please check your MONGODB_URI in .env file.' 
      }, { status: 500 });
    }
    
    if (error.message.includes('authentication')) {
      return NextResponse.json({ 
        message: 'Database authentication failed. Please check your MongoDB credentials.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Internal server error. Please check server logs for details.' 
    }, { status: 500 });
  }
}
