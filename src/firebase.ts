import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';

export const CUSTOM_CONFIG_KEY = 'neps_custom_firebase_config';

export interface FirebaseConfigObject {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
  measurementId?: string;
  oAuthClientId?: string;
}

export function getActiveFirebaseConfig(): FirebaseConfigObject {
  try {
    const saved = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.projectId === defaultFirebaseConfig.projectId) {
        return { ...defaultFirebaseConfig, ...parsed };
      } else {
        localStorage.removeItem(CUSTOM_CONFIG_KEY);
      }
    }
  } catch (e) {
    console.error('Failed to parse custom Firebase config', e);
  }
  return defaultFirebaseConfig;
}

export function saveCustomFirebaseConfig(config: Partial<FirebaseConfigObject>) {
  try {
    localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save custom Firebase config', e);
  }
}

export function resetCustomFirebaseConfig() {
  try {
    localStorage.removeItem(CUSTOM_CONFIG_KEY);
  } catch (e) {
    console.error('Failed to reset custom Firebase config', e);
  }
}

// Active configuration
export const activeConfig = getActiveFirebaseConfig();

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

// Authentication instance
export const auth = getAuth(app);

// Firestore instance connected to custom or default database
export const db = activeConfig.firestoreDatabaseId
  ? getFirestore(app, activeConfig.firestoreDatabaseId)
  : getFirestore(app);

// Standard Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Run connection test
testConnection();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
};
export type { FirebaseUser };
