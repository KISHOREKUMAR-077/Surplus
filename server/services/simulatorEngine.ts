import { db } from '../db/database';
import { UserProfile } from '../../src/types';

export interface SimulationResult {
  mealCount: number;
  kgEstimated: number;
  peopleFed: number;
  co2AvoidedKg: number;
  waterSavedLiters: number;
  valueRecoveredInr: number;
  transportVehicle: string;
  transportReason: string;
  capableNgos: UserProfile[];
}

export function simulateSurplusRedistribution(mealCount: number): SimulationResult {
  const count = Math.max(1, Math.min(2000, Number(mealCount) || 45));
  const kgEstimated = Math.round(count * 0.45 * 10) / 10;
  const peopleFed = Math.round(count * 1.1);
  const co2AvoidedKg = Math.round(kgEstimated * 2.45);
  const waterSavedLiters = Math.round(count * 380);
  const valueRecoveredInr = count * 85;

  let transportVehicle = 'Bicycle Courier';
  let transportReason = 'Ideal for nimble zero-emission neighborhood drops (< 15 kg)';
  if (kgEstimated > 40) {
    transportVehicle = 'Cargo EV Van';
    transportReason = 'Recommended for bulk trays and heavy catering cambros (> 40 kg)';
  } else if (kgEstimated > 15) {
    transportVehicle = 'E-Bike Delivery Cargo';
    transportReason = 'Optimal for 15-40 kg insulated thermal crates with fast city transit';
  }

  const allUsers = Object.values(db.getUsers());
  const capableNgos = allUsers.filter((u) => u.role === 'ngo');

  return {
    mealCount: count,
    kgEstimated,
    peopleFed,
    co2AvoidedKg,
    waterSavedLiters,
    valueRecoveredInr,
    transportVehicle,
    transportReason,
    capableNgos,
  };
}
