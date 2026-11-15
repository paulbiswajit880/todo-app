// Runs the API against a throwaway in-memory MongoDB, for trying the app
// without an Atlas account. Data is lost when the process stops.
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('todo');
console.log('In-memory MongoDB started (data is not saved).');

const stop = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

await import('./index.js');
