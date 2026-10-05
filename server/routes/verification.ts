import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { AIScreeningResult, FoodCondition } from '../../src/types';

export const verificationRouter = Router();

// POST Stage 3 Final Receiver Verification (Completed by NGO receiving lead)
verificationRouter.post('/donations/:id/verify-receiver', (req: Request, res: Response) => {
  const donation = db.getDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  const {
    receiverName = 'Receiving Lead',
    verifiedQuantity = donation.quantity,
    conditionAccepted = 'Fresh' as FoodCondition,
    screening,
    remarks = 'Verified and distributed to beneficiaries',
  } = req.body;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updatedLog = [
    ...donation.traceabilityLog,
    {
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Stage 3 Final Receiver Verification & Complete',
      status: 'COMPLETED' as const,
      actor: `${receiverName} (${donation.requestedByNGO?.ngoName || 'Receiver'})`,
      actorRole: 'ngo' as const,
      note: `Final physical & visual verification completed. Accepted ${verifiedQuantity} ${donation.unit}. Condition: "${conditionAccepted}". Remarks: ${remarks}`,
      location: donation.requestedByNGO?.ngoLocation.address || 'NGO Distribution Center',
      photoUrl: (screening as AIScreeningResult | undefined)?.imageUrl,
    },
  ];

  const updated = db.updateDonation(donation.id, {
    status: 'COMPLETED',
    receiverVerification: {
      verifiedAt: `Today at ${timeStr}`,
      receiverName,
      verifiedQuantity: Number(verifiedQuantity),
      conditionAccepted,
      screening,
      remarks,
    },
    traceabilityLog: updatedLog,
  });

  db.addNotification({
    title: 'Donation Completed & Traceability Closed',
    message: `Donation ${donation.id} successfully completed! ${verifiedQuantity} ${donation.unit} distributed to beneficiaries. ESG impact recorded.`,
    type: 'success',
    targetRole: 'all',
    donationId: donation.id,
  });

  return res.json(updated);
});
