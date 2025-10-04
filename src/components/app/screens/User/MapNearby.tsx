import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { Medicine, User } from '../../../../config/types';
import { useAppStore } from '../../../../store/app';
import { getActiveMedicines, getPharmacies } from '../../../../services/firestore';
import { getCurrentLocation, calculateDistance } from '../../../../services/geolocation';
import MedicineCard from '../../../../components/MedicineCard';

const { width, height } = Dimensions.get('window');

interface PharmacyWithMedicines extends User {
  medicines: Medicine[];
  distance?: number;
}

const MapNearbyScreen: React.FC = () => {
  const { userLocation, setUserLocation, setLocationLoading } = useAppStore();
  const [pharmacies, setPharmacies] = useState<PharmacyWithMedicines[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithMedicines | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    loadData();
  }, [userLocation]);

  const loadData = async () => {
    try {
      // Get user location if not available
      if (!userLocation) {
        setLocationLoading(true);
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
          setRegion({
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
        setLocationLoading(false);
      } else {
        setRegion({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }

      // Load pharmacies and their medicines
      const [pharmacyList, medicines] = await Promise.all([
        getPharmacies(),
        getActiveMedicines(),
      ]);

      // Group medicines by pharmacy and calculate distances
      const pharmaciesWithMedicines: PharmacyWithMedicines[] = pharmacyList.map(pharmacy => {
        const pharmacyMedicines = medicines.filter(medicine => medicine.pharmacyId === pharmacy.uid);
        
        let distance: number | undefined;
        if (userLocation && pharmacy.location) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            pharmacy.location.lat,
            pharmacy.location.lng
          );
        }

        return {
          ...pharmacy,
          medicines: pharmacyMedicines,
          distance,
        };
      }).filter(pharmacy => pharmacy.medicines.length > 0); // Only show pharmacies with active medicines

      // Sort by distance
      pharmaciesWithMedicines.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
      });

      setPharmacies(pharmaciesWithMedicines);
    } catch (error) {
      console.error('Error loading map data:', error);
      Alert.alert('Error', 'Failed to load nearby pharmacies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (pharmacy: PharmacyWithMedicines) => {
    setSelectedPharmacy(pharmacy);
  };

  const renderMedicineItem = ({ item }: { item: Medicine }) => (
    <MedicineCard
      medicine={item}
      onPress={() => {
        // Navigate to medicine details
      }}
      showPharmacyInfo={false}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading nearby pharmacies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!region) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="location-outline" size={64} color="#64748b" />
          <Text className="text-xl font-semibold text-gray-800 text-center mt-4 mb-2">
            Location Required
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Enable location services to find nearby pharmacies and medicines.
          </Text>
          <TouchableOpacity
            onPress={loadData}
            className="bg-primary-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800">Nearby Pharmacies</Text>
          <Text className="text-gray-600">
            {pharmacies.length} pharmacies with available medicines
          </Text>
        </View>

        {/* Map */}
        <View className="flex-1">
          <MapView
            style={{ flex: 1 }}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.lat,
                  longitude: userLocation.lng,
                }}
                title="Your Location"
                pinColor="blue"
              />
            )}

            {/* Pharmacy Markers */}
            {pharmacies.map((pharmacy) => (
              pharmacy.location && (
                <Marker
                  key={pharmacy.uid}
                  coordinate={{
                    latitude: pharmacy.location.lat,
                    longitude: pharmacy.location.lng,
                  }}
                  title={pharmacy.name}
                  description={`${pharmacy.medicines.length} medicines available`}
                  onPress={() => handleMarkerPress(pharmacy)}
                  pinColor="red"
                />
              )
            ))}
          </MapView>

          {/* Selected Pharmacy Details */}
          {selectedPharmacy && (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-h-80">
              <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {selectedPharmacy.name}
                  </Text>
                  {selectedPharmacy.distance && (
                    <Text className="text-gray-600">
                      {selectedPharmacy.distance.toFixed(1)} km away
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPharmacy(null)}
                  className="p-2"
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View className="p-4">
                <Text className="text-sm font-medium text-gray-700 mb-3">
                  Available Medicines ({selectedPharmacy.medicines.length})
                </Text>
                <FlatList
                  data={selectedPharmacy.medicines.slice(0, 3)} // Show only first 3
                  renderItem={renderMedicineItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
                {selectedPharmacy.medicines.length > 3 && (
                  <TouchableOpacity className="mt-2 p-2 bg-primary-50 rounded-lg">
                    <Text className="text-primary-600 text-center font-medium">
                      View All {selectedPharmacy.medicines.length} Medicines
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Pharmacy List (when no pharmacy selected) */}
        {!selectedPharmacy && (
          <View className="bg-white border-t border-gray-200" style={{ maxHeight: height * 0.4 }}>
            <View className="p-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-800">
                Nearby Pharmacies
              </Text>
            </View>
            <FlatList
              data={pharmacies}
              keyExtractor={(item) => item.uid}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleMarkerPress(item)}
                  className="p-4 border-b border-gray-100"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-800 mb-1">
                        {item.name}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {item.medicines.length} medicines available
                      </Text>
                      {item.distance && (
                        <Text className="text-xs text-gray-500 mt-1">
                          {item.distance.toFixed(1)} km away
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default MapNearbyScreen;
