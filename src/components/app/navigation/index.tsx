import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import { useAuthStore } from '../../../store/auth';
import { useAppStore } from '../../../store/app';
import { AuthGuard, RoleGuard } from './guards';

// Import screens
import OnboardingScreen from '../screens/Onboarding';
import LoginScreen from '../screens/Auth/Login';
import SignupScreen from '../screens/Auth/Signup';
import HomeScreen from '../screens/User/Home';
import MedicineDetailsScreen from '../screens/User/Details';
import LocationScreen from '../screens/Location';
import VedAIScreen from '../screens/User/VedAI';
import UploadScreen from '../screens/Pharmacist/Upload';
import MyListingsScreen from '../screens/Pharmacist/MyListings';
import MapNearbyScreen from '../screens/User/MapNearby';
import CartScreen from '../screens/User/Cart';
import ProfileScreen from '../screens/Profile';

import { RootStackParamList, AuthStackParamList, MainTabParamList, HomeStackParamList } from '../../../config/types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',              // bg-white
  },
  appTitle: {
    fontSize: 18,                         // text-lg
    fontWeight: '600',                    // font-semibold
    color: '#2d3748',                     // text-gray-800 -- tweak if using your own color system
  },
  loadingText: {
    color: '#718096',                     // text-gray-600
    marginTop: 8,                         // mt-2
  },
});



const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    <HomeStack.Screen name="MedicineDetails" component={MedicineDetailsScreen} />
    <HomeStack.Screen name="Location" component={LocationScreen} />
    <HomeStack.Screen name="VedAI" component={VedAIScreen} />
  </HomeStack.Navigator>
);

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const MainTabNavigator = () => {
  const { user } = useAuthStore();
  const isPharmacist = user?.role === 'pharmacist';

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Upload':
              iconName = focused ? 'camera' : 'camera-outline';
              break;
            case 'MyListings':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Cart':
              iconName = focused ? 'bag' : 'bag-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ tabBarLabel: isPharmacist ? 'Dashboard' : 'Shop' }}
      />
      
      {isPharmacist ? (
        <>
          <MainTab.Screen 
            name="Upload" 
            options={{ tabBarLabel: 'Upload' }}
          >
            {() => (
              <RoleGuard allowedRoles={['pharmacist']}>
                <UploadScreen />
              </RoleGuard>
            )}
          </MainTab.Screen>
          <MainTab.Screen 
            name="MyListings" 
            options={{ tabBarLabel: 'My Listings' }}
          >
            {() => (
              <RoleGuard allowedRoles={['pharmacist']}>
                <MyListingsScreen />
              </RoleGuard>
            )}
          </MainTab.Screen>
        </>
      ) : (
        <MainTab.Screen 
          name="Cart" 
          options={{ tabBarLabel: 'Cart' }}
        >
          {() => (
            <RoleGuard allowedRoles={['user']}>
              <CartScreen />
            </RoleGuard>
          )}
        </MainTab.Screen>
      )}
      
      <MainTab.Screen name="Map" component={MapNearbyScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { hasSeenOnboarding, loadOnboardingStatus } = useAppStore();

  useEffect(() => {
    const unsubscribe = initialize();
    loadOnboardingStatus();
    
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
      <Text style={styles.appTitle}>NiyatKalpa</Text>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
    
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="Main">
            {() => (
              <AuthGuard>
                <MainTabNavigator />
              </AuthGuard>
            )}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
