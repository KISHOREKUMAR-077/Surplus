import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { UserRole } from '../../src/types';

export const notificationsRouter = Router();

// GET notifications
notificationsRouter.get('/notifications', (req: Request, res: Response) => {
  const role = req.query.role as UserRole | undefined;
  let notifs = db.getNotifications();

  if (role) {
    notifs = notifs.filter((n) => n.targetRole === 'all' || n.targetRole === role);
  }

  return res.json(notifs);
});

// PUT mark single notification read
notificationsRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  return res.json({ success });
});

// PUT mark all notifications read
notificationsRouter.put('/notifications/read-all', (_req: Request, res: Response) => {
  db.markAllNotificationsRead();
  return res.json({ success: true });
});

// POST dispatch custom notification
notificationsRouter.post('/notifications', (req: Request, res: Response) => {
  const { title, message, type = 'info', targetRole = 'all', donationId } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const newNotif = db.addNotification({
    title,
    message,
    type,
    targetRole,
    donationId,
  });

  return res.status(201).json(newNotif);
});
