import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MEMBERSHIP_PLANS } from '../../services/initialData';
import { store } from '../../services/store';
import { MembershipPlan } from '../../types';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({ isOpen, onClose }) => {
  const currentUser = store.getCurrentUser();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>(MEMBERSHIP_PLANS[1]);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      store.activateMembership(currentUser.id, selectedPlan.id);
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
    }, 1100);
  };

  const handleDone = () => {
    setPaymentSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-xl">
              <Crown className="w-6 h-6 text-white animate-float" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">
                  SLAstice Partner Memberships
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-900/30 text-amber-100 border border-amber-300/30">
                  ESG & Priority Suite
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Extend community reach with automated priority matching, fleet dispatch & tax exemption certificates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner if already active */}
        {currentUser.activeMembership && !paymentSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Active Plan: <strong>{currentUser.activeMembership.planName}</strong> • {currentUser.activeMembership.daysRemaining} days remaining (Expires {currentUser.activeMembership.expiresAt})
              </span>
            </div>
            <span className="font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              Active Member
            </span>
          </div>
        )}

        <div className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            {paymentSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xl text-slate-900">
                    Payment Successful & Membership Activated!
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your organization <strong>{currentUser.organization}</strong> is now enrolled in the <strong>{selectedPlan.name}</strong>. Priority smart matching and live digital auditing are now active.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono shadow-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Transaction ID:</span>
                    <span className="font-bold text-slate-800">TXN-DEMO-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-emerald-700">₹{selectedPlan.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Duration:</span>
                    <span className="font-bold text-slate-800">{selectedPlan.duration}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDone}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all interactive-btn"
                >
                  Return to Dashboard
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="plans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MEMBERSHIP_PLANS.map((plan) => {
                    const isSelected = selectedPlan.id === plan.id;
                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -3 }}
                        onClick={() => setSelectedPlan(plan)}
                        className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all flex flex-col justify-between card-hover-lift ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/25 shadow-md ring-2 ring-amber-400/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm animate-pulse-subtle">
                            ★ Most Popular
                          </div>
                        )}

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {plan.duration}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base">{plan.name}</h4>
                          <div className="flex items-baseline gap-1 pt-1">
                            <span className="text-3xl font-extrabold text-slate-900 font-mono">
                              ₹{plan.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              / {plan.duration}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 my-4 space-y-2 flex-1">
                          {plan.features.map((feat, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs text-slate-700 leading-tight"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all interactive-btn ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ Selected Plan' : 'Select Plan'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Benefits Footer Strip */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Instant activation • 100% Tax-Exempt CSR Section 80G compliant</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <CreditCard className="w-4 h-4" />
                    <span>Simulated Test Sandbox (No Real Charges)</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={isProcessingPayment}
                    onClick={handleSimulatePayment}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 interactive-btn"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Authorizing Simulated Payment...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Activate {selectedPlan.name} (₹{selectedPlan.price.toLocaleString()})
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
