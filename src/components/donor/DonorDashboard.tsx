import React, { useState } from 'react';
import {
  Plus,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  MapPin,
  Eye,
  Sliders,
  Sparkles,
  ChevronRight,
  Box,
  Truck,
  Building,
  Check,
  X as XIcon,
} from 'lucide-react';
import {
  AIScreeningResult,
  DonationItem,
  FoodCondition,
} from '../../types';
import { motion } from 'motion/react';
import { store } from '../../services/store';
import { CameraFoodModal } from '../verification/CameraFoodModal';
import { TraceabilityModal } from '../traceability/TraceabilityModal';
import { ImpactSimulatorModal } from '../simulator/ImpactSimulatorModal';
import { SAMPLE_FOOD_IMAGES } from '../../services/initialData';

export const DonorDashboard: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const allDonations = store.getDonations();

  // Filter donations belonging to this donor or relevant
  const myDonations = allDonations.filter(
    (d) => d.donorId === currentUser.id || d.donorOrg === currentUser.organization
  );

  // Stats
  const availableCount = myDonations.filter((d) => d.status === 'AVAILABLE').length;
  const requestedCount = myDonations.filter((d) => d.status === 'REQUESTED').length;
  const inProgressCount = myDonations.filter(
    (d) =>
      d.status === 'APPROVED' ||
      d.status === 'DELIVERY_PARTNER_ASSIGNED' ||
      d.status === 'COLLECTED' ||
      d.status === 'IN_TRANSIT' ||
      d.status === 'DELIVERED'
  ).length;
  const completedCount = myDonations.filter((d) => d.status === 'COMPLETED').length;
  const totalFoodWeightKg = myDonations.reduce((sum, d) => sum + (d.unit === 'kg' ? d.quantity : d.quantity * 0.45), 0);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [selectedTraceDonation, setSelectedTraceDonation] = useState<DonationItem | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<DonationItem['category']>('Cooked Meals');
  const [quantity, setQuantity] = useState<number>(30);
  const [unit, setUnit] = useState<DonationItem['unit']>('kg');
  const [dietaryType, setDietaryType] = useState<DonationItem['dietaryType']>('Veg');
  const [preparedAt, setPreparedAt] = useState<string>('Today, 11:30 AM');
  const [expiryAt, setExpiryAt] = useState<string>('Today, 7:30 PM');
  const [storageCondition, setStorageCondition] = useState<DonationItem['storageCondition']>('Hot Insulated (>60°C)');
  const [address, setAddress] = useState<string>(currentUser.address);
  const [description, setDescription] = useState<string>('');
  const [allergens, setAllergens] = useState<string>('');
  const [screeningResult, setScreeningResult] = useState<AIScreeningResult | null>(null);
  const [foodImage, setFoodImage] = useState<string>(SAMPLE_FOOD_IMAGES.freshMeals);

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setScreeningResult(null);
    setIsCreateOpen(true);
  };

  const handleCameraVerified = (result: AIScreeningResult) => {
    setScreeningResult(result);
    setFoodImage(result.imageUrl);
    if (!title && result.detectedFood) {
      setTitle(result.detectedFood);
    }
  };

  const handleSubmitDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Default mock screening if user didn't trigger camera
    const finalScreening: AIScreeningResult = screeningResult || {
      screeningId: `CNN-SCR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      condition: 'Fresh',
      confidence: 0.95,
      detectedFood: title,
      visualIndicators: [
        'Donor verified container integrity and thermal storage standard',
        'Standard food hygiene pre-dispatch check passed',
      ],
      recommendedWindow: 'Safe for consumption within 4 hours at hot holding temp',
      advisoryNotes: 'Donor self-declaration with optical visual check completed.',
      stage: 'donor',
      inspectorName: currentUser.name,
      imageUrl: foodImage,
      temperatureEstimate: 'Insulated Hot (>60°C)',
      packagingIntegrity: 'Compliant Food Grade Vessel',
    };

    const newDonation = store.createDonation({
      title,
      category,
      quantity: Number(quantity),
      unit,
      dietaryType,
      preparedAt,
      expiryAt,
      storageCondition,
      description: description || 'Hygienically prepared surplus food ready for immediate redistribution.',
      allergens: allergens || 'None specified',
      donorId: currentUser.id,
      donorName: currentUser.name,
      donorOrg: currentUser.organization,
      donorPhone: currentUser.phone,
      donorLocation: {
        address: address || currentUser.address,
        lat: currentUser.coordinates.lat,
        lng: currentUser.coordinates.lng,
      },
      foodImage,
      donorScreening: finalScreening,
    });

    setIsCreateOpen(false);
    setSelectedTraceDonation(newDonation);
  };

  const handleApproveClaim = (donationId: string) => {
    store.approveDonationRequest(donationId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <ShieldCheck className="w-80 h-80" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur border border-white/20">
                Food Donor Portal
              </span>
              <span className="text-xs text-emerald-200">
                ✓ SLAstice Certified Partner
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-sm text-emerald-100 font-medium leading-relaxed">
              {currentUser.organization} • Turn edible surplus food from catering, kitchens, and events into immediate nourishment for nearby shelters with AI visual verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur border border-white/20 transition-all flex items-center gap-2 interactive-btn"
            >
              <Sliders className="w-4 h-4 text-emerald-300" />
              What-If Simulator
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenCreate}
              className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-sm font-extrabold shadow-lg transition-all flex items-center gap-2 interactive-btn"
            >
              <Plus className="w-5 h-5 text-emerald-700" />
              + Donate Food
            </motion.button>
          </div>
        </div>

        {/* Counter Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3.5 border border-white/10 card-hover-lift transition-all">
            <span className="text-xs text-emerald-200 font-semibold">Available for Match</span>
            <div className="text-2xl font-black font-mono mt-0.5">{String(availableCount).padStart(2, '0')}</div>
          </div>
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3.5 border border-white/10 card-hover-lift transition-all">
            <span className="text-xs text-amber-200 font-semibold">Requested by NGOs</span>
            <div className="text-2xl font-black font-mono mt-0.5 text-amber-300">{String(requestedCount).padStart(2, '0')}</div>
          </div>
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3.5 border border-white/10 card-hover-lift transition-all">
            <span className="text-xs text-sky-200 font-semibold">In Transit / Active</span>
            <div className="text-2xl font-black font-mono mt-0.5 text-sky-300">{String(inProgressCount).padStart(2, '0')}</div>
          </div>
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3.5 border border-white/10 card-hover-lift transition-all">
            <span className="text-xs text-emerald-200 font-semibold">Completed & Verified</span>
            <div className="text-2xl font-black font-mono mt-0.5">{String(completedCount).padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* PENDING NGO CLAIMS ACTION BAR */}
      {requestedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Pending NGO Allocation Requests ({requestedCount})</span>
            </div>
            <span className="text-xs text-amber-700 font-medium">
              Review and approve for delivery partner pickup
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myDonations
              .filter((d) => d.status === 'REQUESTED' && d.requestedByNGO)
              .map((d) => (
                <div
                  key={d.id}
                  className="bg-white border border-amber-200 rounded-xl p-4 flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-amber-800">
                        {d.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {d.quantity} {d.unit} • {d.title}
                      </span>
                    </div>

                    <div className="p-2.5 bg-amber-50/50 rounded-lg text-xs text-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building className="w-3.5 h-3.5 text-amber-700" />
                        <span>{d.requestedByNGO?.ngoName}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Beneficiaries: <strong>{d.requestedByNGO?.beneficiariesTarget} people</strong>
                      </p>
                      {d.requestedByNGO?.notes && (
                        <p className="text-slate-500 text-[11px] italic">
                          "{d.requestedByNGO.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleApproveClaim(d.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Approve & Dispatch
                    </button>
                    <button
                      onClick={() => setSelectedTraceDonation(d)}
                      className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MY RECENT DONATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              My Food Donations & Digital Traceability
            </h3>
            <p className="text-xs text-slate-500">
              Real-time monitoring across all 10 redistribution lifecycle stages
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Total Diverted: <strong className="text-emerald-700">{Math.round(totalFoodWeightKg)} kg</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {myDonations.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No donations created yet. Click "+ Donate Food" to list your first surplus batch!
            </div>
          ) : (
            myDonations.map((donation) => {
              const statusColors: Record<string, string> = {
                AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                REQUESTED: 'bg-amber-100 text-amber-800 border-amber-200',
                APPROVED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                DELIVERY_PARTNER_ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-200',
                COLLECTED: 'bg-sky-100 text-sky-800 border-sky-200',
                IN_TRANSIT: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse',
                DELIVERED: 'bg-teal-100 text-teal-800 border-teal-200',
                COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              };

              return (
                <div
                  key={donation.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 relative flex-shrink-0">
                      <img
                        src={donation.foodImage}
                        alt={donation.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                        {donation.donorScreening.condition}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800">
                          {donation.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            statusColors[donation.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {donation.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {donation.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {donation.quantity} {donation.unit} • {donation.category} • Prepared: {donation.preparedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right hidden sm:block text-xs">
                      <span className="text-slate-400 block text-[10px]">AI Verification</span>
                      <strong className="text-emerald-700 font-mono">
                        {Math.round(donation.donorScreening.confidence * 100)}% Confidence
                      </strong>
                    </div>

                    <button
                      onClick={() => setSelectedTraceDonation(donation)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      Traceability Manifest
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CREATE DONATION MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Create Food Surplus Donation</h3>
                  <p className="text-xs text-emerald-100">
                    List surplus food with AI screening for nearby NGO discovery
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-emerald-100 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDonation} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Camera Verification Prompter */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-xs text-emerald-950">
                      Step 1: AI Visual Food Screening
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    {screeningResult
                      ? `Verified: "${screeningResult.condition}" (${Math.round(screeningResult.confidence * 100)}% confidence)`
                      : 'Capture food image with camera or choose preset sample'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <Camera className="w-4 h-4" />
                  {screeningResult ? 'Re-scan Food' : '📷 Open Camera Verification'}
                </button>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Food Name / Dish Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Steamed Rice & Dal Makhani"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Food Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Cooked Meals">Cooked Meals</option>
                    <option value="Bakery & Bread">Bakery & Bread</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Packaged Goods">Packaged Goods</option>
                    <option value="Dairy & Beverages">Dairy & Beverages</option>
                    <option value="Raw Staples">Raw Staples</option>
                  </select>
                </div>
              </div>

              {/* Quantity, Unit, Dietary */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="kg">kg (Weight)</option>
                    <option value="meals">meals (Portions)</option>
                    <option value="boxes">boxes</option>
                    <option value="packs">packs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dietary
                  </label>
                  <select
                    value={dietaryType}
                    onChange={(e) => setDietaryType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Veg">Vegetarian</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Egg">Eggetarian</option>
                  </select>
                </div>
              </div>

              {/* Storage Condition & Preparation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Storage Condition
                  </label>
                  <select
                    value={storageCondition}
                    onChange={(e) => setStorageCondition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Hot Insulated (>60°C)">Hot Insulated (&gt;60°C)</option>
                    <option value="Refrigerated (<4°C)">Refrigerated (&lt;4°C)</option>
                    <option value="Ambient Room Temp">Ambient Room Temp</option>
                    <option value="Deep Frozen">Deep Frozen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pickup Location Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description & Allergens */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Preparation Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on preparation, container packaging, or pickup gate instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <span>Unique Donation ID will be automatically generated upon submission.</span>
                <span className="font-mono font-bold text-emerald-800">SLA-DON-2026-XXXXX</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Publish Donation & Broadcast to NGOs
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CAMERA MODAL */}
      <CameraFoodModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScreeningComplete={handleCameraVerified}
        stage="donor"
        stageTitle="Stage 1: Donor AI Food Verification"
        inspectorName={currentUser.name}
        defaultFoodName={title || 'Prepared Food Surplus'}
      />

      {/* TRACEABILITY MODAL */}
      <TraceabilityModal
        donation={selectedTraceDonation}
        isOpen={!!selectedTraceDonation}
        onClose={() => setSelectedTraceDonation(null)}
      />

      {/* WHAT-IF SIMULATOR MODAL */}
      <ImpactSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onApplyMeals={(meals) => {
          setQuantity(meals);
          setUnit('meals');
          setIsCreateOpen(true);
        }}
      />
    </div>
  );
};
