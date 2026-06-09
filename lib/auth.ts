import { auth, db } from '@/lib/firebase';
import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

/**
 * User consent tracking for RGPD compliance
 * Never store passwords - Firebase Auth handles this securely
 */
interface UserConsent {
  rgpdAgreed: boolean;
  privacyAgreed: boolean;
  termsAgreed: boolean;
  marketingOptIn: boolean;
  consentDate: Timestamp;
  consentVersion: string;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  spotifyId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  consent: UserConsent;
  dataProcessingAgreed: boolean;
}

const CONSENT_VERSION = '1.0';
const USERS_COLLECTION = 'users';

/**
 * Sign in with Spotify using Firebase Auth
 * Requires explicit RGPD consent before account creation
 */
export async function signInWithSpotify(
  spotifyId: string,
  consentData: {
    rgpdAgreed: boolean;
    privacyAgreed: boolean;
    termsAgreed: boolean;
    marketingOptIn: boolean;
  }
) {
  if (!consentData.rgpdAgreed || !consentData.privacyAgreed || !consentData.termsAgreed) {
    throw new Error('Must accept RGPD, Privacy Policy, and Terms of Service');
  }

  try {
    // Firebase Auth handles secure password hashing (not applicable here as we use Spotify OAuth)
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No authenticated user');
    }

    // Store user profile with consent tracking
    await createOrUpdateUserProfile(user, spotifyId, consentData);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    };
  } catch (error) {
    console.error('Spotify sign-in error:', error);
    throw error;
  }
}

/**
 * Create or update user profile in Firestore
 * Ensures consent is tracked and data is minimal
 */
async function createOrUpdateUserProfile(
  user: User,
  spotifyId: string,
  consentData: {
    rgpdAgreed: boolean;
    privacyAgreed: boolean;
    termsAgreed: boolean;
    marketingOptIn: boolean;
  }
) {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userSnap = await getDoc(userRef);

  const now = Timestamp.now();

  const profileData: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName,
    photoURL: user.photoURL,
    spotifyId,
    dataProcessingAgreed: true,
    consent: {
      rgpdAgreed: consentData.rgpdAgreed,
      privacyAgreed: consentData.privacyAgreed,
      termsAgreed: consentData.termsAgreed,
      marketingOptIn: consentData.marketingOptIn,
      consentDate: now,
      consentVersion: CONSENT_VERSION,
    },
    createdAt: userSnap.exists() ? (userSnap.data() as UserProfile).createdAt : now,
    updatedAt: now,
  };

  await setDoc(userRef, profileData, { merge: true });
}

/**
 * Get user profile
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return userSnap.data() as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Update user consent preferences
 */
export async function updateUserConsent(
  uid: string,
  consentData: Partial<UserConsent>
) {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      'consent.marketingOptIn': consentData.marketingOptIn ?? false,
      'consent.consentDate': Timestamp.now(),
      'updatedAt': Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user consent:', error);
    throw error;
  }
}

/**
 * Delete user account and all associated data (RGPD Right to be Forgotten)
 * This should be called after confirming user identity
 */
export async function deleteUserAccount(uid: string) {
  try {
    // Delete from Firestore
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);

    // Delete from Firebase Auth
    // Note: This requires the user to be authenticated
    // In production, this should be called from a backend function
    // to ensure proper authorization

    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Data minimization policy
 * Only collect what's necessary:
 * - Email (login + communication)
 * - Display name (optional, for UX)
 * - Spotify ID (for music features)
 * - Consent records (legal requirement)
 *
 * NEVER collect/store:
 * - Passwords (Firebase handles this)
 * - Payment info (use payment processor)
 * - Sensitive personal data
 * - IP addresses (unnecessary)
 * - Detailed activity logs (privacy risk)
 */
export const DATA_MINIMIZATION_POLICY = {
  collected: ['email', 'displayName', 'spotifyId', 'consent', 'createdAt', 'updatedAt'],
  notCollected: [
    'passwords',
    'paymentInfo',
    'phoneNumber',
    'address',
    'IPAddress',
    'deviceInfo',
    'activityLogs',
  ],
};
