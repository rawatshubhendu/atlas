import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/lib/models/User';

export async function PUT(req) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json({ success: false, message: 'Database connection unavailable' }, { status: 503 });
    }

    const body = await req.json();
    const { currentEmail, name, email, avatar, password } = body || {};

    // Input validation
    if (!currentEmail || typeof currentEmail !== 'string') {
      return NextResponse.json({ success: false, message: 'Valid currentEmail is required' }, { status: 400 });
    }

    const normalizedCurrentEmail = currentEmail.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedCurrentEmail)) {
      return NextResponse.json({ success: false, message: 'Invalid current email format' }, { status: 400 });
    }

    console.log('Looking for user with email:', normalizedCurrentEmail);

    // Multiple lookup strategies for robustness
    let user = null;
    
    // Strategy 1: Exact match (case-insensitive)
    user = await User.findOne({ email: new RegExp(`^${normalizedCurrentEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    
    // Strategy 2: Try with trimmed email
    if (!user) {
      const trimmedEmail = normalizedCurrentEmail.trim();
      user = await User.findOne({ email: new RegExp(`^${trimmedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }
    
    // Strategy 3: Try exact match without normalization (in case email wasn't normalized in DB)
    if (!user) {
      user = await User.findOne({ email: currentEmail });
    }
    
    // Strategy 4: Try with original email (case-sensitive exact match)
    if (!user) {
      user = await User.findOne({ email: currentEmail.trim() });
    }

    if (!user) {
      console.error('User not found for email:', normalizedCurrentEmail);
      console.error('Original email provided:', currentEmail);
      
      // Don't expose database contents in production
      if (process.env.NODE_ENV === 'development') {
        const sampleUsers = await User.find({}, { email: 1, name: 1 }).limit(5);
        console.log('Sample users in DB:', sampleUsers.map(u => ({ email: u.email, name: u.name })));
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'User not found. Please check your email address.' 
      }, { status: 404 });
    }

    console.log('Found user:', { email: user.email, name: user.name });

    let hasChanges = false;

    // Update email if provided and different
    if (email && typeof email === 'string') {
      const normalizedNewEmail = email.toLowerCase().trim();

      if (!emailRegex.test(normalizedNewEmail)) {
        return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
      }

      if (normalizedNewEmail !== user.email) {
        const exists = await User.findOne({ email: normalizedNewEmail });
        if (exists) {
          return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 409 });
        }
        user.email = normalizedNewEmail;
        hasChanges = true;
      }
    }

    // Update name if provided
    if (name !== undefined && typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length > 0 && trimmedName.length <= 100) {
        user.name = trimmedName;
        hasChanges = true;
      } else if (trimmedName.length > 100) {
        return NextResponse.json({ success: false, message: 'Name must be 100 characters or less' }, { status: 400 });
      }
    }

    // Update avatar if provided
    if (avatar !== undefined && typeof avatar === 'string') {
      // Validate URL format if avatar is provided
      if (avatar.trim()) {
        try {
          new URL(avatar.trim());
          user.avatar = avatar.trim();
          user.profilePicture = avatar.trim();
          hasChanges = true;
        } catch {
          return NextResponse.json({ success: false, message: 'Invalid avatar URL format' }, { status: 400 });
        }
      } else {
        // Allow clearing avatar
        user.avatar = '';
        user.profilePicture = '';
        hasChanges = true;
      }
    }

    // Update password if provided
    if (password !== undefined && typeof password === 'string') {
      if (password.length === 0) {
        // Allow clearing password requirement
      } else if (password.length < 6) {
        return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
      } else if (password.length > 128) {
        return NextResponse.json({ success: false, message: 'Password must be 128 characters or less' }, { status: 400 });
      } else {
        const hashed = await bcrypt.hash(password, 12);
        user.password = hashed;
        hasChanges = true;
      }
    }

    // Only save if there are actual changes
    if (hasChanges) {
      user.updatedAt = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null
      },
      changed: hasChanges
    });
  } catch (err) {
    console.error('PUT /api/users/update error', err);

    // Handle specific MongoDB errors
    if (err.code === 11000) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 });
    }

    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
  }
}


