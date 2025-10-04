import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAppStore } from '../../../store/app';
import { useAuthStore } from '../../../store/auth';
import { getCurrentLocation } from '../../../services/geolocation';
import { updateUser } from '../../../services/firestore';

const LocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUserData } = useAuthStore();
  const { userLocation, setUserLocation, isLocationLoading, setLocationLoading } = useAppStore();
  const [customAddress, setCustomAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userLocation?.address) {
      setCustomAddress(userLocation.address);
    }
  }, [userLocation]);

  const handleGetCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      
      if (location) {
        setUserLocation(location);
        setCustomAddress(location.address || '');
        
        // Update user location in database
        if (user) {
          await updateUser(user.uid, { location });
          updateUserData({ location });
        }
        
        Alert.alert('Success', 'Location updated successfully');
      } else {
        Alert.alert('Error', 'Unable to get your current location. Please check permissions.');
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!userLocation || !user) return;

    try {
      setIsUpdating(true);
      const updatedLocation = {
        ...userLocation,
        address: customAddress.trim(),
      };

      setUserLocation(updatedLocation);
      await updateUser(user.uid, { location: updatedLocation });
      updateUserData({ location: updatedLocation });

      Alert.alert('Success', 'Address updated successfully');
    } catch (error) {
      console.error('Update address error:', error);
      Alert.alert('Error', 'Failed to update address');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800">Location Settings</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 p-6">
          {/* Current Location */}
          <View className="mb-8">
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              Current Location
            </Text>
            
            {userLocation ? (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4">
                <View className="flex-row items-start">
                  <Ionicons name="location" size={20} color="#22c55e" />
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-green-800 mb-1">
                      Location Set
                    </Text>
                    <Text className="text-green-700 text-sm">
                      {userLocation.address || `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <View className="flex-row items-start">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-yellow-800 mb-1">
                      No Location Set
                    </Text>
                    <Text className="text-yellow-700 text-sm">
                      Set your location to find nearby medicines and pharmacies.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Get Current Location */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              Auto-Detect Location
            </Text>
            <TouchableOpacity
              onPress={handleGetCurrentLocation}
              disabled={isLocationLoading}
              className={`flex-row items-center justify-center p-4 rounded-xl border-2 border-dashed ${
                isLocationLoading ? 'border-gray-300 bg-gray-50' : 'border-primary-300 bg-primary-50'
              }`}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Ionicons name="locate" size={24} color="#3b82f6" />
              )}
              <Text className={`ml-3 font-semibold ${
                isLocationLoading ? 'text-gray-500' : 'text-primary-600'
              }`}>
                {isLocationLoading ? 'Getting Location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
            <Text className="text-xs text-gray-500 mt-2 text-center">
              This will use GPS to automatically detect your location
            </Text>
          </View>

          {/* Custom Address */}
          {userLocation && (
            <View className="mb-8">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Custom Address
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 mb-4"
                placeholder="Enter your address"
                value={customAddress}
                onChangeText={setCustomAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                onPress={handleUpdateAddress}
                disabled={isUpdating || customAddress.trim() === userLocation.address}
                className={`py-3 rounded-xl ${
                  isUpdating || customAddress.trim() === userLocation.address
                    ? 'bg-gray-300'
                    : 'bg-primary-500'
                }`}
              >
                <Text className="text-white text-center font-semibold">
                  {isUpdating ? 'Updating...' : 'Update Address'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Location Info */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1 ml-3">
                <Text className="font-medium text-blue-800 mb-2">
                  Why do we need your location?
                </Text>
                <Text className="text-blue-700 text-sm leading-5">
                  • Find nearby pharmacies and medicines{'\n'}
                  • Calculate accurate distances{'\n'}
                  • Show relevant search results{'\n'}
                  • Enable future delivery services
                </Text>
              </View>
            </View>
          </View>

          {/* Privacy Note */}
          <View className="mt-6 p-4 bg-gray-50 rounded-xl">
            <Text className="text-sm text-gray-600 text-center">
              <Text className="font-semibold">Privacy:</Text> Your location is stored securely and only used to improve your experience. We never share your location with third parties.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LocationScreen;
