import React, { useState } from 'react';
import {
  Building,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Map as MapIcon,
  List,
  Search,
  Filter,
  Truck,
  Eye,
  Camera,
  Check,
  PackageCheck,
  Award,
} from 'lucide-react';
import { AIScreeningResult, DonationItem, FoodCondition } from '../../types';
import { motion } from 'motion/react';
import { calculateDistanceKm, calculateMatchingScore, store } from '../../services/store';
import { TraceabilityMap } from '../map/TraceabilityMap';
import { TraceabilityModal } from '../traceability/TraceabilityModal';
import { CameraFoodModal } from '../verification/CameraFoodModal';

export const NgoDashboard: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const allDonations = store.getDonations();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');
  const [maxDistance, setMaxDistance] = useState<number>(25);
  const [selectedTraceDonation, setSelectedTraceDonation] = useState<DonationItem | null>(null);

  // Request Claim Modal State
  const [requestTarget, setRequestTarget] = useState<DonationItem | null>(null);
  const [beneficiariesTarget, setBeneficiariesTarget] = useState<number>(45);
  const [requestNotes, setRequestNotes] = useState<string>('');

  // Stage 3 Final Verification Modal State
  const [verificationTarget, setVerificationTarget] = useState<DonationItem | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [stage3Screening, setStage3Screening] = useState<AIScreeningResult | null>(null);
  const [verifiedQty, setVerifiedQty] = useState<number>(0);
  const [conditionAccepted, setConditionAccepted] = useState<FoodCondition>('Fresh');
  const [receiverRemarks, setReceiverRemarks] = useState<string>('Received in good condition and distributed to residents.');

  // Available donations for NGO discovery
  const availableDonations = allDonations.filter((d) => d.status === 'AVAILABLE');

  // NGO's claimed / inbound donations
  const myClaims = allDonations.filter(
    (d) => d.requestedByNGO?.ngoId === currentUser.id || d.requestedByNGO?.ngoName === currentUser.organization
  );
  const activeDeliveries = myClaims.filter((d) => d.status !== 'COMPLETED' && d.status !== 'REJECTED');
  const deliveredAwaitingFinal = myClaims.filter((d) => d.status === 'DELIVERED');
  const completedClaims = myClaims.filter((d) => d.status === 'COMPLETED');

  // Filtered available list
  const filteredAvailable = availableDonations.filter((donation) => {
    if (selectedCategory !== 'All' && donation.category !== selectedCategory) return false;
    if (selectedDietary !== 'All' && donation.dietaryType !== selectedDietary) return false;
    const dist = calculateDistanceKm(
      donation.donorLocation.lat,
      donation.donorLocation.lng,
      currentUser.coordinates.lat,
      currentUser.coordinates.lng
    );
    if (dist > maxDistance) return false;
    return true;
  });

  const handleOpenRequest = (donation: DonationItem) => {
    setRequestTarget(donation);
    setBeneficiariesTarget(donation.unit === 'meals' ? donation.quantity : Math.round(donation.quantity * 2));
    setRequestNotes(`Requested for ${currentUser.organization} evening community food kitchen.`);
  };

  const handleConfirmRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;

    store.requestDonation(requestTarget.id, {
      ngoId: currentUser.id,
      ngoName: currentUser.organization,
      beneficiariesTarget: Number(beneficiariesTarget),
      notes: requestNotes,
      ngoLocation: {
        address: currentUser.address,
        lat: currentUser.coordinates.lat,
        lng: currentUser.coordinates.lng,
      },
    });

    setRequestTarget(null);
  };

  const handleOpenVerification = (donation: DonationItem) => {
    setVerificationTarget(donation);
    setVerifiedQty(donation.quantity);
    setConditionAccepted(donation.donorScreening.condition);
    setStage3Screening(null);
  };

  const handleCompleteFinalVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationTarget) return;

    store.completeReceiverVerification(verificationTarget.id, {
      receiverName: `${currentUser.name} (${currentUser.organization})`,
      verifiedQuantity: Number(verifiedQty),
      conditionAccepted,
      screening: stage3Screening || undefined,
      remarks: receiverRemarks,
    });

    setVerificationTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-800 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur border border-white/20">
                NGO & Food Bank Portal
              </span>
              <span className="text-xs text-sky-200">
                Live Proximity Matching
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentUser.organization}
            </h2>
            <p className="text-sm text-sky-100 font-medium leading-relaxed">
              Find verified edible surplus food within your community radius. Inspect CNN freshness scores, claim batches, and complete 3-stage chain-of-custody verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-sky-200 font-medium">Available Nearby</span>
              <div className="text-3xl font-black font-mono mt-0.5 text-white">
                {availableDonations.length}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-amber-200 font-medium">Inbound Deliveries</span>
              <div className="text-3xl font-black font-mono mt-0.5 text-amber-300">
                {activeDeliveries.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STAGE 3 FINAL VERIFICATION PROMPT BANNER (if food arrived!) */}
      {deliveredAwaitingFinal.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-md space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-950 font-bold text-sm">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <span>
                Food Arrived at Destination! Stage 3 Receiver Final Verification Required ({deliveredAwaitingFinal.length})
              </span>
            </div>
            <span className="text-xs text-emerald-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliveredAwaitingFinal.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-800">{d.id}</span>
                    <span className="text-xs font-semibold text-slate-700">{d.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Delivered by {d.assignedDeliveryPartner?.partnerName}. Verify quantity & inspect food to complete digital manifest.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenVerification(d)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Perform Stage 3 Verification
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISCOVERY & SMART MATCHING SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Nearby Surplus Food Batches
            </h3>
            <p className="text-xs text-slate-500">
              Ranked with transparent Multi-Factor Smart Matching (Proximity, Capacity, Freshness)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map View
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="Packaged Goods">Packaged Goods</option>
            </select>

            {/* Radius slider pill */}
            <div className="flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-300 px-3 py-1 rounded-xl">
              <span>Radius:</span>
              <strong className="text-slate-900 font-mono">{maxDistance}km</strong>
              <input
                type="range"
                min="3"
                max="35"
                step="2"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-16 accent-sky-600 cursor-pointer ml-1"
              />
            </div>
          </div>
        </div>

        {/* VIEW: MAP VIEW */}
        {viewMode === 'map' && (
          <div className="p-5">
            <TraceabilityMap
              donations={availableDonations}
              centerLocation={{
                lat: currentUser.coordinates.lat,
                lng: currentUser.coordinates.lng,
                label: currentUser.organization,
              }}
              onSelectDonation={(d) => handleOpenRequest(d)}
            />
          </div>
        )}

        {/* VIEW: LIST VIEW */}
        {viewMode === 'list' && (
          <div className="divide-y divide-slate-100">
            {filteredAvailable.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Building className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">
                  No surplus food matches within {maxDistance}km of your shelter right now.
                </p>
                <button
                  onClick={() => setMaxDistance(35)}
                  className="text-xs text-sky-600 font-bold hover:underline"
                >
                  Expand search radius to 35 km
                </button>
              </div>
            ) : (
              filteredAvailable.map((donation) => {
                const match = calculateMatchingScore(
                  donation,
                  currentUser.coordinates,
                  60
                );

                return (
                  <div
                    key={donation.id}
                    className="p-5 hover:bg-slate-50/70 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 card-hover-lift"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Food Photo with Freshness Badge */}
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 relative flex-shrink-0 shadow-sm">
                        <img
                          src={donation.foodImage}
                          alt={donation.title}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className={`absolute bottom-1 left-1 right-1 text-center text-[9px] font-extrabold uppercase px-1 py-0.5 rounded shadow-sm ${
                            donation.donorScreening.condition === 'Fresh'
                              ? 'bg-emerald-600 text-white'
                              : donation.donorScreening.condition === 'Moderately Fresh'
                              ? 'bg-sky-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {donation.donorScreening.condition}
                        </div>
                      </div>

                      {/* Food Specs */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {donation.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {donation.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {match.distanceKm} km away
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-base">
                          {donation.title}
                        </h4>

                        <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            Volume: <strong className="text-slate-900">{donation.quantity} {donation.unit}</strong>
                          </span>
                          <span>•</span>
                          <span>Donor: <strong className="text-slate-800">{donation.donorOrg}</strong></span>
                          <span>•</span>
                          <span>Best Before: <strong className="text-amber-800">{donation.expiryAt}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Match Score & Action */}
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      {/* Multi-Factor Smart Match Score Badge */}
                      <div className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-center">
                        <span className="text-[10px] font-bold uppercase text-sky-800 block">
                          Smart Match
                        </span>
                        <div className="text-lg font-black font-mono text-sky-900 flex items-center justify-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                          {match.score}%
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTraceDonation(donation)}
                          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          Audit
                        </button>
                        <button
                          onClick={() => handleOpenRequest(donation)}
                          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                        >
                          Request Food
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MY ACTIVE INBOUND DELIVERIES & REQUESTS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Active NGO Allocations & Live Transits
            </h3>
            <p className="text-xs text-slate-500">
              Track delivery partner pickup, transit progress, and final receipt
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {myClaims.length} Total Requests
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myClaims.map((claim) => (
            <div
              key={claim.id}
              className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-800">{claim.id}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800">
                  {claim.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{claim.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {claim.quantity} {claim.unit} from {claim.donorOrg}
                </p>
              </div>

              {/* Delivery Partner Transit Indicator */}
              {claim.assignedDeliveryPartner && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      Courier: <strong>{claim.assignedDeliveryPartner.partnerName}</strong> ({claim.assignedDeliveryPartner.vehicleType})
                    </span>
                    <span className="font-mono font-bold text-amber-700">
                      {claim.assignedDeliveryPartner.transitProgress || 20}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${claim.assignedDeliveryPartner.transitProgress || 20}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <button
                  onClick={() => setSelectedTraceDonation(claim)}
                  className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Journey Traceability
                </button>

                {claim.status === 'DELIVERED' && (
                  <button
                    onClick={() => handleOpenVerification(claim)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Complete Stage 3 Verification
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REQUEST CLAIM POPUP MODAL */}
      {requestTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6"
          >
            <div className="px-6 py-4 bg-sky-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Request Food Allocation</h3>
              <button
                onClick={() => setRequestTarget(null)}
                className="p-1 rounded text-sky-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRequest} className="p-6 space-y-4">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
                <span className="font-mono text-xs font-bold text-sky-800">{requestTarget.id}</span>
                <h4 className="font-bold text-slate-900 text-sm">{requestTarget.title}</h4>
                <p className="text-xs text-slate-600">
                  {requestTarget.quantity} {requestTarget.unit} • Donor: {requestTarget.donorOrg}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Beneficiary Count *
                </label>
                <input
                  type="number"
                  min="5"
                  required
                  value={beneficiariesTarget}
                  onChange={(e) => setBeneficiariesTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Preferred Arrival Window
                </label>
                <textarea
                  rows={2}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestTarget(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Request to Donor
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* STAGE 3 RECEIVER FINAL VERIFICATION MODAL */}
      {verificationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6"
          >
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Stage 3: Receiver Final Verification</h3>
                <p className="text-xs text-emerald-100">
                  Inspect received food containers, record accepted quantity & complete chain-of-custody
                </p>
              </div>
              <button
                onClick={() => setVerificationTarget(null)}
                className="p-1 rounded text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteFinalVerification} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-mono text-xs font-bold text-slate-700">{verificationTarget.id}</span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{verificationTarget.title}</h4>
                <p className="text-xs text-slate-500">
                  Shipped by {verificationTarget.donorOrg} via {verificationTarget.assignedDeliveryPartner?.partnerName}
                </p>
              </div>

              {/* Camera Trigger */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-emerald-950 block">
                    Receiver Optical Check
                  </span>
                  <span className="text-xs text-emerald-800">
                    {stage3Screening
                      ? `Verified: "${stage3Screening.condition}" (${Math.round(stage3Screening.confidence * 100)}% conf.)`
                      : 'Capture photo of received food dishes'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {stage3Screening ? 'Re-scan' : 'Open Camera'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Verified Quantity Received ({verificationTarget.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={verifiedQty}
                    onChange={(e) => setVerifiedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condition Accepted
                  </label>
                  <select
                    value={conditionAccepted}
                    onChange={(e) => setConditionAccepted(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Fresh">Fresh (High Quality)</option>
                    <option value="Moderately Fresh">Moderately Fresh</option>
                    <option value="Near Expiry">Near Expiry (Immediate Use)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Receiver Verification Remarks & Notes
                </label>
                <textarea
                  rows={2}
                  value={receiverRemarks}
                  onChange={(e) => setReceiverRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerificationTarget(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Received & Close Donation
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CAMERA SCREENING MODAL FOR STAGE 3 */}
      <CameraFoodModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScreeningComplete={(res) => setStage3Screening(res)}
        stage="ngo_final"
        stageTitle="Stage 3: Receiver Final AI Screening"
        inspectorName={currentUser.name}
        defaultFoodName={verificationTarget?.title || 'Arrived Food'}
      />

      {/* TRACEABILITY MODAL */}
      <TraceabilityModal
        donation={selectedTraceDonation}
        isOpen={!!selectedTraceDonation}
        onClose={() => setSelectedTraceDonation(null)}
      />
    </div>
  );
};
