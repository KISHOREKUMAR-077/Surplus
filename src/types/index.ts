export type UserRole = 'donor' | 'ngo' | 'delivery' | 'admin';

export type FoodCondition = 'Fresh' | 'Moderately Fresh' | 'Near Expiry' | 'Unsafe';

export type DonationStatus =
  | 'AVAILABLE'
  | 'REQUESTED'
  | 'APPROVED'
  | 'DELIVERY_PARTNER_ASSIGNED'
  | 'PICKUP_VERIFICATION'
  | 'COLLECTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RECEIVER_VERIFICATION'
  | 'COMPLETED'
  | 'REJECTED';

export interface AIScreeningResult {
  screeningId: string;
  timestamp: string;
  condition: FoodCondition;
  confidence: number; // 0.0 - 1.0
  detectedFood: string;
  visualIndicators: string[];
  recommendedWindow: string;
  advisoryNotes: string;
  stage: 'donor' | 'pickup' | 'ngo_final';
  inspectorName: string;
  imageUrl: string;
  temperatureEstimate?: string;
  packagingIntegrity?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  organization: string;
  role: UserRole;
  address: string;
  coordinates: { lat: number; lng: number };
  phone: string;
  email: string;
  rating: number;
  verified: boolean;
  activeMembership?: {
    planId: string;
    planName: string;
    startedAt: string;
    expiresAt: string;
    daysRemaining: number;
    price: number;
  };
}

export interface TraceabilityEvent {
  id: string;
  timestamp: string;
  stage: string;
  status: DonationStatus;
  actor: string;
  actorRole: UserRole;
  note: string;
  location?: string;
  photoUrl?: string;
}

export interface DonationItem {
  id: string; // e.g. SLA-DON-2026-00042
  title: string;
  category: 'Cooked Meals' | 'Bakery & Bread' | 'Fresh Produce' | 'Packaged Goods' | 'Dairy & Beverages' | 'Raw Staples';
  quantity: number;
  unit: 'kg' | 'meals' | 'boxes' | 'packs';
  dietaryType: 'Veg' | 'Non-Veg' | 'Vegan' | 'Egg';
  preparedAt: string;
  expiryAt: string;
  storageCondition: 'Hot Insulated (>60°C)' | 'Refrigerated (<4°C)' | 'Ambient Room Temp' | 'Deep Frozen';
  description: string;
  allergens?: string;

  // Donor Details
  donorId: string;
  donorName: string;
  donorOrg: string;
  donorPhone: string;
  donorLocation: {
    address: string;
    lat: number;
    lng: number;
  };

  // Stage 1 Verification
  foodImage: string;
  donorScreening: AIScreeningResult;

  // Lifecycle
  status: DonationStatus;
  createdAt: string;

  // Stage 2: NGO Request & Approval
  requestedByNGO?: {
    ngoId: string;
    ngoName: string;
    requestedAt: string;
    beneficiariesTarget: number;
    notes?: string;
    ngoLocation: {
      address: string;
      lat: number;
      lng: number;
    };
  };

  // Stage 3: Delivery Partner & Stage 2 Camera Verification
  assignedDeliveryPartner?: {
    partnerId: string;
    partnerName: string;
    partnerPhone: string;
    vehicleType: 'Bicycle' | 'E-Bike' | 'Motorcycle' | 'Cargo Van';
    assignedAt: string;
    pickupTime?: string;
    deliveryTime?: string;
    currentCoordinates?: { lat: number; lng: number };
    transitProgress?: number; // 0 - 100%
    pickupScreening?: AIScreeningResult;
  };

  // Stage 4: NGO Receiver Verification (Stage 3 Verification)
  receiverVerification?: {
    verifiedAt: string;
    receiverName: string;
    verifiedQuantity: number;
    conditionAccepted: FoodCondition;
    screening?: AIScreeningResult;
    remarks: string;
  };

  traceabilityLog: TraceabilityEvent[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  targetRole: UserRole | 'all';
  read: boolean;
  donationId?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration: '1 Month' | '3 Months' | '6 Months';
  price: number;
  periodMonths: number;
  features: string[];
  popular?: boolean;
}
