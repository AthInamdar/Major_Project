declare module '@react-native-async-storage/async-storage' {
  export default class AsyncStorage {
    static getItem(key: string): Promise<string | null>;
    static setItem(key: string, value: string): Promise<void>;
    static removeItem(key: string): Promise<void>;
    static clear(): Promise<void>;
    static getAllKeys(): Promise<string[]>;
    static multiGet(keys: string[]): Promise<[string, string | null][]>;
    static multiSet(keyValuePairs: [string, string][]): Promise<void>;
    static multiRemove(keys: string[]): Promise<void>;
  }
}

declare module 'expo-constants' {
  export interface Constants {
    expoConfig?: {
      extra?: {
        [key: string]: any;
      };
    };
    manifest?: any;
    platform?: {
      ios?: any;
      android?: any;
    };
  }
  const Constants: Constants;
  export default Constants;
}

declare module 'expo-location' {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
    };
    timestamp: number;
  }

  export interface LocationPermissionResponse {
    status: 'granted' | 'denied' | 'undetermined';
    granted: boolean;
    canAskAgain: boolean;
  }

  export interface LocationGeocodedAddress {
    name?: string;
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  }

  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }

  export function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function getCurrentPositionAsync(options?: { accuracy?: Accuracy }): Promise<LocationObject>;
  export function reverseGeocodeAsync(location: { latitude: number; longitude: number }): Promise<LocationGeocodedAddress[]>;
  export function watchPositionAsync(options: any, callback: (location: LocationObject) => void): Promise<any>;
}

declare module 'geofire-common' {
  export function geohashQueryBounds(center: [number, number], radiusInM: number): string[][];
  export function distanceBetween(location1: [number, number], location2: [number, number]): number;
  export function geohashForLocation(location: [number, number]): string;
}

declare module 'react-native-toast-message' {
  interface ToastConfig {
    type: 'success' | 'error' | 'info';
    text1?: string;
    text2?: string;
    position?: 'top' | 'bottom';
    visibilityTime?: number;
    autoHide?: boolean;
    topOffset?: number;
    bottomOffset?: number;
  }

  export default class Toast {
    static show(config: ToastConfig): void;
    static hide(): void;
  }

  export const BaseToast: React.ComponentType<any>;
  export const ErrorToast: React.ComponentType<any>;
  export const InfoToast: React.ComponentType<any>;
}
