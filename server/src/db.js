import mongoose from 'mongoose';

let pending = null;

/**
 * Connects once and reuses the connection. On Netlify Functions the module stays
 * loaded between warm invocations, so later requests skip the connect entirely.
 */
export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!pending) {
    pending = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  await pending;
  return mongoose.connection;
}

export async function disconnectDB() {
  pending = null;
  await mongoose.disconnect();
}
