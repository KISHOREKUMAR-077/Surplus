import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { AIScreeningResult } from '../../src/types';

export const deliveryRouter = Router();

// GET available delivery tasks (approved donations ready for dispatch)
deliveryRouter.get('/deliveries/available', (_req: Request, res: Response) => {
  const deliveries = db
    .getDonations()
    .filter((d) => d.status === 'APPROVED' && !d.assignedDeliveryPartner);
  return res.json(deliveries);
});

// POST delivery partner accepts task
deliveryRouter.post('/donations/:id/accept-delivery', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  const { partnerId, partnerName, partnerPhone, vehicleType } = req.body;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedLog = [
    ...donation.traceabilityLog,
    {
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Delivery Partner Assigned',
      status: 'DELIVERY_PARTNER_ASSIGNED' as const,
      actor: `${partnerName || 'Volunteer Rider'} (${vehicleType || 'E-Bike'})`,
      actorRole: 'delivery' as const,
      note: 'Delivery partner accepted task. En route to donor kitchen for Stage 2 camera inspection.',
      location: donation.donorLocation.address,
    },
  ];

  const updated = db.updateDonation(donation.id, {
    status: 'DELIVERY_PARTNER_ASSIGNED',
    assignedDeliveryPartner: {
      partnerId: partnerId || 'delivery_1',
      partnerName: partnerName || 'Amit Verma',
      partnerPhone: partnerPhone || '+91 99102 88471',
      vehicleType: vehicleType || 'E-Bike',
      assignedAt: `Today at ${timeStr}`,
      transitProgress: 5,
      currentCoordinates: {
        lat: donation.donorLocation.lat - 0.005,
        lng: donation.donorLocation.lng - 0.005,
      },
    },
    traceabilityLog: updatedLog,
  });

  db.addNotification({
    title: 'Delivery Partner En Route to Pickup',
    message: `${partnerName || 'Volunteer'} (${vehicleType || 'E-Bike'}) accepted ${donation.id} and is heading to ${donation.donorOrg}.`,
    type: 'info',
    targetRole: 'all',
    donationId: donation.id,
  });

  return res.json(updated);
});

// POST Stage 2 Pickup Camera Verification by delivery partner
deliveryRouter.post('/donations/:id/verify-pickup', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation || !donation.assignedDeliveryPartner) {
    return res.status(404).json({ error: 'Donation or assigned delivery partner not found' });
  }

  const screening: AIScreeningResult = req.body.screening;
  if (!screening) {
    return res.status(400).json({ error: 'Screening result is required' });
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedLog = [
    ...donation.traceabilityLog,
    {
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Stage 2 Pickup Camera Verification',
      status: 'COLLECTED' as const,
      actor: `${donation.assignedDeliveryPartner.partnerName} (Delivery Partner)`,
      actorRole: 'delivery' as const,
      note: `Pickup verified via on-site camera screening: Condition "${screening.condition}" (${Math.round(screening.confidence * 100)}%). Food containers secured in transit bag.`,
      location: donation.donorLocation.address,
      photoUrl: screening.imageUrl,
    },
  ];

  const updated = db.updateDonation(donation.id, {
    status: 'COLLECTED',
    assignedDeliveryPartner: {
      ...donation.assignedDeliveryPartner,
      pickupTime: `Today at ${timeStr}`,
      pickupScreening: screening,
      transitProgress: 25,
    },
    traceabilityLog: updatedLog,
  });

  db.addNotification({
    title: 'Food Collected & Verified',
    message: `Pickup confirmed for ${donation.title} (${donation.id}). Stage 2 camera check verified food condition "${screening.condition}".`,
    type: 'success',
    targetRole: 'all',
    donationId: donation.id,
  });

  return res.json(updated);
});

// PUT update live transit progress
deliveryRouter.put('/donations/:id/transit-progress', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation || !donation.assignedDeliveryPartner) {
    return res.status(404).json({ error: 'Donation or delivery partner not found' });
  }

  const { progress = 25, currentCoordinates } = req.body;
  const numProgress = Math.max(0, Math.min(100, Number(progress)));
  const partner = donation.assignedDeliveryPartner;

  let newStatus = donation.status;
  const updatedLog = [...donation.traceabilityLog];

  if (numProgress > 25 && numProgress < 100) {
    newStatus = 'IN_TRANSIT';
  } else if (numProgress >= 100) {
    newStatus = 'DELIVERED';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    partner.deliveryTime = `Today at ${timeStr}`;

    updatedLog.push({
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Food Delivered at NGO Hub',
      status: 'DELIVERED' as const,
      actor: partner.partnerName,
      actorRole: 'delivery' as const,
      note: `Arrived at destination (${donation.requestedByNGO?.ngoName || 'NGO'}). Handed over for Stage 3 final inspection.`,
      location: donation.requestedByNGO?.ngoLocation.address || 'NGO Distribution Center',
    });

    db.addNotification({
      title: 'Food Arrived at Destination',
      message: `${donation.title} (${donation.id}) arrived at ${donation.requestedByNGO?.ngoName}. Awaiting Stage 3 final receiver verification.`,
      type: 'info',
      targetRole: 'ngo',
      donationId: donation.id,
    });
  }

  const updated = db.updateDonation(donation.id, {
    status: newStatus,
    assignedDeliveryPartner: {
      ...partner,
      transitProgress: numProgress,
      currentCoordinates: currentCoordinates || partner.currentCoordinates,
    },
    traceabilityLog: updatedLog,
  });

  return res.json(updated);
});
