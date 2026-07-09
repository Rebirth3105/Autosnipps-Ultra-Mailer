import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    emailVerified: user.emailVerified,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    tier: 'page',
    usageCount: 0,
    maxUsage: 50,
    token: Math.random().toString(36).substring(2, 15).toUpperCase(), // Generate initial access token
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
  const newToken = Math.random().toString(36).substring(2, 15).toUpperCase();
  await updateDoc(doc(db, 'users', uid), {
    token: newToken,
    updatedAt: Timestamp.now()
  });
  return newToken;
};

export const validateTokenAndLogin = async (email: string, token: string) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email), where('token', '==', token), limit(1));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Return the first match. Note: In a production env, you'd usually link this to a custom token session.
    return querySnapshot.docs[0].data() as UserProfile;
  }
  return null;
};
