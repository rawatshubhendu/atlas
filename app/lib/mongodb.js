import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If no MONGODB_URI, return null (graceful fallback)
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not configured - running in development mode');
    return null;
  }

  // If already connected, return cached connection
  if (cached.conn) {
    return cached.conn;
  }

  // If connection attempt is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected');
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB Connection Error:', {
        message: err.message,
        code: err.code,
        name: err.name,
        reason: err.reason?.message || 'Unknown'
      });
      
      // Clear the promise so we can retry later
      cached.promise = null;
      
      // Log helpful error message based on error type
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        console.error('\n🔧 TROUBLESHOOTING STEPS:');
        console.error('1. Check MongoDB Atlas Dashboard: https://cloud.mongodb.com/');
        console.error('2. Verify cluster is running (not paused)');
        console.error('3. Check IP whitelist in Network Access');
        console.error('4. Verify connection string in .env.local file');
        console.error('5. Test connection: node test-mongo.js\n');
      } else if (err.code === 8000 || err.message?.includes('bad auth') || err.message?.includes('authentication failed')) {
        console.error('\n🔧 AUTHENTICATION ERROR - TROUBLESHOOTING:');
        console.error('1. Verify MongoDB username and password in connection string');
        console.error('2. Check if password contains special characters (must be URL-encoded)');
        console.error('3. Verify database user exists in MongoDB Atlas');
        console.error('4. Check connection string format: mongodb+srv://username:password@cluster.net/database?retryWrites=true&w=majority');
        console.error('5. Ensure password is URL-encoded (e.g., @ becomes %40)');
        console.error('6. Test connection: node test-mongo.js\n');
      }
      
      // Don't throw - return null for graceful fallback
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    // Return null instead of throwing
    return null;
  }

  return cached.conn;
}

export default connectDB;
