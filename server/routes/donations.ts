import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { DonationItem } from '../../src/types';

export const donationsRouter = Router();

// GET all donations with query filtering
donationsRouter.get('/donations', (req: Request, res: Response) => {
  let list = db.getDonations();
  const { status, donorId, category, dietaryType } = req.query;

  if (status) {
    list = list.filter((d) => d.status === status);
  }
  if (donorId) {
    list = list.filter((d) => d.donorId === donorId);
  }
  if (category && category !== 'All') {
    list = list.filter((d) => d.category === category);
  }
  if (dietaryType && dietaryType !== 'All') {
    list = list.filter((d) => d.dietaryType === dietaryType);
  }

  return res.json(list);
});

// GET single donation
donationsRouter.get('/donations/:id', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }
  return res.json(donation);
});

// GET donation traceability chain of custody
donationsRouter.get('/donations/:id/traceability', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }
  return res.json({
    id: donation.id,
    title: donation.title,
    status: donation.status,
    traceabilityLog: donation.traceabilityLog,
  });
});

// POST create donation (Stage 1)
donationsRouter.post('/donations', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.title || !data.quantity) {
      return res.status(400).json({ error: 'Title and quantity are required' });
    }

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toISOString().split('T')[0];
    const totalDonations = db.getDonations().length;
    const serial = String(totalDonations + 101).padStart(5, '0');
    const newId = `SLA-DON-${dateStr.slice(0, 4)}-${serial}`;

    const newDonation: DonationItem = {
      ...data,
      id: newId,
      status: 'AVAILABLE',
      createdAt: `${dateStr} ${timestampStr}`,
      traceabilityLog: [
        {
          id: `trc_${Date.now()}_1`,
          timestamp: `${dateStr} ${timestampStr}`,
          stage: 'Donation Created & Stage 1 Visual Screening',
          status: 'AVAILABLE',
          actor: `${data.donorName || 'Donor'} (${data.donorOrg || 'Food Donor'})`,
          actorRole: 'donor',
          note: `Listed ${data.quantity} ${data.unit || 'kg'} of ${data.title}. AI visual screening verified "${data.donorScreening?.condition || 'Fresh'}" (${Math.round((data.donorScreening?.confidence || 0.95) * 100)}% confidence).`,
          location: data.donorLocation?.address || 'Donor Kitchen Hub',
          photoUrl: data.foodImage,
        },
      ],
    };

    db.insertDonation(newDonation);

    db.addNotification({
      title: 'New Food Donation Published',
      message: `${newDonation.donorOrg} listed ${newDonation.quantity} ${newDonation.unit} of ${newDonation.title} (${newDonation.id}). Ready for nearby NGO matching!`,
      type: 'success',
      targetRole: 'all',
      donationId: newId,
    });

    return res.status(201).json(newDonation);
  } catch (err) {
    console.error('[API] Create donation error:', err);
    return res.status(500).json({ error: 'Failed to create donation' });
  }
});
