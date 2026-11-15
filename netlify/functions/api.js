// The Express API as one Netlify Function. netlify.toml rewrites /api/* here.
import serverless from 'serverless-http';
import { createApp } from '../../server/src/app.js';

const run = serverless(createApp());

export const handler = async (event, context) => {
  // Return as soon as the response is ready; the open MongoDB connection is reused next time.
  context.callbackWaitsForEmptyEventLoop = false;
  return run(event, context);
};
