/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Bell,
  Crown,
  Sliders,
  RotateCcw,
  Sparkles,
  MapPin,
  Building,
  Store,
  Truck,
  BarChart3,
  User,
  HeartHandshake,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { store } from './services/store';
import { UserRole } from './types';
import { DonorDashboard } from './components/donor/DonorDashboard';
import { NgoDashboard } from './components/ngo/NgoDashboard';
import { DeliveryDashboard } from './components/delivery/DeliveryDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NotificationsPopover } from './components/common/NotificationsPopover';
import { MembershipModal } from './components/membership/MembershipModal';
import { ImpactSimulatorModal } from './components/simulator/ImpactSimulatorModal';
import { TraceabilityModal } from './components/traceability/TraceabilityModal';

export default function App() {
  const [, setTick] = useState<number>(0);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const currentUser = store.getCurrentUser();
  const notifications = store.getNotifications();
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const [activeTab, setActiveTab] = useState<UserRole>(currentUser.role);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [inspectedDonationId, setInspectedDonationId] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setActiveTab(role);
    store.switchRole(role);
  };

  const handleResetData = () => {
    if (window.confirm('Reset application state to initial demo seed?')) {
      store.resetToDemoSeed();
      setActiveTab('donor');
    }
  };

  const inspectedDonation = inspectedDonationId
    ? store.getDonationById(inspectedDonationId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & App Title with subtle floating effect */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              <HeartHandshake className="w-6 h-6" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  SLAstice
                </h1>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                  AI Food Traceability
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Donate • Verify • Match • Deliver • Track
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs with Motion Animated Pill */}
          <div className="hidden md:inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => handleRoleChange('donor')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                activeTab === 'donor'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Food Donor
            </button>
            <button
              onClick={() => handleRoleChange('ngo')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                activeTab === 'ngo'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              NGO / Receiver
            </button>
            <button
              onClick={() => handleRoleChange('delivery')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                activeTab === 'delivery'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Delivery Partner
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Admin
            </button>
          </div>

          {/* Quick Action Utilities */}
          <div className="flex items-center gap-2">
            {/* What-If Simulator Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSimulatorOpen(true)}
              title="What-If Redistribution Simulator"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all hidden sm:flex items-center gap-1.5 text-xs font-semibold interactive-btn"
            >
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Simulator</span>
            </motion.button>

            {/* Membership Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsMembershipOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs interactive-btn"
            >
              <Crown className="w-4 h-4 text-amber-600 animate-float" />
              <span className="hidden sm:inline">
                {currentUser.activeMembership ? 'Active Plan' : 'Memberships'}
              </span>
            </motion.button>

            {/* Notifications Button with live beacon indicator */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-all interactive-btn"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white live-beacon"></span>
                )}
              </motion.button>

              <NotificationsPopover
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onSelectDonation={(id) => setInspectedDonationId(id)}
              />
            </div>

            {/* User Identity / Organization */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <div className="font-bold text-slate-900 max-w-[140px] truncate">
                  {currentUser.organization}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  {currentUser.role}
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <motion.button
              whileTap={{ rotate: -180, scale: 0.9 }}
              onClick={handleResetData}
              title="Reset Demo State"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all interactive-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Sub-Navigation for Role Switching */}
        <div className="md:hidden px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-around text-xs">
          <button
            onClick={() => handleRoleChange('donor')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'donor' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Donor
          </button>
          <button
            onClick={() => handleRoleChange('ngo')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'ngo' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            NGO
          </button>
          <button
            onClick={() => handleRoleChange('delivery')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'delivery' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Delivery
          </button>
          <button
            onClick={() => handleRoleChange('admin')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
            }`}
          >
            Admin
          </button>
        </div>
      </header>

      {/* Main Content Area with Smooth Motion Crossfade & Slide Transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'donor' && <DonorDashboard />}
            {activeTab === 'ngo' && <NgoDashboard />}
            {activeTab === 'delivery' && <DeliveryDashboard />}
            {activeTab === 'admin' && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800">
              SLAstice Core Promise:
            </span>
            <span className="text-emerald-700 font-semibold">
              Donate → Verify → Match → Deliver → Verify → Track
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              CNN Computer Vision Screening
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              3-Stage Chain of Custody
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Live GPS Coordination
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              UN SDG 12.3 & 2
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <MembershipModal
        isOpen={isMembershipOpen}
        onClose={() => setIsMembershipOpen(false)}
      />

      <ImpactSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      <TraceabilityModal
        donation={inspectedDonation}
        isOpen={!!inspectedDonation}
        onClose={() => setInspectedDonationId(null)}
      />
    </div>
  );
}
