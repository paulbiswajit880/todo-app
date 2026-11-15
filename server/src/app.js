import cors from 'cors';
import express from 'express';
import { connectDB } from './db.js';
import { HttpError, errorHandler, notFound } from './middleware/errors.js';
import taskRoutes from './routes/tasks.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Same-origin on Netlify; CORS_ORIGIN (comma-separated) restricts it when the API is hosted apart.
  app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.get('/health', (req, res) => res.json({ ok: true }));

  // Connect lazily, so the same app works in a local server and a serverless function.
  api.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      console.error('Database connection failed:', err.message);
      next(new HttpError(503, 'Database unavailable, please try again'));
    }
  });

  api.use('/tasks', taskRoutes);

  // "/api/*" locally; Netlify may hand the function its own path instead.
  app.use(['/api', '/.netlify/functions/api'], api);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
