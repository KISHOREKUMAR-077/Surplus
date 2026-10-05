import { Router, Request, Response } from 'express';
import { db } from '../db/database';

export const claimsRouter = Router();

// POST NGO requests food donation claim (Stage 2 NGO Request)
claimsRouter.post('/donations/:id/request', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  const { ngoId, ngoName, beneficiariesTarget, notes, ngoLocation } = req.body;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedLog = [
    ...donation.traceabilityLog,
    {
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'NGO Claim Requested',
      status: 'REQUESTED' as const,
      actor: ngoName || 'NGO Community Partner',
      actorRole: 'ngo' as const,
      note: `Requested food allocation for ${beneficiariesTarget || 45} beneficiaries. Note: ${notes || 'Standard request'}`,
      location: ngoLocation?.address || 'Community Kitchen Hub',
    },
  ];

  const updated = db.updateDonation(donation.id, {
    status: 'REQUESTED',
    requestedByNGO: {
      ngoId,
      ngoName,
      requestedAt: `Today at ${timeStr}`,
      beneficiariesTarget: Number(beneficiariesTarget) || 45,
      notes,
      ngoLocation,
    },
    traceabilityLog: updatedLog,
  });

  db.addNotification({
    title: 'Donation Claim Requested',
    message: `${ngoName} requested ${donation.title} (${donation.id}) for ${beneficiariesTarget} people. Donor approval required.`,
    type: 'warning',
    targetRole: 'donor',
    donationId: donation.id,
  });

  return res.json(updated);
});

// POST Donor approves claim request
claimsRouter.post('/donations/:id/approve', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedLog = [
    ...donation.traceabilityLog,
    {
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Donor Approved Request',
      status: 'APPROVED' as const,
      actor: donation.donorName,
      actorRole: 'donor' as const,
      note: 'Donor approved the NGO claim. Donation is unlocked for volunteer delivery partner pickup.',
      location: donation.donorLocation.address,
    },
  ];

  const updated = db.updateDonation(donation.id, {
    status: 'APPROVED',
    traceabilityLog: updatedLog,
  });

  db.addNotification({
    title: 'Donation Approved for Delivery',
    message: `${donation.donorOrg} approved the request for ${donation.title} (${donation.id}). Volunteer Delivery Partners can now accept pickup!`,
    type: 'info',
    targetRole: 'delivery',
    donationId: donation.id,
  });

  return res.json(updated);
});

// POST Reject request
claimsRouter.post('/donations/:id/reject', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const reason = req.body.reason || 'Claim could not be fulfilled at this time.';

  const updatedLog = [
    ...donation.traceabilityLog,
    {
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Claim Request Cancelled / Reopened',
      status: 'AVAILABLE' as const,
      actor: 'System / Coordinator',
      actorRole: 'admin' as const,
      note: `Claim cancelled: ${reason}. Batch restored to available marketplace.`,
      location: donation.donorLocation.address,
    },
  ];

  const updated = db.updateDonation(donation.id, {
    status: 'AVAILABLE',
    requestedByNGO: undefined,
    traceabilityLog: updatedLog,
  });

  return res.json(updated);
});
