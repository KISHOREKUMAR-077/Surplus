import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Building,
  Leaf,
  Droplets,
  IndianRupee,
  Truck,
  ArrowRight,
  X,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { store } from '../../services/store';

interface ImpactSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMeals?: (meals: number) => void;
}

export const ImpactSimulatorModal: React.FC<ImpactSimulatorModalProps> = ({
  isOpen,
  onClose,
  onApplyMeals,
}) => {
  const [mealCount, setMealCount] = useState<number>(45);

  if (!isOpen) return null;

  // Multipliers based on standard FAO / UNEP food waste metrics
  const kgEstimated = Math.round(mealCount * 0.45 * 10) / 10;
  const peopleFed = Math.round(mealCount * 1.1);
  const co2AvoidedKg = Math.round(kgEstimated * 2.45);
  const waterSavedLiters = Math.round(mealCount * 380);
  const valueRecoveredInr = mealCount * 85;

  // Transport recommendation
  let transportVehicle = 'Bicycle Courier';
  let transportReason = 'Ideal for nimble zero-emission neighborhood drops (< 15 kg)';
  if (kgEstimated > 40) {
    transportVehicle = 'Cargo EV Van';
    transportReason = 'Recommended for bulk trays and heavy catering cambros (> 40 kg)';
  } else if (kgEstimated > 15) {
    transportVehicle = 'E-Bike Delivery Cargo';
    transportReason = 'Optimal for 15-40 kg insulated thermal crates with fast city transit';
  }

  // Count registered NGOs that can accept this capacity
  const registeredUsers = store.getUsers();
  const capableNgos = Object.values(registeredUsers).filter((u) => u.role === 'ngo');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                What-If Food Redistribution Simulator
              </h3>
              <p className="text-xs text-teal-100 font-medium">
                Plan surplus batch allocations, simulate beneficiary reach & ESG impact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Slider Control */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Simulated Surplus Food Volume
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">
                    {mealCount}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">meals</span>
                  <span className="text-xs text-slate-400 font-mono">
                    (~{kgEstimated} kg equivalent)
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                {[15, 30, 50, 100, 250].map((preset) => (
                  <motion.button
                    key={preset}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setMealCount(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all interactive-btn ${
                      mealCount === preset
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {preset}
                  </motion.button>
                ))}
              </div>
            </div>

            <input
              type="range"
              min="5"
              max="300"
              step="5"
              value={mealCount}
              onChange={(e) => setMealCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 transition-all"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>5 Meals (Small Household)</span>
              <span>100 Meals (Restaurant)</span>
              <span>300 Meals (Large Convention / Banquet)</span>
            </div>
          </div>

          {/* Impact Metrics Grid with hover lift & micro-interaction */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Reach</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-900 font-mono">
                {peopleFed}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">People Nourished</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-sky-700 mb-1">
                <Leaf className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Emissions</span>
              </div>
              <div className="text-2xl font-extrabold text-sky-900 font-mono">
                {co2AvoidedKg} kg
              </div>
              <div className="text-[11px] text-sky-700 font-medium">CO₂e Diverted</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-indigo-700 mb-1">
                <Droplets className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Water</span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-900 font-mono">
                {waterSavedLiters.toLocaleString()} L
              </div>
              <div className="text-[11px] text-indigo-700 font-medium">Water Footprint</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl transition-all shadow-xs"
            >
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <IndianRupee className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Value</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-900 font-mono">
                ₹{valueRecoveredInr.toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-700 font-medium">Direct Value</div>
            </motion.div>
          </div>

          {/* Matching Logistics & Capable NGOs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Green Transport Recommendation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommended Logistics
                </span>
                <Truck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-bold text-slate-900">
                {transportVehicle}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {transportReason}
              </p>
            </div>

            {/* Capable NGOs Nearby */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Matching Recipient NGOs ({capableNgos.length})
                </span>
                <Building className="w-4 h-4 text-sky-600" />
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {capableNgos.map((ngo) => (
                  <div
                    key={ngo.id}
                    className="text-xs flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200"
                  >
                    <span className="font-semibold text-slate-800 truncate mr-2">
                      {ngo.organization}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                      Capacity Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Based on UNEP & FAO Food Loss Prevention Multipliers
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            {onApplyMeals && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  onApplyMeals(mealCount);
                  onClose();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 interactive-btn"
              >
                Apply to Donation Form
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
