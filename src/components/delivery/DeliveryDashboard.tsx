import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Camera,
  ArrowRight,
  Eye,
  Check,
  Package,
  Award,
  Bike,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { AIScreeningResult, DonationItem } from '../../types';
import { motion } from 'motion/react';
import { calculateDistanceKm, store } from '../../services/store';
import { CameraFoodModal } from '../verification/CameraFoodModal';
import { TraceabilityModal } from '../traceability/TraceabilityModal';

export const DeliveryDashboard: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const allDonations = store.getDonations();

  // Donations ready for delivery partner pickup
  const availableDeliveries = allDonations.filter(
    (d) => d.status === 'APPROVED' && !d.assignedDeliveryPartner
  );

  // Deliveries assigned to current partner
  const myAssignedDeliveries = allDonations.filter(
    (d) =>
      d.assignedDeliveryPartner?.partnerId === currentUser.id ||
      d.assignedDeliveryPartner?.partnerName === currentUser.name
  );

  const activeDeliveries = myAssignedDeliveries.filter(
    (d) => d.status !== 'COMPLETED' && d.status !== 'REJECTED'
  );

  const completedDeliveries = myAssignedDeliveries.filter((d) => d.status === 'COMPLETED');

  // Modals & Active Operation State
  const [selectedTraceDonation, setSelectedTraceDonation] = useState<DonationItem | null>(null);
  const [stage2Donation, setStage2Donation] = useState<DonationItem | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [vehicleType, setVehicleType] = useState<'Bicycle' | 'E-Bike' | 'Motorcycle' | 'Cargo Van'>('E-Bike');

  const handleAcceptDelivery = (donationId: string) => {
    store.acceptDeliveryTask(donationId, {
      partnerId: currentUser.id,
      partnerName: currentUser.name,
      partnerPhone: currentUser.phone,
      vehicleType,
    });
  };

  const handleStartPickupCamera = (donation: DonationItem) => {
    setStage2Donation(donation);
    setIsCameraOpen(true);
  };

  const handlePickupScreeningComplete = (result: AIScreeningResult) => {
    if (stage2Donation) {
      store.verifyPickup(stage2Donation.id, result);
      setStage2Donation(null);
    }
  };

  const handleSimulateAdvanceTransit = (donationId: string, currentProgress: number = 25) => {
    const nextProgress = Math.min(100, currentProgress + 25);
    store.updateTransit(donationId, nextProgress);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur border border-white/20">
                Delivery Partner Mission Control
              </span>
              <span className="text-xs text-amber-200">
                ✓ Green Fleet Certified
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Roll, {currentUser.name}
            </h2>
            <p className="text-sm text-amber-100 font-medium leading-relaxed">
              Voluntarily transport approved surplus food from donors to receiving NGOs. Perform Stage 2 camera verification at pickup to guarantee food safety in transit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-amber-200 font-medium">Deliveries Available</span>
              <div className="text-3xl font-black font-mono mt-0.5 text-white">
                {availableDeliveries.length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-emerald-200 font-medium">Completed Runs</span>
              <div className="text-3xl font-black font-mono mt-0.5 text-emerald-300">
                {completedDeliveries.length}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Selector */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-100 font-semibold">Active Transport Vehicle:</span>
            {(['Bicycle', 'E-Bike', 'Motorcycle', 'Cargo Van'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVehicleType(v)}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  vehicleType === v
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/10 text-amber-100 hover:bg-white/20'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="font-mono text-amber-200">
            Carbon Saved: <strong>~{completedDeliveries.length * 14} kg CO₂e</strong>
          </div>
        </div>
      </div>

      {/* ACTIVE RUNNING MISSIONS */}
      {activeDeliveries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              Active Delivery Task in Progress ({activeDeliveries.length})
            </h3>
            <span className="text-xs text-slate-500">Live GPS Updates Active</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeDeliveries.map((delivery) => {
              const progress = delivery.assignedDeliveryPartner?.transitProgress || 10;
              const isAwaitingPickupCheck =
                delivery.status === 'DELIVERY_PARTNER_ASSIGNED' &&
                !delivery.assignedDeliveryPartner?.pickupScreening;

              return (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-md space-y-5 card-hover-lift"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                        {delivery.id}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                        {delivery.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedTraceDonation(delivery)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Traceability Manifest
                    </button>
                  </div>

                  {/* Route & Cargo Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                        Cargo
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-0.5">
                        {delivery.title}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {delivery.quantity} {delivery.unit} • {delivery.storageCondition}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Pickup Point (Donor)
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                        {delivery.donorOrg}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {delivery.donorLocation.address}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase font-bold text-sky-700 tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Drop Point (NGO)
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                        {delivery.requestedByNGO?.ngoName}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {delivery.requestedByNGO?.ngoLocation.address}
                      </p>
                    </div>
                  </div>

                  {/* STAGE 2 CAMERA CHECK REQUIRED IF NOT YET VERIFIED */}
                  {isAwaitingPickupCheck ? (
                    <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                          <Camera className="w-4 h-4 text-amber-700" />
                          <span>Stage 2 Pickup Verification Required at Donor Handover</span>
                        </div>
                        <p className="text-xs text-amber-800">
                          Take a photo of food containers upon reaching kitchen to verify condition and thermal seal.
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartPickupCamera(delivery)}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Camera className="w-4 h-4" />
                        📷 Verify & Collect Food
                      </button>
                    </div>
                  ) : (
                    /* IN TRANSIT SIMULATION PROGRESS CONTROLLER */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-amber-600" />
                          Transit Status: {progress < 100 ? 'En Route to Destination' : 'Arrived at Destination'}
                        </span>
                        <span className="font-mono font-bold text-amber-700 text-sm">
                          {progress}% Completed
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200 relative">
                        <div
                          className="bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out relative"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <span className="text-slate-500 font-mono">
                          Courier: {currentUser.name} ({vehicleType}) • Live ETA: ~{Math.max(2, Math.round((100 - progress) * 0.25))} mins
                        </span>

                        {progress < 100 ? (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => handleSimulateAdvanceTransit(delivery.id, progress)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm interactive-btn"
                          >
                            Advance Route GPS (+25%)
                            <ArrowRight className="w-3.5 h-3.5" />
                          </motion.button>
                        ) : (
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Food Handed Over to NGO
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* AVAILABLE DELIVERY OPPORTUNITIES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Available Delivery Tasks
            </h3>
            <p className="text-xs text-slate-500">
              Accepted NGO requests requiring volunteer transportation
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {availableDeliveries.length} Ready for Pickup
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {availableDeliveries.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No approved deliveries awaiting assignment right now. Check back as donors approve claims!
            </div>
          ) : (
            availableDeliveries.map((delivery) => {
              const pickupDist = calculateDistanceKm(
                delivery.donorLocation.lat,
                delivery.donorLocation.lng,
                currentUser.coordinates.lat,
                currentUser.coordinates.lng
              );

              const dropDist = delivery.requestedByNGO
                ? calculateDistanceKm(
                    delivery.donorLocation.lat,
                    delivery.donorLocation.lng,
                    delivery.requestedByNGO.ngoLocation.lat,
                    delivery.requestedByNGO.ngoLocation.lng
                  )
                : 4.5;

              return (
                <div
                  key={delivery.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {delivery.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {delivery.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Volume: <strong>{delivery.quantity} {delivery.unit}</strong>
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base">
                      {delivery.title}
                    </h4>

                    {/* Proximity Details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Pickup: <strong>{pickupDist} km</strong> ({delivery.donorOrg})
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        Drop: <strong>{dropDist} km</strong> ({delivery.requestedByNGO?.ngoName || 'NGO'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <button
                      onClick={() => setSelectedTraceDonation(delivery)}
                      className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Audit
                    </button>
                    <button
                      onClick={() => handleAcceptDelivery(delivery.id)}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Truck className="w-4 h-4" />
                      Accept Delivery
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COMPLETED RUNS HISTORY */}
      {completedDeliveries.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              Completed Delivery Missions
            </h3>
            <span className="text-xs text-emerald-700 font-bold font-mono">
              ✓ 100% Chain-of-Custody Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedDeliveries.map((d) => (
              <div
                key={d.id}
                className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-emerald-800">{d.id}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{d.title}</div>
                  <p className="text-slate-500 text-[11px]">
                    {d.quantity} {d.unit} delivered to {d.requestedByNGO?.ngoName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTraceDonation(d)}
                  className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-lg font-bold hover:bg-emerald-50 transition-colors"
                >
                  Proof
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAMERA SCREENING MODAL FOR STAGE 2 PICKUP */}
      <CameraFoodModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScreeningComplete={handlePickupScreeningComplete}
        stage="pickup"
        stageTitle="Stage 2: Delivery Partner Pickup Verification"
        inspectorName={currentUser.name}
        defaultFoodName={stage2Donation?.title || 'Pickup Food Vessel'}
      />

      {/* TRACEABILITY MANIFEST MODAL */}
      <TraceabilityModal
        donation={selectedTraceDonation}
        isOpen={!!selectedTraceDonation}
        onClose={() => setSelectedTraceDonation(null)}
      />
    </div>
  );
};
