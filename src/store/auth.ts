import { create } from 'zustand';
import { User } from '../config/types';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUser } from '../services/firestore';
import { signUpAndCreateProfile, getMyProfile } from '../services/auth';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: { name: string; email: string; password: string; role: 'pharmacist' | 'user'; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await getMyProfile(firebaseUser.uid);
          if (userProfile) {
            // Convert UserProfile to User type
            const userData: User = {
              uid: userProfile.uid,
              name: userProfile.displayName || 'User',
              email: userProfile.email,
              role: userProfile.role,
              phone: undefined, // Will be updated from existing data if available
              location: userProfile.location || undefined,
              createdAt: userProfile.createdAt,
            };
            
            set({ 
              firebaseUser, 
              user: userData, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            // User profile doesn't exist, sign out
            console.error('User profile not found in Firestore');
            set({ 
              firebaseUser: null, 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ 
            firebaseUser: null, 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      } else {
        set({ 
          firebaseUser: null, 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    });

    // Return unsubscribe function for cleanup
    return unsubscribe;
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUser(userCredential.user.uid);
      
      if (!userData) {
        throw new Error('User data not found');
      }

      set({ 
        firebaseUser: userCredential.user, 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (userData) => {
    try {
      set({ isLoading: true });
      
      // Use the new signUpAndCreateProfile function
      const uid = await signUpAndCreateProfile(userData.email, userData.password, userData.role);
      
      // Get the created user profile
      const userProfile = await getMyProfile(uid);
      
      if (!userProfile) {
        throw new Error('Failed to create user profile');
      }

      // Convert to your User type format
      const newUser: User = {
        uid: userProfile.uid,
        name: userData.name,
        email: userProfile.email,
        role: userProfile.role,
        phone: userData.phone,
        location: userProfile.location || undefined,
        createdAt: userProfile.createdAt,
      };

      set({ 
        firebaseUser: auth.currentUser, 
        user: newUser, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ 
        firebaseUser: null, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  updateUserData: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
    }
  },
}));
