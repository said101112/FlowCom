import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { corsOrigins } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/auth', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}