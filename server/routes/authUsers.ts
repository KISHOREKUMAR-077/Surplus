import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { UserRole } from '../../src/types';

export const authUsersRouter = Router();

// GET all users (optionally filtered by role)
authUsersRouter.get('/users', (req: Request, res: Response) => {
  const role = req.query.role as UserRole | undefined;
  const users = Object.values(db.getUsers());

  if (role) {
    return res.json(users.filter((u) => u.role === role));
  }
  return res.json(users);
});

// GET active/current user
authUsersRouter.get('/users/current', (_req: Request, res: Response) => {
  return res.json(db.getActiveUser());
});

// POST switch active user
authUsersRouter.post('/users/switch', (req: Request, res: Response) => {
  const { userId, role } = req.body;

  if (userId) {
    const success = db.setActiveUser(userId);
    if (success) {
      return res.json({ success: true, user: db.getActiveUser() });
    }
  }

  if (role) {
    const users = Object.values(db.getUsers());
    const match = users.find((u) => u.role === role);
    if (match) {
      db.setActiveUser(match.id);
      return res.json({ success: true, user: match });
    }
  }

  return res.status(400).json({ error: 'User or role not found' });
});

// PUT update user profile
authUsersRouter.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateUser(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(updated);
});
