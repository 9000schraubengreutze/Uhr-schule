import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

export const APP_OWNER_EMAIL = 'justmotti@gmail.com';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'owner' | 'admin' | 'user';
}

export interface GameSettingsState {
  allowGuestPlaying: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canPlayGames: boolean;
  gameSettings: GameSettingsState;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleGuestPlay: (allowed: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameSettings, setGameSettings] = useState<GameSettingsState>({
    allowGuestPlaying: false,
  });

  // Listen to Global Game Settings
  useEffect(() => {
    try {
      const unsubSettings = onSnapshot(
        doc(db, 'settings', 'games'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as GameSettingsState;
            setGameSettings({
              allowGuestPlaying: Boolean(data.allowGuestPlaying),
            });
          }
        },
        (error) => {
          console.warn('Game settings snapshot listener notice:', error.message);
        }
      );
      return () => unsubSettings();
    } catch {
      // Fallback
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isOwnerByEmail = currentUser.email?.toLowerCase() === APP_OWNER_EMAIL.toLowerCase();

        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          let role: 'owner' | 'admin' | 'user' = isOwnerByEmail ? 'owner' : 'user';

          if (userSnap.exists()) {
            const existingRole = userSnap.data()?.role;
            if (isOwnerByEmail) {
              role = 'owner';
            } else if (existingRole === 'admin' || existingRole === 'owner') {
              role = existingRole;
            }
          }

          const updatedProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            role,
          };

          setProfile(updatedProfile);

          // Update user doc with merge
          await setDoc(
            userRef,
            {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: updatedProfile.displayName,
              role,
              lastLogin: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Could not sync user profile in Firestore:', err);
          // Set fallback profile
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'User',
            role: isOwnerByEmail ? 'owner' : 'user',
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isOwner = Boolean(
    user && (user.email?.toLowerCase() === APP_OWNER_EMAIL.toLowerCase() || profile?.role === 'owner')
  );

  const isAdmin = isOwner || profile?.role === 'admin';

  // Games are unlocked for all users without login restriction
  const canPlayGames = true;

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const toggleGuestPlay = async (allowed: boolean) => {
    if (!isAdmin) return;
    try {
      await setDoc(
        doc(db, 'settings', 'games'),
        {
          allowGuestPlaying: allowed,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || 'admin',
        },
        { merge: true }
      );
      setGameSettings({ allowGuestPlaying: allowed });
    } catch (err) {
      console.error('Error updating game access settings:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isOwner,
        isAdmin,
        canPlayGames,
        gameSettings,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        toggleGuestPlay,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
