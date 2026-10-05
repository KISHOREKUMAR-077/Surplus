import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const bootstrapRouter = Router();

// GET all data needed for application initialization
bootstrapRouter.get('/bootstrap', (_req: Request, res: Response) => {
  return res.json({
    donations: db.getDonations(),
    users: db.getUsers(),
    notifications: db.getNotifications(),
    currentUser: db.getActiveUser(),
  });
});
