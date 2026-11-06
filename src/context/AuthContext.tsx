import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  isFirebaseConfigured,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  FirebaseUser
} from '../services/firebase';
import {
  validateAndRedeemLicenseKey,
  getRedeemedLicenses
} from '../services/licenseService';

export type SubscriptionPlan = 'trial' | 'monthly' | 'half_yearly' | 'yearly';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company?: string;
  isEmailVerified: boolean;
  registeredAt: string; // ISO date string
  plan: SubscriptionPlan;
  planActivatedAt: string; // ISO date string
  trialDaysTotal: number;
  // License Management fields
  activeLicenseKey?: string;
  licenseDurationDays?: number;
  licenseExpiresAt?: string; // ISO date string
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isSimSetupLocked: boolean;
  trialDaysRemaining: number;
  licenseDaysRemaining: number;
  isFirebaseActive: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  register: (name: string, email: string, password?: string, company?: string) => Promise<{ success: boolean; requiresVerification: boolean; error?: string }>;
  checkEmailVerified: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  activateLicenseKey: (key: string) => Promise<{ success: boolean; error?: string; plan?: SubscriptionPlan; durationDays?: number }>;
  verifyEmailCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: () => Promise<string>;
  logout: () => void;
  upgradePlan: (plan: 'monthly' | 'half_yearly' | 'yearly') => void;
  simulateTrialExpiry: () => void;
  resetTrial: () => void;
  pendingEmail: string | null;
  verificationCodeSent: string | null;
}

const TRIAL_DAYS = 15;

const DEFAULT_USER: UserProfile = {
  id: 'usr_demo_industrial',
  name: 'Automation Engineer',
  email: 'engineer@vision-tech.com',
  company: 'Industrial Automation Systems',
  isEmailVerified: true,
  registeredAt: new Date().toISOString(),
  plan: 'trial',
  planActivatedAt: new Date().toISOString(),
  trialDaysTotal: TRIAL_DAYS
};

const STORAGE_KEY = 'scanner_sim_auth_user';
const PLAN_PREFIX = 'scanner_sim_plan_';
const ACCOUNTS_DB_KEY = 'scanner_sim_accounts_registry_v2';

// Retrieve all locally saved registered accounts
export const getStoredAccounts = (): Record<string, UserProfile> => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse accounts registry:', e);
  }
  return {};
};

// Save or update an account permanently in the registry
export const saveAccountToDb = (acc: UserProfile) => {
  try {
    const accounts = getStoredAccounts();
    const normEmail = acc.email.toLowerCase().trim();
    accounts[normEmail] = {
      ...acc,
      email: normEmail
    };
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed to save account to registry:', e);
  }
};

// Cross-reference account with any redeemed single-account license
export const syncAccountWithLicenses = (acc: UserProfile): UserProfile => {
  const normEmail = acc.email.toLowerCase().trim();
  const redeemed = getRedeemedLicenses();
  
  // Find any active or historical license bound to this email
  const matchingLicense = Object.values(redeemed).find(
    (rec) => rec.boundToEmail.toLowerCase().trim() === normEmail
  );

  if (matchingLicense) {
    const redeemedTimeMs = new Date(matchingLicense.redeemedAt).getTime();
    const expiryTimeMs = redeemedTimeMs + matchingLicense.durationDays * 24 * 60 * 60 * 1000;
    
    return {
      ...acc,
      plan: matchingLicense.plan,
      activeLicenseKey: matchingLicense.licenseKey,
      licenseDurationDays: matchingLicense.durationDays,
      licenseExpiresAt: new Date(expiryTimeMs).toISOString(),
      planActivatedAt: matchingLicense.redeemedAt
    };
  }

  return acc;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isFirebaseActive = isFirebaseConfigured();

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.email) {
          const accounts = getStoredAccounts();
          const normEmail = parsed.email.toLowerCase().trim();
          const current = accounts[normEmail] || parsed;
          const synced = syncAccountWithLicenses(current);
          return {
            ...synced,
            trialDaysTotal: synced.trialDaysTotal || TRIAL_DAYS,
            plan: synced.plan || 'trial',
            registeredAt: synced.registeredAt || new Date().toISOString()
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load auth from storage:', e);
    }
    return null; // Unauthenticated by default until user registers or signs in
  });

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingUserData, setPendingUserData] = useState<Partial<UserProfile> | null>(null);
  const [verificationCodeSent, setVerificationCodeSent] = useState<string | null>(null);

  // Sync Firebase Auth state changes
  useEffect(() => {
    if (!isFirebaseActive || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const normEmail = (fbUser.email || '').toLowerCase().trim();
        const accounts = getStoredAccounts();
        const localData = accounts[normEmail];

        const registeredAt = localData?.registeredAt || fbUser.metadata.creationTime || new Date().toISOString();
        const rawProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || localData?.name || normEmail.split('@')[0] || 'Engineer',
          email: normEmail,
          company: localData?.company || 'Vision Systems',
          isEmailVerified: fbUser.emailVerified,
          registeredAt,
          plan: localData?.plan || 'trial',
          planActivatedAt: localData?.planActivatedAt || registeredAt,
          trialDaysTotal: TRIAL_DAYS,
          activeLicenseKey: localData?.activeLicenseKey,
          licenseDurationDays: localData?.licenseDurationDays,
          licenseExpiresAt: localData?.licenseExpiresAt
        };

        const syncedProfile = syncAccountWithLicenses(rawProfile);
        saveAccountToDb(syncedProfile);
        setUser(syncedProfile);
      } else {
        // Firebase signed out
        if (localStorage.getItem('scanner_sim_firebase_active_session')) {
          setUser(null);
          localStorage.removeItem('scanner_sim_firebase_active_session');
        }
      }
    });

    return () => unsubscribe();
  }, [isFirebaseActive]);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      saveAccountToDb(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      // Also persist user's subscription plan keyed by id
      localStorage.setItem(`${PLAN_PREFIX}${user.id}`, JSON.stringify({
        company: user.company,
        plan: user.plan,
        registeredAt: user.registeredAt,
        planActivatedAt: user.planActivatedAt,
        trialDaysTotal: user.trialDaysTotal,
        activeLicenseKey: user.activeLicenseKey,
        licenseDurationDays: user.licenseDurationDays,
        licenseExpiresAt: user.licenseExpiresAt
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // 1. Calculate days remaining in 15-day evaluation trial
  const calculateTrialDaysRemaining = (usr: UserProfile | null): number => {
    if (!usr || usr.plan !== 'trial') return 0;
    const regDate = new Date(usr.registeredAt).getTime();
    const now = Date.now();
    const elapsedDays = Math.floor((now - regDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, usr.trialDaysTotal - elapsedDays);
  };

  // 2. Calculate days remaining on assigned License Key
  const calculateLicenseDaysRemaining = (usr: UserProfile | null): number => {
    if (!usr || usr.plan === 'trial') return 0;
    if (!usr.licenseExpiresAt) return 0;
    const expiryTime = new Date(usr.licenseExpiresAt).getTime();
    const now = Date.now();
    const remainingMs = expiryTime - now;
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  };

  const trialDaysRemaining = calculateTrialDaysRemaining(user);
  const licenseDaysRemaining = calculateLicenseDaysRemaining(user);

  // Sim setup Tab is locked when:
  // - User is not signed in (user === null)
  // - on trial AND trial days <= 0
  // - OR on license AND license duration has expired!
  const isSimSetupLocked = user === null || (
    (user.plan === 'trial' && trialDaysRemaining <= 0) ||
    (user.plan !== 'trial' && licenseDaysRemaining <= 0)
  );

  // Sign In
  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const normEmail = email.toLowerCase().trim();

    if (isFirebaseActive && auth) {
      try {
        if (!password) {
          return { success: false, error: 'Password is required to sign in.' };
        }
        const userCredential = await signInWithEmailAndPassword(auth, normEmail, password);
        localStorage.setItem('scanner_sim_firebase_active_session', 'true');

        if (!userCredential.user.emailVerified) {
          setPendingEmail(userCredential.user.email);
          return {
            success: true,
            requiresVerification: true
          };
        }
        return { success: true };
      } catch (err: any) {
        let msg = 'Failed to sign in. Please verify your email and password.';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password. Please check your credentials.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many failed attempts. Please wait a moment and try again.';
        }
        return { success: false, error: msg };
      }
    }

    // Local / Offline Persistent Sign-In Flow
    const accounts = getStoredAccounts();
    const existing = accounts[normEmail];

    let resolvedProfile: UserProfile;

    if (existing) {
      // Existing registered account recognized! Sync with any active redeemed license
      resolvedProfile = syncAccountWithLicenses(existing);
    } else {
      // Initialize account in registry
      const rawUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: normEmail.split('@')[0].replace(/[._]/g, ' '),
        email: normEmail,
        company: 'Vision Systems Engineering',
        isEmailVerified: true,
        registeredAt: new Date().toISOString(),
        plan: 'trial',
        planActivatedAt: new Date().toISOString(),
        trialDaysTotal: TRIAL_DAYS
      };
      resolvedProfile = syncAccountWithLicenses(rawUser);
    }

    saveAccountToDb(resolvedProfile);
    setUser(resolvedProfile);
    return { success: true };
  };

  // Sign Up / Register with 15-Day Free Evaluation
  const register = async (
    name: string,
    email: string,
    password?: string,
    company?: string
  ): Promise<{ success: boolean; requiresVerification: boolean; error?: string }> => {
    if (!email || !email.includes('@')) {
      return { success: false, requiresVerification: false, error: 'Please enter a valid email address.' };
    }
    if (!name.trim()) {
      return { success: false, requiresVerification: false, error: 'Please enter your name.' };
    }

    const normEmail = email.toLowerCase().trim();

    // Check if account is already registered in local database
    if (!isFirebaseActive) {
      const accounts = getStoredAccounts();
      if (accounts[normEmail]) {
        return {
          success: false,
          requiresVerification: false,
          error: `An account for ${normEmail} is already registered. Please sign in via the Login button instead.`
        };
      }
    }

    if (isFirebaseActive && auth) {
      if (!password || password.length < 6) {
        return { success: false, requiresVerification: false, error: 'Password must be at least 6 characters.' };
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
        // Send real verification link to user's inbox
        await sendEmailVerification(userCredential.user);
        
        localStorage.setItem('scanner_sim_firebase_active_session', 'true');
        setPendingEmail(email.trim());
        setPendingUserData({ name: name.trim(), email: email.trim(), company: company?.trim() });

        return { success: true, requiresVerification: true };
      } catch (err: any) {
        let msg = 'Registration failed. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'An account with this email already exists. Please sign in instead.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password is too weak. Please choose a stronger password.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'The email address format is invalid.';
        }
        return { success: false, requiresVerification: false, error: msg };
      }
    }

    // Local Simulation Mode (Fallback when Firebase is not configured yet)
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCodeSent(generatedCode);
    setPendingEmail(email);
    setPendingUserData({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || 'Industrial Robotics'
    });

    return { success: true, requiresVerification: true };
  };

  // Check if email was verified via the link
  const checkEmailVerified = async (): Promise<boolean> => {
    if (isFirebaseActive && auth?.currentUser) {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      if (verified && user) {
        setUser({ ...user, isEmailVerified: true });
      }
      return verified;
    }
    return user?.isEmailVerified ?? false;
  };

  // Resend verification email
  const resendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseActive && auth?.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      } catch (err: any) {
        if (err.code === 'auth/too-many-requests') {
          return { success: false, error: 'Please wait a minute before requesting another verification email.' };
        }
        return { success: false, error: 'Failed to resend verification email.' };
      }
    }
    return { success: true };
  };

  // Password Reset Email
  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please provide a valid email.' };
    }
    if (isFirebaseActive && auth) {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        return { success: true };
      } catch (err: any) {
        return { success: false, error: 'Failed to send password reset email. Ensure the email is registered.' };
      }
    }
    return { success: true };
  };

  // Activate a License Key (1 License works for 1 Account only for assigned duration)
  const activateLicenseKey = async (
    key: string
  ): Promise<{ success: boolean; error?: string; plan?: SubscriptionPlan; durationDays?: number }> => {
    if (!user) {
      return { success: false, error: 'Please sign in or register before activating a license.' };
    }

    const validation = await validateAndRedeemLicenseKey(key, user.email, user.id);
    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    const durationDays = validation.durationDays || 30;
    const expiresAt = validation.expiresAt || new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const updatedUser: UserProfile = {
      ...user,
      plan: validation.plan || 'monthly',
      activeLicenseKey: validation.licenseKey,
      licenseDurationDays: durationDays,
      licenseExpiresAt: expiresAt,
      planActivatedAt: new Date().toISOString()
    };

    saveAccountToDb(updatedUser);
    setUser(updatedUser);
    return {
      success: true,
      plan: validation.plan,
      durationDays
    };
  };

  // Local OTP verification (for offline / simulation mode)
  const verifyEmailCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!code || code.trim() !== verificationCodeSent) {
      return { success: false, error: 'Invalid 6-digit verification code. Please check and try again.' };
    }

    const normEmail = (pendingEmail || 'engineer@company.com').toLowerCase().trim();
    const accounts = getStoredAccounts();
    const existing = accounts[normEmail];

    const rawUser: UserProfile = {
      id: existing?.id || `usr_${Date.now()}`,
      name: pendingUserData?.name || existing?.name || normEmail.split('@')[0].replace(/[._]/g, ' '),
      email: normEmail,
      company: pendingUserData?.company || existing?.company || 'Vision Systems Inc',
      isEmailVerified: true,
      registeredAt: existing?.registeredAt || new Date().toISOString(),
      plan: existing?.plan || 'trial',
      planActivatedAt: existing?.planActivatedAt || new Date().toISOString(),
      trialDaysTotal: TRIAL_DAYS,
      activeLicenseKey: existing?.activeLicenseKey,
      licenseDurationDays: existing?.licenseDurationDays,
      licenseExpiresAt: existing?.licenseExpiresAt
    };

    const finalUser = syncAccountWithLicenses(rawUser);
    saveAccountToDb(finalUser);
    setUser(finalUser);
    setPendingEmail(null);
    setPendingUserData(null);
    setVerificationCodeSent(null);

    return { success: true };
  };

  const resendVerificationCode = async (): Promise<string> => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCodeSent(newCode);
    return newCode;
  };

  const logout = () => {
    if (isFirebaseActive && auth) {
      signOut(auth).catch((e) => console.warn('Firebase signout error:', e));
      localStorage.removeItem('scanner_sim_firebase_active_session');
    }
    setUser(null);
  };

  // Quick helper to upgrade plan with duration (e.g. for testing)
  const upgradePlan = (newPlan: 'monthly' | 'half_yearly' | 'yearly') => {
    const durationDays = newPlan === 'yearly' ? 365 : newPlan === 'half_yearly' ? 180 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    if (!user) {
      setUser({
        ...DEFAULT_USER,
        plan: newPlan,
        licenseDurationDays: durationDays,
        licenseExpiresAt: expiresAt,
        planActivatedAt: new Date().toISOString()
      });
      return;
    }

    setUser({
      ...user,
      plan: newPlan,
      licenseDurationDays: durationDays,
      licenseExpiresAt: expiresAt,
      planActivatedAt: new Date().toISOString()
    });
  };

  const simulateTrialExpiry = () => {
    if (!user) return;
    const pastDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString();
    setUser({
      ...user,
      plan: 'trial',
      registeredAt: pastDate,
      licenseExpiresAt: pastDate
    });
  };

  const resetTrial = () => {
    if (!user) return;
    setUser({
      ...user,
      plan: 'trial',
      registeredAt: new Date().toISOString(),
      trialDaysTotal: TRIAL_DAYS,
      activeLicenseKey: undefined,
      licenseDurationDays: undefined,
      licenseExpiresAt: undefined
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isSimSetupLocked,
        trialDaysRemaining,
        licenseDaysRemaining,
        isFirebaseActive,
        login,
        register,
        checkEmailVerified,
        resendVerificationEmail,
        sendPasswordReset,
        activateLicenseKey,
        verifyEmailCode,
        resendVerificationCode,
        logout,
        upgradePlan,
        simulateTrialExpiry,
        resetTrial,
        pendingEmail,
        verificationCodeSent
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
