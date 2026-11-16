import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc, setDoc } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_CONFIG_KEY = 'scanner_sim_firebase_config_v1';

// ==============================================================================
// PERMANENT BUILT-IN FIREBASE CONFIGURATION
// To connect Firebase permanently for ALL users across any computer, browser,
// or deployed URL without needing .env variables, paste your web app
// config values from the Firebase Console (Project Settings -> General -> Your apps) below:
// ==============================================================================
export const PERMANENT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

// Load config from permanent config, environment variables, or localStorage
export const getStoredFirebaseConfig = (): FirebaseConfig | null => {
  // 1. Check permanent built-in config first (zero-configuration production deployment)
  if (PERMANENT_FIREBASE_CONFIG.apiKey && PERMANENT_FIREBASE_CONFIG.projectId) {
    return PERMANENT_FIREBASE_CONFIG;
  }

  // 2. Check Vite environment variables (VITE_FIREBASE_*)
  const metaEnv = (import.meta as any).env || {};
  const envApiKey = metaEnv.VITE_FIREBASE_API_KEY;
  const envProjectId = metaEnv.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: metaEnv.VITE_FIREBASE_APP_ID || ''
    };
  }

  // 3. Fall back to localStorage (user-configured via Admin UI)
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.apiKey && parsed?.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse Firebase config from localStorage:', e);
  }

  return null;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  // Reload window to re-initialize Firebase cleanly with new keys
  window.location.reload();
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(STORAGE_CONFIG_KEY);
  window.location.reload();
};

// Initialize Firebase App
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const config = getStoredFirebaseConfig();

if (config && config.apiKey && config.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
    try {
      db = getFirestore(app);
    } catch (e) {
      console.warn('Firestore optional init:', e);
    }
  } catch (err) {
    console.error('Failed to initialize Firebase app:', err);
  }
}

export const isFirebaseConfigured = (): boolean => {
  return auth !== null;
};

export {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged
};

export type { FirebaseUser };
