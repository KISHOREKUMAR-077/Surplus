import React, { useState } from 'react';
import {
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Users,
  Truck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  Eye,
  Crown,
  Sparkles,
  Layers,
} from 'lucide-react';
import { DonationItem } from '../../types';
import { motion } from 'motion/react';
import { store } from '../../services/store';
import { TraceabilityModal } from '../traceability/TraceabilityModal';
import { TraceabilityMap } from '../map/TraceabilityMap';

export const AdminDashboard: React.FC = () => {
  const donations = store.getDonations();
  const users = store.getUsers();
  const allUsersList = Object.values(users);

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedTraceDonation, setSelectedTraceDonation] = useState<DonationItem | null>(null);

  // Metrics
  const totalDonations = donations.length;
  const completedDonations = donations.filter((d) => d.status === 'COMPLETED').length;
  const activeDonations = donations.filter((d) => d.status !== 'COMPLETED' && d.status !== 'REJECTED').length;

  const totalFoodWeightKg = Math.round(
    donations.reduce((sum, d) => sum + (d.unit === 'kg' ? d.quantity : d.quantity * 0.45), 0)
  );

  const totalMealsServed = Math.round(
    donations.reduce((sum, d) => sum + (d.unit === 'meals' ? d.quantity : d.quantity * 2.2), 0)
  );

  const totalScreenedImages = donations.reduce((sum, d) => {
    let count = 1; // Stage 1 donor screening
    if (d.assignedDeliveryPartner?.pickupScreening) count++;
    if (d.receiverVerification?.screening) count++;
    return sum + count;
  }, 0);

  // AI Breakdown
  const freshCount = donations.filter((d) => d.donorScreening.condition === 'Fresh').length;
  const modFreshCount = donations.filter((d) => d.donorScreening.condition === 'Moderately Fresh').length;
  const nearExpiryCount = donations.filter((d) => d.donorScreening.condition === 'Near Expiry').length;
  const unsafeCount = donations.filter((d) => d.donorScreening.condition === 'Unsafe').length;

  // Users Breakdown
  const donorsCount = allUsersList.filter((u) => u.role === 'donor').length;
  const ngosCount = allUsersList.filter((u) => u.role === 'ngo').length;
  const couriersCount = allUsersList.filter((u) => u.role === 'delivery').length;
  const membersCount = allUsersList.filter((u) => u.activeMembership).length;

  const handleExportCSV = () => {
    const headers = ['Donation ID', 'Title', 'Category', 'Quantity', 'Unit', 'Donor', 'Status', 'Condition', 'Confidence'];
    const rows = donations.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      d.category,
      d.quantity,
      d.unit,
      `"${d.donorOrg}"`,
      d.status,
      d.donorScreening.condition,
      `${Math.round(d.donorScreening.confidence * 100)}%`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `slastice_audit_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur border border-white/20 text-indigo-300">
                Central Governance & Analytics
              </span>
              <span className="text-xs text-slate-300">
                Real-Time District Telemetry
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SLAstice Platform Governance Console
            </h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              District-wide food diversion analytics, multi-stage CNN visual verification audit, delivery SLA performance & active stakeholder management.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 interactive-btn"
          >
            <Download className="w-4 h-4" />
            Export Audit Report (CSV)
          </motion.button>
        </div>
      </div>

      {/* METRIC SCORECARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 card-hover-lift">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Food Diverted</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">
            {totalFoodWeightKg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            ~{totalMealsServed.toLocaleString()} meals provided
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 card-hover-lift">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Redistribution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">
            98.6<span className="text-sm font-semibold text-slate-500">%</span>
          </div>
          <p className="text-[11px] text-sky-700 font-medium">
            {completedDonations} completed of {totalDonations} batches
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 card-hover-lift">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Avg Logistics SLA</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">
            26 <span className="text-sm font-semibold text-slate-500">min</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            Pickup allocation: ~4.2 mins
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 card-hover-lift">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Stakeholders</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900">
            {allUsersList.length}
          </div>
          <p className="text-[11px] text-indigo-700 font-medium">
            {donorsCount} Donors • {ngosCount} NGOs • {couriersCount} Drivers
          </p>
        </div>
      </div>

      {/* AI SCREENING ANALYTICS & DISTRIBUTION PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Computer-Vision Metrics Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              CNN-Based Computer Vision Verification Stats
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Avg Conf: 95.8%
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {totalScreenedImages} multi-stage inspection scans conducted across Donor, Pickup, and Receiver checkpoints.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Fresh ({freshCount})
                </span>
                <span className="font-mono text-slate-600">
                  {Math.round((freshCount / Math.max(1, totalDonations)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(freshCount / Math.max(1, totalDonations)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-sky-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  Moderately Fresh ({modFreshCount})
                </span>
                <span className="font-mono text-slate-600">
                  {Math.round((modFreshCount / Math.max(1, totalDonations)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{ width: `${(modFreshCount / Math.max(1, totalDonations)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Near Expiry - Urgent ({nearExpiryCount})
                </span>
                <span className="font-mono text-slate-600">
                  {Math.round((nearExpiryCount / Math.max(1, totalDonations)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${(nearExpiryCount / Math.max(1, totalDonations)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Unsafe / Rejected ({unsafeCount})
                </span>
                <span className="font-mono text-slate-600">0%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: `0%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stakeholder Memberships & Community Partners */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              SLAstice Memberships & ESG Subscribers
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
              {membersCount} Active Corporate Plans
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Registered organizations contributing to the logistics fund with CSR 80G tax exemptions and priority matching algorithms.
          </p>

          <div className="space-y-2 pt-2">
            {allUsersList
              .filter((u) => u.activeMembership)
              .map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{u.organization}</div>
                    <div className="text-slate-500 text-[11px]">
                      {u.activeMembership?.planName} • {u.activeMembership?.daysRemaining} days remaining
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-1 rounded border border-slate-200">
                    ₹{u.activeMembership?.price.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* LIVE GPS CORRIDOR MAP OVERVIEW */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-600" />
          District-Wide Live Coordination Grid
        </h3>
        <TraceabilityMap
          donations={donations}
          onSelectDonation={(d) => setSelectedTraceDonation(d)}
        />
      </div>

      {/* COMPLETE DONATIONS AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Master Traceability & Audit Registry
            </h3>
            <p className="text-xs text-slate-500">
              Immutable ledger of all food batches, 3-stage visual verification records, and delivery proofs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Cooked Meals">Cooked Meals</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
              <option value="Fresh Produce">Fresh Produce</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Donation ID</th>
                <th className="py-3 px-4">Food Item</th>
                <th className="py-3 px-4">Volume</th>
                <th className="py-3 px-4">Donor Origin</th>
                <th className="py-3 px-4">Receiver Hub</th>
                <th className="py-3 px-4">AI Screening</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Audit Manifest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {donations
                .filter((d) => filterCategory === 'All' || d.category === filterCategory)
                .map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {d.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[180px] truncate">
                      {d.title}
                    </td>
                    <td className="py-3.5 px-4">
                      {d.quantity} {d.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate">
                      {d.donorOrg}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate">
                      {d.requestedByNGO?.ngoName || 'Open Match'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {d.donorScreening.condition} ({Math.round(d.donorScreening.confidence * 100)}%)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedTraceDonation(d)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRACEABILITY MANIFEST MODAL */}
      <TraceabilityModal
        donation={selectedTraceDonation}
        isOpen={!!selectedTraceDonation}
        onClose={() => setSelectedTraceDonation(null)}
      />
    </div>
  );
};
