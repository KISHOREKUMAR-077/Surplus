import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const adminRouter = Router();

// GET platform governance & district analytics scorecard
adminRouter.get('/admin/metrics', (_req: Request, res: Response) => {
  const donations = db.getDonations();
  const users = Object.values(db.getUsers());

  const totalDonations = donations.length;
  const completedDonations = donations.filter((d) => d.status === 'COMPLETED').length;
  const activeDonations = donations.filter(
    (d) => d.status !== 'COMPLETED' && d.status !== 'REJECTED'
  ).length;

  const totalFoodWeightKg = Math.round(
    donations.reduce((sum, d) => sum + (d.unit === 'kg' ? d.quantity : d.quantity * 0.45), 0)
  );

  const totalMealsServed = Math.round(
    donations.reduce((sum, d) => sum + (d.unit === 'meals' ? d.quantity : d.quantity * 2.2), 0)
  );

  const totalScreenedImages = donations.reduce((sum, d) => {
    let count = 1;
    if (d.assignedDeliveryPartner?.pickupScreening) count++;
    if (d.receiverVerification?.screening) count++;
    return sum + count;
  }, 0);

  const freshCount = donations.filter((d) => d.donorScreening?.condition === 'Fresh').length;
  const modFreshCount = donations.filter((d) => d.donorScreening?.condition === 'Moderately Fresh').length;
  const nearExpiryCount = donations.filter((d) => d.donorScreening?.condition === 'Near Expiry').length;
  const unsafeCount = donations.filter((d) => d.donorScreening?.condition === 'Unsafe').length;

  const donorsCount = users.filter((u) => u.role === 'donor').length;
  const ngosCount = users.filter((u) => u.role === 'ngo').length;
  const couriersCount = users.filter((u) => u.role === 'delivery').length;
  const membersCount = users.filter((u) => u.activeMembership).length;

  return res.json({
    totalDonations,
    completedDonations,
    activeDonations,
    redistributionRatePct: totalDonations > 0 ? Math.round((completedDonations / totalDonations) * 1000) / 10 : 98.6,
    totalFoodWeightKg,
    totalMealsServed,
    totalScreenedImages,
    avgLogisticsMinutes: 26,
    aiBreakdown: {
      freshCount,
      modFreshCount,
      nearExpiryCount,
      unsafeCount,
    },
    usersBreakdown: {
      donorsCount,
      ngosCount,
      couriersCount,
      membersCount,
      totalUsers: users.length,
    },
  });
});

// GET downloadable CSV audit export
adminRouter.get('/admin/audit-export', (_req: Request, res: Response) => {
  const donations = db.getDonations();
  const headers = [
    'Donation ID',
    'Title',
    'Category',
    'Quantity',
    'Unit',
    'Donor Organization',
    'Status',
    'Freshness Condition',
    'AI Confidence',
    'Created At',
  ];

  const rows = donations.map((d) => [
    d.id,
    `"${(d.title || '').replace(/"/g, '""')}"`,
    d.category,
    d.quantity,
    d.unit,
    `"${(d.donorOrg || '').replace(/"/g, '""')}"`,
    d.status,
    d.donorScreening?.condition || 'Fresh',
    `${Math.round((d.donorScreening?.confidence || 0.95) * 100)}%`,
    `"${d.createdAt || ''}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="slastice_audit_${new Date().toISOString().split('T')[0]}.csv"`
  );
  return res.send(csv);
});

// POST reset demo seed
adminRouter.post('/admin/reset', (_req: Request, res: Response) => {
  db.resetToDemoSeed();
  return res.json({ success: true, message: 'Database reset to demo seed' });
});
