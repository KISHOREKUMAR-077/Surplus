import { DonationItem } from '../../src/types';

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

export interface MatchingScoreResult {
  score: number;
  distanceKm: number;
  factors: {
    proximityScore: number;
    capacityScore: number;
    freshnessScore: number;
    categoryScore: number;
  };
}

export function calculateMatchingScore(
  donation: DonationItem,
  ngoLocation: { lat: number; lng: number },
  ngoCapacity: number = 50
): MatchingScoreResult {
  const dist = calculateDistanceKm(
    donation.donorLocation.lat,
    donation.donorLocation.lng,
    ngoLocation.lat,
    ngoLocation.lng
  );

  // Proximity (40% weight): Closer is higher. Under 3km = 100%, 15km = 20%
  const proximityScore = Math.max(0, Math.min(100, Math.round(100 - (dist / 15) * 80)));

  // Capacity / Quantity fit (25% weight)
  const qty = donation.quantity;
  const ratio = Math.min(qty, ngoCapacity) / Math.max(qty, ngoCapacity);
  const capacityScore = Math.round(ratio * 100);

  // Freshness & Condition (20% weight)
  let freshnessScore = 95;
  if (donation.donorScreening.condition === 'Fresh') freshnessScore = 98;
  else if (donation.donorScreening.condition === 'Moderately Fresh') freshnessScore = 80;
  else if (donation.donorScreening.condition === 'Near Expiry') freshnessScore = 65;
  else freshnessScore = 10;

  // Category fit (15% weight)
  const categoryScore = 95;

  const totalScore = Math.round(
    proximityScore * 0.4 +
      capacityScore * 0.25 +
      freshnessScore * 0.2 +
      categoryScore * 0.15
  );

  return {
    score: Math.min(99, Math.max(30, totalScore)),
    distanceKm: dist,
    factors: {
      proximityScore,
      capacityScore,
      freshnessScore,
      categoryScore,
    },
  };
}
