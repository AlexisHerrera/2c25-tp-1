import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(connectionString, {
      dbName: process.env.DB_NAME || 'exchange-service'
    });

    isConnected = true;
    console.log('Connected to MongoDB Atlas');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('Database connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Database disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('Database reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('Error connecting to database:', error);
    isConnected = false;
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB Atlas');
  }
}

export function getDatabaseConnectionStatus() {
  return isConnected;
}