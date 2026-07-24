import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { generateSecureToken, hashToken, isTokenExpired, TOKEN_TTL_MS } from '../lib/tokenGenerator';

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firestoreDatabaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  tier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
  subscriptionId?: string;
  token?: string;
  usageCount: number;
  maxUsage: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
};

export const createUserProfile = async (user: User): Promise<UserProfile> => {
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    emailVerified: user.emailVerified,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    tier: 'page',
    usageCount: 0,
    maxUsage: 50,
    token: tokenHash, // Store hash instead of plain token
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
};

export const updateUsage = async (uid: string, count: number = 1) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    usageCount: increment(count),
    updatedAt: Timestamp.now()
  });
};

export const regenerateToken = async (uid: string) => {
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  await updateDoc(doc(db, 'users', uid), {
    token: tokenHash, // Store hash instead of plain token
    updatedAt: Timestamp.now()
  });
  return token;
};

export const validateTokenAndLogin = async (email: string, token: string) => {
  const tokenHash = await hashToken(token);
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email), where('token', '==', tokenHash), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userData = querySnapshot.docs[0].data() as UserProfile;
    // Check if token has expired
    if (userData.createdAt && isTokenExpired(userData.createdAt)) {
      return null; // Token expired
    }
    return userData;
  }
  return null;
};
