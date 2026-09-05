import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { JournalEntry, AppSettings } from '../types';
import firebaseConfigJson from '../../firebase-applet-config.json';

export interface UserDraftData {
  strategy?: string;
  checklist?: any;
  parameters?: any;
  confirmations?: any;
  checklistCompletion?: number;
  pair?: string;
  direction?: string;
  timeframe?: string;
  entryPrice?: string;
  stopLossPrice?: string;
  takeProfitPrice?: string;
  tradeNote?: string;
  emotionalState?: string;
  marketBias?: string;
  lastUpdated?: number;
  updatedAt?: any;
  [key: string]: any;
}

export interface NoTradeEntryData {
  id: string;
  timestamp: number;
  dateStr?: string;
  timeStr?: string;
  reason: string;
  strategy?: string;
  pair?: string;
  session?: string;
  notes: string;
  createdAt?: any;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseInitialized = false;

try {
  if (firebaseConfigJson && firebaseConfigJson.apiKey && firebaseConfigJson.projectId) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigJson);
    auth = getAuth(app);
    const dbId = (firebaseConfigJson as any).firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      db = getFirestore(app, dbId);
    } else {
      db = getFirestore(app);
    }
    isFirebaseInitialized = true;
  }
} catch (err) {
  console.warn('Firebase initialization skipped or fell back to offline demo mode:', err);
  isFirebaseInitialized = false;
}

export { app, auth, db, isFirebaseInitialized };

// Auth helpers
export async function registerWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not initialized. Running in Demo Mode.');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not initialized. Running in Demo Mode.');
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function loginWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not initialized. Running in Demo Mode.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not initialized. Running in Demo Mode.');
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { subscribeToAuth as subscribeToAuthChanges };

// Firestore User-Scoped Operations

/**
 * Save user draft state (Checklist, trade parameters) debounced
 */
export async function saveUserDraft(userId: string, draft: UserDraftData): Promise<void> {
  if (!db) return;
  const draftRef = doc(db, 'users', userId, 'drafts', 'current');
  await setDoc(
    draftRef,
    {
      ...draft,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Load user draft
 */
export async function loadUserDraft(userId: string): Promise<UserDraftData | null> {
  if (!db) return null;
  const draftRef = doc(db, 'users', userId, 'drafts', 'current');
  const snap = await getDoc(draftRef);
  if (snap.exists()) {
    return snap.data() as UserDraftData;
  }
  return null;
}

/**
 * Save user settings
 */
export async function saveUserSettings(userId: string, settings: Partial<AppSettings>): Promise<void> {
  if (!db) return;
  const settingsRef = doc(db, 'users', userId, 'settings', 'current');
  await setDoc(
    settingsRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Load user settings
 */
export async function loadUserSettings(userId: string): Promise<Partial<AppSettings> | null> {
  if (!db) return null;
  const settingsRef = doc(db, 'users', userId, 'settings', 'current');
  const snap = await getDoc(settingsRef);
  if (snap.exists()) {
    return snap.data() as Partial<AppSettings>;
  }
  return null;
}

/**
 * Save trade to Trading Journal collection: users/{userId}/trading_journal/{tradeId}
 */
export async function saveJournalEntryToFirestore(
  userId: string,
  entry: JournalEntry
): Promise<void> {
  if (!db) return;
  const tradeRef = doc(db, 'users', userId, 'trading_journal', entry.id);
  await setDoc(tradeRef, {
    id: entry.id,
    timestamp: serverTimestamp(),
    localTimestamp: entry.timestamp,
    dateStr: entry.dateStr,
    timeStr: entry.timeStr,
    pair: entry.pair,
    strategy: entry.strategy,
    direction: entry.direction,
    timeframe: (entry as any).timeframe || 'M5',
    entry: entry.entryPrice,
    stopLoss: entry.stopLossPrice,
    takeProfit: entry.takeProfitPrice,
    riskPercent: entry.riskPercentage,
    cashRisk: entry.cashRisk,
    positionSize: entry.positionSizeLots,
    rr: entry.rrRatio,
    session: entry.session,
    marketBias: entry.bias,
    emotionalState: entry.emotionalState,
    checklistCompletion: 100,
    reason: entry.reason,
    notes: entry.notes,
    status: entry.status,
    outcome: entry.outcome,
    createdAt: serverTimestamp(),
  });
}

/**
 * Update trade outcome or notes in Trading Journal
 */
export async function updateJournalEntryInFirestore(
  userId: string,
  tradeId: string,
  updates: Partial<JournalEntry>
): Promise<void> {
  if (!db) return;
  const tradeRef = doc(db, 'users', userId, 'trading_journal', tradeId);
  await setDoc(tradeRef, updates, { merge: true });
}

/**
 * Save No-Trade Log to: users/{userId}/no_trade_logs/{logId}
 */
export async function saveNoTradeLogToFirestore(
  userId: string,
  log: NoTradeEntryData
): Promise<void> {
  if (!db) return;
  const logRef = doc(db, 'users', userId, 'no_trade_logs', log.id);
  await setDoc(logRef, {
    id: log.id,
    timestamp: serverTimestamp(),
    localTimestamp: log.timestamp,
    dateStr: log.dateStr || '',
    timeStr: log.timeStr || '',
    reason: log.reason,
    strategy: log.strategy || 'GENERAL',
    pair: log.pair || 'GENERAL',
    session: log.session || '',
    notes: log.notes,
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribe to user trading journal
 */
export function subscribeUserJournal(
  userId: string,
  onEntries: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }
  const journalColl = collection(db, 'users', userId, 'trading_journal');
  const q = query(journalColl, orderBy('localTimestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        entries.push({
          id: d.id || docSnap.id,
          timestamp: d.localTimestamp || (d.timestamp?.toMillis ? d.timestamp.toMillis() : Date.now()),
          dateStr: d.dateStr || '',
          timeStr: d.timeStr || '',
          pair: d.pair || 'EURUSD',
          strategy: d.strategy || 'ICT_SILVER_BULLET',
          direction: d.direction || 'LONG',
          entryPrice: Number(d.entry || 0),
          stopLossPrice: Number(d.stopLoss || 0),
          takeProfitPrice: Number(d.takeProfit || 0),
          riskPercentage: Number(d.riskPercent || 1),
          cashRisk: Number(d.cashRisk || 0),
          positionSizeLots: Number(d.positionSize || 0),
          rrRatio: Number(d.rr || 0),
          session: d.session || '',
          bias: d.marketBias || 'NEUTRAL',
          emotionalState: d.emotionalState || 'CALM',
          reason: d.reason || '',
          notes: d.notes || '',
          status: d.status || 'APPROVED',
          outcome: d.outcome || 'OPEN',
          isNoTrade: false,
        });
      });
      onEntries(entries);
    },
    (err) => {
      console.error('Firestore journal subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to user No-Trade logs
 */
export function subscribeUserNoTradeLogs(
  userId: string,
  onLogs: (logs: NoTradeEntryData[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) {
    return () => {};
  }
  const noTradeColl = collection(db, 'users', userId, 'no_trade_logs');
  const q = query(noTradeColl, orderBy('localTimestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: NoTradeEntryData[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        logs.push({
          id: d.id || docSnap.id,
          timestamp: d.localTimestamp || (d.timestamp?.toMillis ? d.timestamp.toMillis() : Date.now()),
          dateStr: d.dateStr || '',
          timeStr: d.timeStr || '',
          reason: d.reason || '',
          strategy: d.strategy || 'ICT_SILVER_BULLET',
          pair: d.pair || 'EURUSD',
          session: d.session || '',
          notes: d.notes || '',
        });
      });
      onLogs(logs);
    },
    (err) => {
      console.error('Firestore no_trade_logs subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save user compounding plan to Firestore
 */
export async function saveCompoundingPlanToFirestore(
  userId: string,
  plan: any
): Promise<void> {
  if (!db) return;
  try {
    const planRef = doc(db, 'users', userId, 'compounding_plans', 'active_plan');
    await setDoc(planRef, {
      ...plan,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save compounding plan to Firestore:', err);
  }
}

/**
 * Fetch user compounding plan from Firestore
 */
export async function fetchCompoundingPlanFromFirestore(
  userId: string
): Promise<any | null> {
  if (!db) return null;
  try {
    const planRef = doc(db, 'users', userId, 'compounding_plans', 'active_plan');
    const snap = await getDoc(planRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch compounding plan from Firestore:', err);
    return null;
  }
}

