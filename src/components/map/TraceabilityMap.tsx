import React, { useState } from 'react';
import {
  MapPin,
  Truck,
  Building,
  Store,
  Navigation,
  Info,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DonationItem } from '../../types';
import { calculateDistanceKm, calculateMatchingScore } from '../../services/store';

interface TraceabilityMapProps {
  donations: DonationItem[];
  centerLocation?: { lat: number; lng: number; label?: string };
  onSelectDonation?: (donation: DonationItem) => void;
  selectedDonationId?: string;
  userRole?: string;
}

export const TraceabilityMap: React.FC<TraceabilityMapProps> = ({
  donations,
  centerLocation = { lat: 28.57, lng: 77.3, label: 'Capital Food Relief Corridor' },
  onSelectDonation,
  selectedDonationId,
  userRole = 'ngo',
}) => {
  const [activePin, setActivePin] = useState<DonationItem | null>(null);
  const [filterRadius, setFilterRadius] = useState<number>(15);

  // Map boundary projection to SVG coordinates (Delhi NCR coordinates approx lat 28.45 - 28.70, lng 77.05 - 77.45)
  const minLat = 28.45;
  const maxLat = 28.70;
  const minLng = 77.05;
  const maxLng = 77.45;

  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  const centerPos = projectCoords(centerLocation.lat, centerLocation.lng);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-white relative">
      {/* Top Map Controls */}
      <div className="p-4 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">
              GPS Live Coordination Map
            </h4>
            <span className="text-[11px] text-slate-400">
              Real-time donor locations, delivery fleet routes & receiving NGOs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Radius selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Radius:</span>
            {[5, 10, 15, 25].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRadius(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  filterRadius === r
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Donor
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
              NGO Hub
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse"></span>
              Delivery Fleet
            </span>
          </div>
        </div>
      </div>

      {/* Map Canvas / Grid Representation */}
      <div className="relative aspect-[16/9] w-full min-h-[380px] bg-[#0b1329] overflow-hidden select-none">
        {/* Subtle Map Grid lines and road stylized paths */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Express Arteries & Highway simulation */}
          <path
            d="M 10 30 Q 40 45 75 40 T 95 85"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="3"
            strokeDasharray="6 3"
          />
          <path
            d="M 25 90 Q 50 60 70 30 T 90 10"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        </svg>

        {/* Center / Viewer Hub Pulse Circle */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${centerPos.x}%`, top: `${centerPos.y}%` }}
        >
          <div className="w-24 h-24 rounded-full border border-sky-500/20 bg-sky-500/5 animate-ping"></div>
          <div className="w-12 h-12 rounded-full border border-sky-400/40 bg-sky-400/10 absolute inset-0 m-auto"></div>
          <div className="w-3.5 h-3.5 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8] border-2 border-slate-900 absolute inset-0 m-auto"></div>
        </div>

        {/* Render Active Transit Routes & Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {donations.map((d) => {
            if (
              d.status === 'IN_TRANSIT' &&
              d.requestedByNGO &&
              d.assignedDeliveryPartner
            ) {
              const donorPos = projectCoords(d.donorLocation.lat, d.donorLocation.lng);
              const ngoPos = projectCoords(
                d.requestedByNGO.ngoLocation.lat,
                d.requestedByNGO.ngoLocation.lng
              );
              return (
                <g key={`route_${d.id}`}>
                  {/* Base Route line */}
                  <line
                    x1={`${donorPos.x}%`}
                    y1={`${donorPos.y}%`}
                    x2={`${ngoPos.x}%`}
                    y2={`${ngoPos.y}%`}
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                    className="animate-pulse"
                  />
                </g>
              );
            }
            return null;
          })}
        </svg>

        {/* Map Markers for Donations */}
        {donations.map((donation) => {
          const donorPos = projectCoords(donation.donorLocation.lat, donation.donorLocation.lng);
          const isSelected = selectedDonationId === donation.id;
          const isInTransit = donation.status === 'IN_TRANSIT';

          return (
            <React.Fragment key={donation.id}>
              {/* Donor Pin */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10 transition-transform hover:scale-125"
                style={{ left: `${donorPos.x}%`, top: `${donorPos.y}%` }}
                onClick={() => {
                  setActivePin(donation);
                  if (onSelectDonation) onSelectDonation(donation);
                }}
              >
                <div
                  className={`relative p-2 rounded-full shadow-lg transition-all ${
                    isSelected
                      ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/40 scale-110'
                      : donation.status === 'AVAILABLE'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  {donation.status === 'AVAILABLE' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-900"></span>
                  )}
                </div>

                {/* Floating label */}
                <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900/95 border border-slate-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap shadow-xl z-30 pointer-events-none">
                  <div className="font-bold text-emerald-400">{donation.title}</div>
                  <div className="text-slate-400">
                    {donation.quantity} {donation.unit} • {donation.donorOrg}
                  </div>
                </div>
              </div>

              {/* In-Transit Moving Courier Pin */}
              {isInTransit && donation.assignedDeliveryPartner && donation.requestedByNGO && (
                (() => {
                  const ngoPos = projectCoords(
                    donation.requestedByNGO.ngoLocation.lat,
                    donation.requestedByNGO.ngoLocation.lng
                  );
                  const progress = (donation.assignedDeliveryPartner.transitProgress || 50) / 100;
                  const curX = donorPos.x + (ngoPos.x - donorPos.x) * progress;
                  const curY = donorPos.y + (ngoPos.y - donorPos.y) * progress;

                  return (
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer animate-pulse"
                      style={{ left: `${curX}%`, top: `${curY}%` }}
                      onClick={() => {
                        setActivePin(donation);
                        if (onSelectDonation) onSelectDonation(donation);
                      }}
                    >
                      <div className="p-2 bg-amber-500 text-slate-950 rounded-full shadow-[0_0_15px_#f59e0b] border-2 border-white">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-amber-950/90 border border-amber-600/50 text-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">
                        In Transit ({donation.assignedDeliveryPartner.transitProgress}%)
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Destination NGO Pin */}
              {donation.requestedByNGO && (
                (() => {
                  const ngoPos = projectCoords(
                    donation.requestedByNGO.ngoLocation.lat,
                    donation.requestedByNGO.ngoLocation.lng
                  );
                  return (
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                      style={{ left: `${ngoPos.x}%`, top: `${ngoPos.y}%` }}
                      onClick={() => {
                        setActivePin(donation);
                        if (onSelectDonation) onSelectDonation(donation);
                      }}
                    >
                      <div className="p-2 bg-sky-500 text-white rounded-full shadow-lg border border-sky-300">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })()
              )}
            </React.Fragment>
          );
        })}

        {/* Selected Donation Pin Overlay Card */}
        {activePin && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl z-30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  {activePin.id}
                </span>
                <h5 className="font-bold text-white text-sm line-clamp-1">
                  {activePin.title}
                </h5>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {activePin.donorOrg} • {activePin.donorLocation.address}
                </p>
              </div>
              <button
                onClick={() => setActivePin(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <div>
                <span className="text-slate-400 text-[10px]">Volume:</span>
                <p className="font-bold text-white">
                  {activePin.quantity} {activePin.unit}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">AI Screening:</span>
                <p className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {activePin.donorScreening.condition}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-medium">
                Status: <strong className="text-amber-400">{activePin.status.replace(/_/g, ' ')}</strong>
              </span>
              {onSelectDonation && (
                <button
                  onClick={() => onSelectDonation(activePin)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Bottom Legend Bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Showing verified surplus donations in regional corridor</span>
        </div>
        <div className="font-mono text-[11px]">
          Target Corridor: 28.535° N, 77.391° E (New Delhi Metro)
        </div>
      </div>
    </div>
  );
};
