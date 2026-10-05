import fs from 'fs';
import path from 'path';
import { DonationItem, NotificationItem, UserProfile } from '../../src/types';
import { INITIAL_DONATIONS, INITIAL_NOTIFICATIONS, MOCK_USERS } from '../../src/services/initialData';

export interface DatabaseSchema {
  donations: DonationItem[];
  users: Record<string, UserProfile>;
  notifications: NotificationItem[];
  activeUserId: string;
}

class DatabaseService {
  private data: DatabaseSchema;
  private dbFilePath: string;
  private isPersisting: boolean = false;

  constructor() {
    // Choose appropriate path: check environment or default to server/data/slastice_db.json
    const baseDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'server', 'data');
    this.dbFilePath = path.join(baseDir, 'slastice_db.json');

    this.data = {
      donations: INITIAL_DONATIONS,
      users: MOCK_USERS,
      notifications: INITIAL_NOTIFICATIONS,
      activeUserId: 'donor_1',
    };

    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const fileContent = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.donations && parsed.users) {
          this.data = parsed;
          return;
        }
      }

      // First run or missing file: persist initial seed
      this.persist();
    } catch (err) {
      console.warn('[DB] Persistent storage unavailable (running in serverless or read-only mode). Using memory fallback.', err);
    }
  }

  private persist() {
    if (this.isPersisting) return;
    this.isPersisting = true;

    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${this.dbFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (err) {
      // In serverless environments like Vercel, filesystem might be read-only; in-memory data remains active
      console.warn('[DB] File save skipped (in-memory mode):', (err as Error).message);
    } finally {
      this.isPersisting = false;
    }
  }

  // --- Donations ---
  public getDonations(): DonationItem[] {
    return [...this.data.donations];
  }

  public getDonationById(id: string): DonationItem | undefined {
    return this.data.donations.find((d) => d.id === id);
  }

  public insertDonation(donation: DonationItem): DonationItem {
    this.data.donations.unshift(donation);
    this.persist();
    return donation;
  }

  public updateDonation(id: string, updates: Partial<DonationItem>): DonationItem | null {
    const index = this.data.donations.findIndex((d) => d.id === id);
    if (index === -1) return null;

    this.data.donations[index] = {
      ...this.data.donations[index],
      ...updates,
    };
    this.persist();
    return this.data.donations[index];
  }

  // --- Users ---
  public getUsers(): Record<string, UserProfile> {
    return { ...this.data.users };
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.data.users[id];
  }

  public getActiveUser(): UserProfile {
    return this.data.users[this.data.activeUserId] || Object.values(this.data.users)[0];
  }

  public setActiveUser(id: string): boolean {
    if (this.data.users[id]) {
      this.data.activeUserId = id;
      this.persist();
      return true;
    }
    return false;
  }

  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
    if (!this.data.users[id]) return null;

    this.data.users[id] = {
      ...this.data.users[id],
      ...updates,
    };
    this.persist();
    return this.data.users[id];
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return [...this.data.notifications];
  }

  public addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
      read: false,
    };

    this.data.notifications.unshift(newNotif);
    if (this.data.notifications.length > 60) {
      this.data.notifications.pop();
    }
    this.persist();
    return newNotif;
  }

  public markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(): void {
    this.data.notifications.forEach((n) => (n.read = true));
    this.persist();
  }

  // --- Full Seed Reset ---
  public resetToDemoSeed(): void {
    this.data = {
      donations: JSON.parse(JSON.stringify(INITIAL_DONATIONS)),
      users: JSON.parse(JSON.stringify(MOCK_USERS)),
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
      activeUserId: 'donor_1',
    };
    this.persist();
  }
}

export const db = new DatabaseService();
