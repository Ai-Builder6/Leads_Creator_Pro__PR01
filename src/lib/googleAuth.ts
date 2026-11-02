import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
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
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const SCOPES = [
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

function createConfiguredProvider(forceAccountPicker = false) {
  const provider = new GoogleAuthProvider();
  for (const scope of SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    prompt: forceAccountPicker ? "select_account consent" : "consent",
  });
  return provider;
}

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory.
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (
  forceAccountPicker = false
): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const provider = createConfiguredProvider(forceAccountPicker);
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google access token from Firebase Auth");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Firestore Asset Vault & Reminder Helpers
export interface SavedAdAssetRecord {
  id: string;
  ownerId: string;
  assetType:
    | "image"
    | "logo"
    | "headline"
    | "description"
    | "facebook_ad"
    | "campaign_bundle";
  title: string;
  primaryText: string;
  secondaryText: string;
  aspectRatio: string;
  imageDataUrl: string;
  category: string;
  createdAtIso?: string;
}

export interface LinkedSheetRecord {
  id: string;
  ownerId: string;
  spreadsheetId: string;
  sheetTitle: string;
  spreadsheetUrl: string;
  autoSyncEnabled: boolean;
  updatedAtIso?: string;
}

export interface AdReminderRecord {
  id: string;
  ownerId: string;
  title: string;
  notes: string;
  dueAtIso: string;
  frequency: "once" | "daily" | "weekly";
  status: "active" | "completed";
}

function sanitizeDocId(rawId: string): string {
  return rawId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || `doc_${Date.now()}`;
}

export async function saveAdAssetToFirestore(
  asset: Omit<SavedAdAssetRecord, "ownerId">
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const docId = sanitizeDocId(asset.id);
  const path = `ad_assets/${docId}`;
  try {
    await setDoc(doc(db, "ad_assets", docId), {
      ownerId: user.uid,
      assetType: asset.assetType,
      title: String(asset.title || "Saved Asset").slice(0, 160),
      primaryText: String(asset.primaryText || "").slice(0, 2000),
      secondaryText: String(asset.secondaryText || "").slice(0, 500),
      aspectRatio: String(asset.aspectRatio || "1:1").slice(0, 20),
      imageDataUrl: String(asset.imageDataUrl || "").slice(0, 740000),
      category: String(asset.category || "Move-Out & Deep Cleaning").slice(0, 80),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteAdAssetFromFirestore(assetId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const docId = sanitizeDocId(assetId);
  const path = `ad_assets/${docId}`;
  try {
    await deleteDoc(doc(db, "ad_assets", docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToSavedAdAssets(
  onUpdate: (assets: SavedAdAssetRecord[]) => void
) {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, "ad_assets"),
    where("ownerId", "==", user.uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: SavedAdAssetRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          ownerId: d.ownerId,
          assetType: d.assetType,
          title: d.title,
          primaryText: d.primaryText || "",
          secondaryText: d.secondaryText || "",
          aspectRatio: d.aspectRatio || "1:1",
          imageDataUrl: d.imageDataUrl || "",
          category: d.category || "Move-Out & Deep Cleaning",
          createdAtIso: d.createdAt?.toDate
            ? d.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, "ad_assets");
    }
  );
}

export async function saveLinkedSheetToFirestore(
  sheet: Omit<LinkedSheetRecord, "ownerId">
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const docId = sanitizeDocId(sheet.id);
  const path = `linked_sheets/${docId}`;
  try {
    await setDoc(doc(db, "linked_sheets", docId), {
      ownerId: user.uid,
      spreadsheetId: String(sheet.spreadsheetId).slice(0, 128),
      sheetTitle: String(sheet.sheetTitle || "TidyUps Master Sheet").slice(0, 200),
      spreadsheetUrl: String(sheet.spreadsheetUrl || "").slice(0, 500),
      autoSyncEnabled: Boolean(sheet.autoSyncEnabled),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export function subscribeToLinkedSheets(
  onUpdate: (sheets: LinkedSheetRecord[]) => void
) {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, "linked_sheets"),
    where("ownerId", "==", user.uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: LinkedSheetRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          ownerId: d.ownerId,
          spreadsheetId: d.spreadsheetId,
          sheetTitle: d.sheetTitle,
          spreadsheetUrl: d.spreadsheetUrl,
          autoSyncEnabled: Boolean(d.autoSyncEnabled),
          updatedAtIso: d.updatedAt?.toDate
            ? d.updatedAt.toDate().toISOString()
            : new Date().toISOString(),
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, "linked_sheets");
    }
  );
}

export async function saveReminderToFirestore(
  reminder: Omit<AdReminderRecord, "ownerId">
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const docId = sanitizeDocId(reminder.id);
  const path = `ad_reminders/${docId}`;
  try {
    await setDoc(doc(db, "ad_reminders", docId), {
      ownerId: user.uid,
      title: String(reminder.title || "Ads Creator Reminder").slice(0, 160),
      notes: String(reminder.notes || "").slice(0, 500),
      dueAtIso: String(reminder.dueAtIso || "").slice(0, 64),
      frequency: reminder.frequency,
      status: reminder.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function completeReminderInFirestore(
  reminder: AdReminderRecord
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const docId = sanitizeDocId(reminder.id);
  const path = `ad_reminders/${docId}`;
  try {
    await updateDoc(doc(db, "ad_reminders", docId), {
      title: String(reminder.title).slice(0, 160),
      notes: String(reminder.notes).slice(0, 500),
      dueAtIso: String(reminder.dueAtIso).slice(0, 64),
      frequency: reminder.frequency,
      status: "completed",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReminderFromFirestore(
  reminderId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const docId = sanitizeDocId(reminderId);
  const path = `ad_reminders/${docId}`;
  try {
    await deleteDoc(doc(db, "ad_reminders", docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToAdReminders(
  onUpdate: (reminders: AdReminderRecord[]) => void
) {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, "ad_reminders"),
    where("ownerId", "==", user.uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: AdReminderRecord[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          ownerId: d.ownerId,
          title: d.title,
          notes: d.notes || "",
          dueAtIso: d.dueAtIso || "",
          frequency: d.frequency || "daily",
          status: d.status || "active",
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, "ad_reminders");
    }
  );
}
