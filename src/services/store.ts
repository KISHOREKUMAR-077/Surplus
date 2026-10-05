import {
  AIScreeningResult,
  DonationItem,
  DonationStatus,
  FoodCondition,
  NotificationItem,
  UserProfile,
  UserRole,
} from '../types';
import {
  INITIAL_DONATIONS,
  INITIAL_NOTIFICATIONS,
  MEMBERSHIP_PLANS,
  MOCK_USERS,
} from './initialData';

const STORAGE_KEYS = {
  DONATIONS: 'slastice_donations_v1',
  USERS: 'slastice_users_v1',
  NOTIFICATIONS: 'slastice_notifications_v1',
  ACTIVE_USER: 'slastice_active_user_v1',
};

// Calculate Haversine distance in km between two GPS coordinates
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

// Calculate transparent multi-factor Smart Donation Matching Score (0 - 100%)
export function calculateMatchingScore(
  donation: DonationItem,
  ngoLocation: { lat: number; lng: number },
  ngoCapacity: number = 50
): {
  score: number;
  distanceKm: number;
  factors: {
    proximityScore: number;
    capacityScore: number;
    freshnessScore: number;
    categoryScore: number;
  };
} {
  const dist = calculateDistanceKm(
    donation.donorLocation.lat,
    donation.donorLocation.lng,
    ngoLocation.lat,
    ngoLocation.lng
  );

  // Proximity (40% weight): Closer is higher. Under 3km = 100%, 15km = 20%
  const proximityScore = Math.max(0, Math.min(100, Math.round(100 - (dist / 15) * 80)));

  // Capacity / Quantity fit (25% weight)
  const qty = donation.quantity;
  const ratio = Math.min(qty, ngoCapacity) / Math.max(qty, ngoCapacity);
  const capacityScore = Math.round(ratio * 100);

  // Freshness & Condition (20% weight)
  let freshnessScore = 95;
  if (donation.donorScreening.condition === 'Fresh') freshnessScore = 98;
  else if (donation.donorScreening.condition === 'Moderately Fresh') freshnessScore = 80;
  else if (donation.donorScreening.condition === 'Near Expiry') freshnessScore = 65;
  else freshnessScore = 10;

  // Category fit (15% weight)
  const categoryScore = 95;

  const totalScore = Math.round(
    proximityScore * 0.4 +
      capacityScore * 0.25 +
      freshnessScore * 0.2 +
      categoryScore * 0.15
  );

  return {
    score: Math.min(99, Math.max(30, totalScore)),
    distanceKm: dist,
    factors: {
      proximityScore,
      capacityScore,
      freshnessScore,
      categoryScore,
    },
  };
}

class StoreService {
  private donations: DonationItem[] = [];
  private users: Record<string, UserProfile> = {};
  private notifications: NotificationItem[] = [];
  private currentUserId: string = 'donor_1';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const savedDonations = localStorage.getItem(STORAGE_KEYS.DONATIONS);
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const savedActiveUser = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);

      this.donations = savedDonations ? JSON.parse(savedDonations) : INITIAL_DONATIONS;
      this.users = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
      this.notifications = savedNotifs ? JSON.parse(savedNotifs) : INITIAL_NOTIFICATIONS;
      if (savedActiveUser && this.users[savedActiveUser]) {
        this.currentUserId = savedActiveUser;
      } else {
        this.currentUserId = 'donor_1';
      }
    } catch (e) {
      console.warn('Failed to load from storage, using initial mock data', e);
      this.donations = INITIAL_DONATIONS;
      this.users = MOCK_USERS;
      this.notifications = INITIAL_NOTIFICATIONS;
      this.currentUserId = 'donor_1';
    }

    // Hydrate from Express backend API asynchronously
    this.syncFromBackend();
  }

  public async syncFromBackend() {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        if (data.donations && Array.isArray(data.donations)) {
          this.donations = data.donations;
        }
        if (data.users && typeof data.users === 'object') {
          this.users = data.users;
        }
        if (data.notifications && Array.isArray(data.notifications)) {
          this.notifications = data.notifications;
        }
        if (data.currentUser && data.currentUser.id) {
          this.currentUserId = data.currentUser.id;
        }
        this.save();
      }
    } catch (err) {
      // Offline fallback: continue using local state
      console.info('[Store] Running in local/offline storage mode');
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(this.donations));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, this.currentUserId);
    } catch (e) {
      console.error('Storage save error:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // Getters
  public getDonations(): DonationItem[] {
    return [...this.donations];
  }

  public getDonationById(id: string): DonationItem | undefined {
    return this.donations.find((d) => d.id === id);
  }

  public getCurrentUser(): UserProfile {
    return (
      this.users[this.currentUserId] || {
        id: this.currentUserId,
        name: 'Guest User',
        organization: 'Independent Food Saver',
        role: 'donor',
        address: 'New Delhi',
        coordinates: { lat: 28.6139, lng: 77.209 },
        phone: '+91 99999 00000',
        email: 'user@slastice.org',
        rating: 5.0,
        verified: true,
      }
    );
  }

  public getUsers(): Record<string, UserProfile> {
    return { ...this.users };
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  // Switch Active User / Role
  public setCurrentUser(userId: string) {
    if (this.users[userId]) {
      this.currentUserId = userId;
      this.save();

      fetch('/api/users/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    }
  }

  public switchRole(role: UserRole) {
    const existing = Object.values(this.users).find((u) => u.role === role);
    if (existing) {
      this.currentUserId = existing.id;
    } else {
      if (this.users[this.currentUserId]) {
        this.users[this.currentUserId].role = role;
      }
    }
    this.save();

    fetch('/api/users/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }).catch(() => {});
  }

  // Create Donation (Stage 1)
  public createDonation(
    donationData: Omit<DonationItem, 'id' | 'createdAt' | 'status' | 'traceabilityLog'>
  ): DonationItem {
    const timestampStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = new Date().toISOString().split('T')[0];
    const serial = String(this.donations.length + 101).padStart(5, '0');
    const newId = `SLA-DON-${dateStr.slice(0, 4)}-${serial}`;

    const newDonation: DonationItem = {
      ...donationData,
      id: newId,
      status: 'AVAILABLE',
      createdAt: `${dateStr} ${timestampStr}`,
      traceabilityLog: [
        {
          id: `trc_${Date.now()}_1`,
          timestamp: `${dateStr} ${timestampStr}`,
          stage: 'Donation Created & Stage 1 Visual Screening',
          status: 'AVAILABLE',
          actor: `${donationData.donorName} (${donationData.donorOrg})`,
          actorRole: 'donor',
          note: `Listed ${donationData.quantity} ${donationData.unit} of ${donationData.title}. AI visual screening verified "${donationData.donorScreening.condition}" (${Math.round(donationData.donorScreening.confidence * 100)}% confidence).`,
          location: donationData.donorLocation.address,
          photoUrl: donationData.foodImage,
        },
      ],
    };

    this.donations.unshift(newDonation);

    this.addNotification({
      title: 'New Food Donation Published',
      message: `${newDonation.donorOrg} listed ${newDonation.quantity} ${newDonation.unit} of ${newDonation.title} (${newDonation.id}). Ready for nearby NGO matching!`,
      type: 'success',
      targetRole: 'all',
      donationId: newId,
    });

    this.save();

    // Async sync to backend
    fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donationData),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((serverDonation) => {
        if (serverDonation && serverDonation.id) {
          const idx = this.donations.findIndex((d) => d.id === newId);
          if (idx !== -1) {
            this.donations[idx] = serverDonation;
            this.save();
          }
        }
      })
      .catch(() => {});

    return newDonation;
  }

  // Stage 2: NGO Requests Food
  public requestDonation(
    donationId: string,
    ngoDetails: {
      ngoId: string;
      ngoName: string;
      beneficiariesTarget: number;
      notes?: string;
      ngoLocation: { address: string; lat: number; lng: number };
    }
  ) {
    const donation = this.donations.find((d) => d.id === donationId);
    if (!donation) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    donation.status = 'REQUESTED';
    donation.requestedByNGO = {
      ...ngoDetails,
      requestedAt: `Today at ${timeStr}`,
    };

    donation.traceabilityLog.push({
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'NGO Claim Requested',
      status: 'REQUESTED',
      actor: ngoDetails.ngoName,
      actorRole: 'ngo',
      note: `Requested food allocation for ${ngoDetails.beneficiariesTarget} beneficiaries. Note: ${ngoDetails.notes || 'None'}`,
      location: ngoDetails.ngoLocation.address,
    });

    this.addNotification({
      title: 'Donation Claim Requested',
      message: `${ngoDetails.ngoName} requested ${donation.title} (${donation.id}) for ${ngoDetails.beneficiariesTarget} people. Donor approval required.`,
      type: 'warning',
      targetRole: 'donor',
      donationId,
    });

    this.save();

    // Async sync to backend
    fetch(`/api/donations/${donationId}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ngoDetails),
    }).catch(() => {});
  }

  // Donor Approves Request
  public approveDonationRequest(donationId: string) {
    const donation = this.donations.find((d) => d.id === donationId);
    if (!donation) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    donation.status = 'APPROVED';

    donation.traceabilityLog.push({
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Donor Approved Request',
      status: 'APPROVED',
      actor: donation.donorName,
      actorRole: 'donor',
      note: 'Donor approved the NGO claim. Donation is unlocked for volunteer delivery partner pickup.',
      location: donation.donorLocation.address,
    });

    this.addNotification({
      title: 'Donation Approved for Delivery',
      message: `${donation.donorOrg} approved the request for ${donation.title} (${donation.id}). Volunteer Delivery Partners can now accept pickup!`,
      type: 'info',
      targetRole: 'delivery',
      donationId,
    });

    this.save();

    // Async sync to backend
    fetch(`/api/donations/${donationId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }

  // Delivery Partner Accepts Task
  public acceptDeliveryTask(
    donationId: string,
    partner: {
      partnerId: string;
      partnerName: string;
      partnerPhone: string;
      vehicleType: 'Bicycle' | 'E-Bike' | 'Motorcycle' | 'Cargo Van';
    }
  ) {
    const donation = this.donations.find((d) => d.id === donationId);
    if (!donation) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    donation.status = 'DELIVERY_PARTNER_ASSIGNED';
    donation.assignedDeliveryPartner = {
      ...partner,
      assignedAt: `Today at ${timeStr}`,
      transitProgress: 5,
      currentCoordinates: {
        lat: donation.donorLocation.lat - 0.005,
        lng: donation.donorLocation.lng - 0.005,
      },
    };

    donation.traceabilityLog.push({
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Delivery Partner Assigned',
      status: 'DELIVERY_PARTNER_ASSIGNED',
      actor: `${partner.partnerName} (${partner.vehicleType})`,
      actorRole: 'delivery',
      note: `Delivery partner accepted task. En route to donor kitchen for Stage 2 camera inspection.`,
      location: donation.donorLocation.address,
    });

    this.addNotification({
      title: 'Delivery Partner En Route to Pickup',
      message: `${partner.partnerName} (${partner.vehicleType}) accepted ${donation.id} and is heading to ${donation.donorOrg}.`,
      type: 'info',
      targetRole: 'all',
      donationId,
    });

    this.save();

    // Async sync to backend
    fetch(`/api/donations/${donationId}/accept-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partner),
    }).catch(() => {});
  }

  // Stage 2 Pickup Verification
  public verifyPickup(donationId: string, screening: AIScreeningResult) {
    const donation = this.donations.find((d) => d.id === donationId);
    if (!donation || !donation.assignedDeliveryPartner) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    donation.status = 'COLLECTED';
    donation.assignedDeliveryPartner.pickupTime = `Today at ${timeStr}`;
    donation.assignedDeliveryPartner.pickupScreening = screening;
    donation.assignedDeliveryPartner.transitProgress = 25;

    donation.traceabilityLog.push({
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Stage 2 Pickup Camera Verification',
      status: 'COLLECTED',
      actor: `${donation.assignedDeliveryPartner.partnerName} (Delivery Partner)`,
      actorRole: 'delivery',
      note: `Pickup verified via on-site camera screening: Condition "${screening.condition}" (${Math.round(screening.confidence * 100)}%). Food containers secured in transit bag.`,
      location: donation.donorLocation.address,
      photoUrl: screening.imageUrl,
    });

    this.addNotification({
      title: 'Food Collected & Verified',
      message: `Pickup confirmed for ${donation.title} (${donation.id}). Stage 2 camera check verified food condition "${screening.condition}".`,
      type: 'success',
      targetRole: 'all',
      donationId,
    });

    this.save();

    // Async sync to backend
    fetch(`/api/donations/${donationId}/verify-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screening }),
    }).catch(() => {});
  }

  // Update Transit Progress
  public updateTransit(donationId: string, progress: number) {
    const donation = this.donations.find((d) => d.id === donationId);
    if (!donation || !donation.assignedDeliveryPartner) return;

    donation.assignedDeliveryPartner.transitProgress = progress;
    if (progress > 25 && progress < 100) {
      donation.status = 'IN_TRANSIT';
    } else if (progress >= 100) {
      donation.status = 'DELIVERED';
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      donation.assignedDeliveryPartner.deliveryTime = `Today at ${timeStr}`;

      donation.traceabilityLog.push({
        id: `trc_${Date.now()}`,
        timestamp: `Today at ${timeStr}`,
        stage: 'Food Delivered at NGO Hub',
        status: 'DELIVERED',
        actor: donation.assignedDeliveryPartner.partnerName,
        actorRole: 'delivery',
        note: `Arrived at destination (${donation.requestedByNGO?.ngoName || 'NGO'}). Handed over for Stage 3 final inspection.`,
        location: donation.requestedByNGO?.ngoLocation.address,
      });

      this.addNotification({
        title: 'Food Arrived at Destination',
        message: `${donation.title} (${donation.id}) arrived at ${donation.requestedByNGO?.ngoName}. Awaiting Stage 3 final receiver verification.`,
        type: 'info',
        targetRole: 'ngo',
        donationId,
      });
    }

    this.save();

    // Async sync to backend
    fetch(`/api/donations/${donationId}/transit-progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    }).catch(() => {});
  }

  // Stage 3 Final Verification by NGO Receiver
  public completeReceiverVerification(
    donationId: string,
    verification: {
      receiverName: string;
      verifiedQuantity: number;
      conditionAccepted: FoodCondition;
      screening?: AIScreeningResult;
      remarks: string;
    }
  ) {
    const donation = this.donations.find((d) => d.id === donationId);
    if (!donation) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    donation.status = 'COMPLETED';
    donation.receiverVerification = {
      ...verification,
      verifiedAt: `Today at ${timeStr}`,
    };

    donation.traceabilityLog.push({
      id: `trc_${Date.now()}`,
      timestamp: `Today at ${timeStr}`,
      stage: 'Stage 3 Final Receiver Verification & Complete',
      status: 'COMPLETED',
      actor: `${verification.receiverName} (${donation.requestedByNGO?.ngoName || 'Receiver'})`,
      actorRole: 'ngo',
      note: `Final physical & visual verification completed. Accepted ${verification.verifiedQuantity} ${donation.unit}. Condition: "${verification.conditionAccepted}". Remarks: ${verification.remarks}`,
      location: donation.requestedByNGO?.ngoLocation.address,
      photoUrl: verification.screening?.imageUrl,
    });

    this.addNotification({
      title: 'Donation Completed & Traceability Closed',
      message: `Donation ${donation.id} successfully completed! ${verification.verifiedQuantity} ${donation.unit} distributed to beneficiaries. ESG impact recorded.`,
      type: 'success',
      targetRole: 'all',
      donationId,
    });

    this.save();

    // Async sync to backend
    fetch(`/api/donations/${donationId}/verify-receiver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verification),
    }).catch(() => {});
  }

  // Membership Activation
  public activateMembership(userId: string, planId: string): boolean {
    const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId);
    if (!plan || !this.users[userId]) return false;

    const today = new Date();
    const expiry = new Date();
    expiry.setMonth(today.getMonth() + plan.periodMonths);

    this.users[userId].activeMembership = {
      planId: plan.id,
      planName: plan.name,
      startedAt: today.toISOString().split('T')[0],
      expiresAt: expiry.toISOString().split('T')[0],
      daysRemaining: plan.periodMonths * 30,
      price: plan.price,
    };

    this.addNotification({
      title: 'SLAstice Membership Activated!',
      message: `Congratulations! ${plan.name} is now active for ${this.users[userId].organization}. Enjoy priority matching and CSR certificates.`,
      type: 'success',
      targetRole: 'donor',
    });

    this.save();

    // Async sync to backend
    fetch('/api/memberships/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId }),
    }).catch(() => {});

    return true;
  }

  // Notifications
  public addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
      read: false,
    };
    this.notifications.unshift(newNotif);
    if (this.notifications.length > 50) this.notifications.pop();
  }

  public markAllNotificationsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.save();

    fetch('/api/notifications/read-all', { method: 'PUT' }).catch(() => {});
  }

  // Reset to initial demo seed
  public resetToDemoSeed() {
    this.donations = INITIAL_DONATIONS;
    this.users = MOCK_USERS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.currentUserId = 'donor_1';
    this.save();

    fetch('/api/admin/reset', { method: 'POST' }).catch(() => {});
  }
}

export const store = new StoreService();
