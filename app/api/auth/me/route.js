import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    const token = request.cookies.get('atlas_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    
    try {
      // Try to fetch full user data from database
      const dbConnection = await connectDB();
      if (dbConnection) {
        const user = await User.findOne({ email: payload.email });
        
        if (user) {
          return NextResponse.json({
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar || user.profilePicture || null
            }
          });
        }
      }
    } catch (dbError) {
      console.log('Database not available, using JWT data only');
    }
    
    // Fallback to JWT data if database is not available
    return NextResponse.json({
      user: {
        id: payload.userId,
        name: payload.email?.split('@')[0] || 'User',
        email: payload.email,
        avatar: null
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}


