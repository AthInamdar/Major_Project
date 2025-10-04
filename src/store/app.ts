import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location } from '../config/types';

interface AppState {
  hasSeenOnboarding: boolean;
  userLocation: Location | null;
  isLocationLoading: boolean;
  setOnboardingCompleted: () => Promise<void>;
  setUserLocation: (location: Location | null) => void;
  setLocationLoading: (loading: boolean) => void;
  loadOnboardingStatus: () => Promise<void>;
}

const ONBOARDING_KEY = 'nk_onboarding_seen';

export const useAppStore = create<AppState>((set, get) => ({
  hasSeenOnboarding: false,
  userLocation: null,
  isLocationLoading: false,

  setOnboardingCompleted: async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      set({ hasSeenOnboarding: true });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  setUserLocation: (location) => {
    set({ userLocation: location });
  },

  setLocationLoading: (loading) => {
    set({ isLocationLoading: loading });
  },

  loadOnboardingStatus: async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ hasSeenOnboarding: hasSeenOnboarding === 'true' });
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      set({ hasSeenOnboarding: false });
    }
  },
}));
