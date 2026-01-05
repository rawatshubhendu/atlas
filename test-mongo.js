const { MongoClient } = require('mongodb');

// Try alternative connection string without SSL parameter
const MONGODB_URI = 'mongodb+srv://shubhendu_rawat:Codinger%40123@cluster0.yh9vaox.mongodb.net/atlas?retryWrites=true&w=majority';

async function testConnection() {
  console.log('Testing MongoDB Atlas connection...');
  
  // Simplified connection options to avoid SSL issues
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority'
  });

  try {
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db('atlas');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
  }
}

testConnection();
