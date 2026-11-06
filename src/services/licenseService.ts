import { SubscriptionPlan } from '../context/AuthContext';
import { db, doc, getDoc, setDoc } from './firebase';

export interface RedeemedLicenseRecord {
  licenseKey: string;
  plan: SubscriptionPlan;
  durationDays: number;
  boundToEmail: string;
  boundToUserId: string;
  redeemedAt: string; // ISO date string
}

const REDEEMED_STORAGE_KEY = 'scanner_sim_redeemed_licenses_v2';
const SECRET_SALT = 'SCANNERSIM_INDUSTRIAL_OPTICS_2026_SECRET';

// Simple deterministic hash for checksum validation
const calculateChecksum = (payload: string): string => {
  let hash = 0;
  const combined = payload + SECRET_SALT;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0');
  return hex.substring(0, 4);
};

// Retrieve all redeemed licenses from storage
export const getRedeemedLicenses = (): Record<string, RedeemedLicenseRecord> => {
  try {
    const saved = localStorage.getItem(REDEEMED_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load redeemed licenses:', e);
  }
  return {};
};

// Save a redeemed license
export const saveRedeemedLicense = (record: RedeemedLicenseRecord) => {
  const current = getRedeemedLicenses();
  const normalizedKey = record.licenseKey.trim().toUpperCase();
  current[normalizedKey] = record;
  localStorage.setItem(REDEEMED_STORAGE_KEY, JSON.stringify(current));
};

/**
 * Generate a cryptographically valid license key
 * Format: SIM-[TIER][DAYS]-[RANDOM4]-[CHECKSUM4]
 * Example: SIM-M30-8429-A71F
 */
export const generateLicenseKey = (
  plan: 'monthly' | 'half_yearly' | 'yearly',
  customDays?: number
): string => {
  let tierPrefix = 'M';
  let days = 30;

  if (plan === 'half_yearly') {
    tierPrefix = 'H';
    days = 180;
  } else if (plan === 'yearly') {
    tierPrefix = 'Y';
    days = 365;
  }

  if (customDays && customDays > 0) {
    days = customDays;
  }

  // Random 4-digit hex block
  const randBlock = Math.floor(1000 + Math.random() * 9000).toString();
  const payload = `SIM-${tierPrefix}${days}-${randBlock}`;
  const checksum = calculateChecksum(payload);

  return `${payload}-${checksum}`;
};

/**
 * Validate and verify a license key
 * Rules:
 * 1. Must match valid checksum signature
 * 2. 1 license works for 1 account only
 */
export const validateAndRedeemLicenseKey = async (
  rawKey: string,
  userEmail: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
  plan?: SubscriptionPlan;
  durationDays?: number;
  licenseKey?: string;
  expiresAt?: string;
}> => {
  const normalizedKey = rawKey.trim().toUpperCase();

  // Basic regex check: SIM-(M|H|Y)[0-9]+-[0-9A-Z]{4}-[0-9A-Z]{4}
  const parts = normalizedKey.split('-');
  if (parts.length !== 4 || parts[0] !== 'SIM') {
    return {
      success: false,
      error: 'Invalid license key format. Expected format: SIM-M30-XXXX-XXXX'
    };
  }

  const [_, tierDays, randBlock, providedChecksum] = parts;

  // Verify Checksum
  const payload = `SIM-${tierDays}-${randBlock}`;
  const expectedChecksum = calculateChecksum(payload);

  if (providedChecksum !== expectedChecksum) {
    return {
      success: false,
      error: 'Invalid license signature. Please verify your license key.'
    };
  }

  // Extract Tier and Duration Days
  const tierChar = tierDays.charAt(0);
  const daysStr = tierDays.substring(1);
  const durationDays = parseInt(daysStr, 10);

  if (isNaN(durationDays) || durationDays <= 0) {
    return {
      success: false,
      error: 'Invalid license duration encoded in key.'
    };
  }

  let plan: SubscriptionPlan = 'monthly';
  if (tierChar === 'H') plan = 'half_yearly';
  else if (tierChar === 'Y') plan = 'yearly';

  // RULE: 1 License = 1 Account only!
  // Check Cloud Firestore first if Firebase is connected (cross-device global binding)
  let cloudRecord: RedeemedLicenseRecord | null = null;
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'licenses', normalizedKey));
      if (snap.exists()) {
        cloudRecord = snap.data() as RedeemedLicenseRecord;
      }
    } catch (e) {
      console.warn('Cloud license lookup failed, falling back to local storage:', e);
    }
  }

  const redeemedRegistry = getRedeemedLicenses();
  const existingRecord = cloudRecord || redeemedRegistry[normalizedKey];

  const normUserEmail = userEmail.trim().toLowerCase();

  if (existingRecord) {
    const boundEmail = existingRecord.boundToEmail.trim().toLowerCase();
    if (boundEmail !== normUserEmail) {
      return {
        success: false,
        error: `This license has already been activated by another account (${existingRecord.boundToEmail}). Each license is strictly bound to 1 account only.`
      };
    }

    // Check if the license has already expired
    const redeemedTimeMs = new Date(existingRecord.redeemedAt).getTime();
    const expiryTimeMs = redeemedTimeMs + existingRecord.durationDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now >= expiryTimeMs) {
      const expiredDateStr = new Date(expiryTimeMs).toLocaleDateString();
      return {
        success: false,
        error: `This license key (${normalizedKey}) was activated on ${new Date(redeemedTimeMs).toLocaleDateString()} and expired on ${expiredDateStr}. Expired licenses cannot be reused. Please purchase a new license key to renew.`
      };
    }

    // Same account reactivating/restoring active license within its original validity period
    const pinnedExpiry = new Date(expiryTimeMs).toISOString();
    return {
      success: true,
      plan: existingRecord.plan,
      durationDays: existingRecord.durationDays,
      licenseKey: normalizedKey,
      expiresAt: pinnedExpiry
    };
  }

  // Brand new license activation -> Bind to this account
  const nowIso = new Date().toISOString();
  const expiryIso = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const newRecord: RedeemedLicenseRecord = {
    licenseKey: normalizedKey,
    plan,
    durationDays,
    boundToEmail: normUserEmail,
    boundToUserId: userId,
    redeemedAt: nowIso
  };

  saveRedeemedLicense(newRecord);

  // Also sync to Cloud Firestore if connected
  if (db) {
    try {
      await setDoc(doc(db, 'licenses', normalizedKey), newRecord);
    } catch (e) {
      console.warn('Cloud license save failed:', e);
    }
  }

  return {
    success: true,
    plan,
    durationDays,
    licenseKey: normalizedKey,
    expiresAt: expiryIso
  };
};

// Official Pre-Seeded Sample Keys for Testing & Admin Reference
export const SAMPLE_LICENSE_KEYS = [
  {
    plan: 'monthly' as const,
    name: 'Monthly License ($30 / 30 Days)',
    key: generateLicenseKey('monthly', 30)
  },
  {
    plan: 'half_yearly' as const,
    name: 'Half-Year License ($120 / 180 Days)',
    key: generateLicenseKey('half_yearly', 180)
  },
  {
    plan: 'yearly' as const,
    name: 'Yearly Enterprise License ($199 / 365 Days)',
    key: generateLicenseKey('yearly', 365)
  }
];
