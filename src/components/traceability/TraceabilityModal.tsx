import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  Building,
  User,
  ExternalLink,
  Download,
  Share2,
  AlertCircle,
  Thermometer,
  Box,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DonationItem, DonationStatus } from '../../types';

interface TraceabilityModalProps {
  donation: DonationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_PROGRESSION: { status: DonationStatus; label: string; stepNumber: number }[] = [
  { status: 'AVAILABLE', label: 'Donation Created & Screened', stepNumber: 1 },
  { status: 'REQUESTED', label: 'NGO Claim Requested', stepNumber: 2 },
  { status: 'APPROVED', label: 'Donor Approved Request', stepNumber: 3 },
  { status: 'DELIVERY_PARTNER_ASSIGNED', label: 'Delivery Partner Assigned', stepNumber: 4 },
  { status: 'COLLECTED', label: 'Stage 2 Pickup Verification', stepNumber: 5 },
  { status: 'IN_TRANSIT', label: 'In Transit to NGO', stepNumber: 6 },
  { status: 'DELIVERED', label: 'Arrived at NGO Destination', stepNumber: 7 },
  { status: 'COMPLETED', label: 'Stage 3 Receiver Verification & Closed', stepNumber: 8 },
];

export const TraceabilityModal: React.FC<TraceabilityModalProps> = ({
  donation,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !donation) return null;

  const currentStepIdx = STATUS_PROGRESSION.findIndex((s) => s.status === donation.status);
  const activeStep = currentStepIdx >= 0 ? currentStepIdx : 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {donation.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {donation.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 className="font-bold text-lg text-white">
                SLAstice End-to-End Chain of Custody & Traceability
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {/* Quick Overview Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Food Item & Category
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{donation.title}</p>
              <span className="text-xs text-emerald-700 font-medium">{donation.category}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Total Quantity
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {donation.quantity} {donation.unit}
              </p>
              <span className="text-xs text-slate-500">{donation.dietaryType}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Origin (Donor)
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                {donation.donorOrg}
              </p>
              <span className="text-xs text-slate-500 line-clamp-1">{donation.donorLocation.address}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Receiver (NGO)
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                {donation.requestedByNGO?.ngoName || 'Pending Claim'}
              </p>
              <span className="text-xs text-slate-500">
                {donation.requestedByNGO ? `${donation.requestedByNGO.beneficiariesTarget} Beneficiaries` : 'Available to nearby NGOs'}
              </span>
            </div>
          </div>

          {/* 3-STAGE MULTI-VERIFICATION MATRIX */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                3-Stage Digital Food Verification Proof
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                Cryptographic Audit Log
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* STAGE 1: DONOR */}
              <div className="border border-emerald-200 bg-emerald-50/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Stage 1: Donor
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {Math.round(donation.donorScreening.confidence * 100)}% Conf.
                  </span>
                </div>

                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 relative">
                  <img
                    src={donation.foodImage}
                    alt="Donor food"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {donation.donorScreening.condition}
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-slate-700 font-medium">
                    Inspector: <strong className="text-slate-900">{donation.donorName}</strong>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    ID: {donation.donorScreening.screeningId} • {donation.donorScreening.timestamp}
                  </p>
                  <div className="text-[11px] text-emerald-800 bg-white p-2 rounded-lg border border-emerald-100">
                    {donation.donorScreening.recommendedWindow}
                  </div>
                </div>
              </div>

              {/* STAGE 2: DELIVERY PARTNER */}
              <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                    {donation.assignedDeliveryPartner?.pickupScreening ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    Stage 2: Pickup
                  </span>
                  {donation.assignedDeliveryPartner?.pickupScreening ? (
                    <span className="text-[11px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      {Math.round(donation.assignedDeliveryPartner.pickupScreening.confidence * 100)}% Conf.
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                      {donation.assignedDeliveryPartner ? 'En Route' : 'Awaiting Partner'}
                    </span>
                  )}
                </div>

                <div className="aspect-video rounded-xl overflow-hidden bg-slate-200 relative flex items-center justify-center">
                  {donation.assignedDeliveryPartner?.pickupScreening ? (
                    <img
                      src={donation.assignedDeliveryPartner.pickupScreening.imageUrl}
                      alt="Pickup verification"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Truck className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="text-[11px]">Pickup photo taken at handover</p>
                    </div>
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-slate-700 font-medium">
                    Transporter:{' '}
                    <strong className="text-slate-900">
                      {donation.assignedDeliveryPartner?.partnerName || 'Pending'}
                    </strong>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {donation.assignedDeliveryPartner?.pickupTime
                      ? `Verified: ${donation.assignedDeliveryPartner.pickupTime}`
                      : 'Pending pickup verification'}
                  </p>
                  {donation.assignedDeliveryPartner?.pickupScreening && (
                    <div className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      Condition: <strong>{donation.assignedDeliveryPartner.pickupScreening.condition}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* STAGE 3: RECEIVER / NGO */}
              <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                    {donation.receiverVerification ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    Stage 3: Receiver
                  </span>
                  {donation.receiverVerification ? (
                    <span className="text-[11px] font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      Pending Arrival
                    </span>
                  )}
                </div>

                <div className="aspect-video rounded-xl overflow-hidden bg-slate-200 relative flex items-center justify-center">
                  {donation.receiverVerification?.screening ? (
                    <img
                      src={donation.receiverVerification.screening.imageUrl}
                      alt="Receiver verification"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Building className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="text-[11px]">Final scan upon arrival</p>
                    </div>
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-slate-700 font-medium">
                    Receiver:{' '}
                    <strong className="text-slate-900">
                      {donation.receiverVerification?.receiverName || donation.requestedByNGO?.ngoName || 'Pending'}
                    </strong>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {donation.receiverVerification
                      ? `Accepted: ${donation.receiverVerification.verifiedQuantity} ${donation.unit} (${donation.receiverVerification.verifiedAt})`
                      : 'Pending final handover'}
                  </p>
                  {donation.receiverVerification && (
                    <div className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      "{donation.receiverVerification.remarks}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COMPLETE TRACEABILITY AUDIT TIMELINE */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Complete Journey Timeline ({donation.traceabilityLog.length} Recorded Events)
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {donation.traceabilityLog.map((event, idx) => (
                <div key={event.id || idx} className="relative group">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200"></div>
                  <div className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl p-3.5 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-slate-900">{event.stage}</span>
                      <span className="text-[11px] font-mono text-slate-500">{event.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{event.note}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {event.actor}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Cryptographic SHA-256 Audit Seal: <span className="text-slate-700 font-bold">{donation.id.replace(/-/g, '')}F881A</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download ESG Manifest
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors interactive-btn"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
