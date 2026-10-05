import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { MEMBERSHIP_PLANS } from '../../src/services/initialData';

export const membershipsRouter = Router();

// GET all membership plans
membershipsRouter.get('/memberships/plans', (_req: Request, res: Response) => {
  return res.json(MEMBERSHIP_PLANS);
});

// POST subscribe / activate membership plan
membershipsRouter.post('/memberships/subscribe', (req: Request, res: Response) => {
  const { userId, planId } = req.body;

  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return res.status(400).json({ error: 'Invalid membership plan ID' });
  }

  const user = db.getUserById(userId) || db.getActiveUser();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const today = new Date();
  const expiry = new Date();
  expiry.setMonth(today.getMonth() + plan.periodMonths);

  const activeMembership = {
    planId: plan.id,
    planName: plan.name,
    startedAt: today.toISOString().split('T')[0],
    expiresAt: expiry.toISOString().split('T')[0],
    daysRemaining: plan.periodMonths * 30,
    price: plan.price,
  };

  const updatedUser = db.updateUser(user.id, { activeMembership });

  db.addNotification({
    title: 'SLAstice Membership Activated!',
    message: `Congratulations! ${plan.name} is now active for ${user.organization}. Enjoy priority matching and CSR certificates.`,
    type: 'success',
    targetRole: 'donor',
  });

  return res.json({
    success: true,
    user: updatedUser,
    activeMembership,
    receipt: {
      transactionId: `TXN-SLA-${Date.now()}`,
      amountInr: plan.price,
      csrCertificateEligible: true,
      timestamp: new Date().toISOString(),
    },
  });
});
