import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { calculateDistanceKm, calculateMatchingScore } from '../services/matchingEngine';

export const matchingRouter = Router();

// GET smart matching recommendations for an NGO
matchingRouter.get('/matching/recommendations', (req: Request, res: Response) => {
  const { ngoId, maxDistance = '25', category, dietaryType } = req.query;
  const maxDistNum = Number(maxDistance) || 25;

  let ngoLocation = { lat: 28.6085, lng: 77.2965 }; // Default Mayur Vihar
  let ngoCapacity = 50;

  if (ngoId && typeof ngoId === 'string') {
    const ngoUser = db.getUserById(ngoId);
    if (ngoUser && ngoUser.coordinates) {
      ngoLocation = ngoUser.coordinates;
    }
  }

  const availableDonations = db.getDonations().filter((d) => d.status === 'AVAILABLE');

  const recommendations = availableDonations
    .map((donation) => {
      const match = calculateMatchingScore(donation, ngoLocation, ngoCapacity);
      return {
        donation,
        score: match.score,
        distanceKm: match.distanceKm,
        factors: match.factors,
      };
    })
    .filter((item) => {
      if (item.distanceKm > maxDistNum) return false;
      if (category && category !== 'All' && item.donation.category !== category) return false;
      if (dietaryType && dietaryType !== 'All' && item.donation.dietaryType !== dietaryType) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);

  return res.json(recommendations);
});
