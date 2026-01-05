import mongoose from 'mongoose';

// User mongoose schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 50,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'email';
    },
    minLength: 8
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  profilePicture: {
    type: String,
    default: null
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxLength: 500,
    default: ''
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Create indexes (email and googleId are already unique in schema, so only create additional indexes)
UserSchema.index({ createdAt: -1 });
UserSchema.index({ provider: 1 });

// Export the model
const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;

// Simplified validation function for better performance
export function validateUser(userData) {
  const errors = [];
  
  // Basic validation only
  if (!userData.name?.trim() || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!userData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email.trim())) {
    errors.push('Please provide a valid email address');
  }
  
  if (userData.provider === 'email' && (!userData.password || userData.password.length < 6)) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeUser(userData) {
  return {
    name: userData.name?.trim(),
    email: userData.email?.trim().toLowerCase(),
    password: userData.password,
    provider: userData.provider || 'email',
    googleId: userData.googleId || null,
    profilePicture: userData.profilePicture || null,
    isGoogleUser: userData.isGoogleUser || false,
    avatar: userData.avatar || null,
    bio: userData.bio?.trim() || '',
    isVerified: userData.isVerified || false,
    createdAt: userData.createdAt || new Date(),
    updatedAt: new Date()
  };
}

// Create indexes for MongoDB
export const UserIndexes = [
  { email: 1 }, // Unique index on email
  { createdAt: -1 }, // Index for sorting by creation date
  { provider: 1 } // Index for provider queries
];
