import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { authUsersRouter } from './routes/authUsers';
import { donationsRouter } from './routes/donations';
import { screeningRouter } from './routes/screening';
import { matchingRouter } from './routes/matching';
import { claimsRouter } from './routes/claims';
import { deliveryRouter } from './routes/delivery';
import { verificationRouter } from './routes/verification';
import { notificationsRouter } from './routes/notifications';
import { membershipsRouter } from './routes/memberships';
import { simulatorRouter } from './routes/simulator';
import { adminRouter } from './routes/admin';
import { bootstrapRouter } from './routes/bootstrap';

dotenv.config();

export const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SLAstice AI Food Redistribution Platform Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', authUsersRouter);
app.use('/api', donationsRouter);
app.use('/api', screeningRouter);
app.use('/api', matchingRouter);
app.use('/api', claimsRouter);
app.use('/api', deliveryRouter);
app.use('/api', verificationRouter);
app.use('/api', notificationsRouter);
app.use('/api', membershipsRouter);
app.use('/api', simulatorRouter);
app.use('/api', adminRouter);
app.use('/api', bootstrapRouter);

// Production Static Serving for Render / Unified Deployments
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));

  // SPA fallback for frontend client routing
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// 404 for unhandled API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});
