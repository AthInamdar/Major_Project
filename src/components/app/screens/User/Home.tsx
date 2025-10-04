import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';

import { Medicine } from '../../../../config/types';
import { useAppStore } from '../../../../store/app';
import { useAuthStore } from '../../../../store/auth';
import { getActiveMedicines, searchMedicines } from '../../../../services/firestore';
import { getCurrentLocation, calculateDistance } from '../../../../services/geolocation';
import MedicineCard from '../../../../components/MedicineCard';
import EmptyState from '../../../../components/EmptyState';
import { HomeStackParamList } from '../../../../config/types';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'HomeScreen'>;

interface MedicineWithDistance extends Medicine {
  distance?: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuthStore();
  const { userLocation, setUserLocation, setLocationLoading } = useAppStore();
  const [medicines, setMedicines] = useState<MedicineWithDistance[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<MedicineWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistanceFilter, setSelectedDistanceFilter] = useState<number | null>(null);
  const [selectedExpiryFilter, setSelectedExpiryFilter] = useState<number | null>(null);

  const distanceFilters = [
    { label: '1 km', value: 1 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '20 km', value: 20 },
  ];

  const expiryFilters = [
    { label: '≤30 days', value: 30 },
    { label: '≤90 days', value: 90 },
    { label: 'All', value: null },
  ];

  const loadMedicines = async () => {
    try {
      let medicineList: Medicine[] = [];
      
      if (searchQuery.trim()) {
        medicineList = await searchMedicines(searchQuery.trim());
      } else {
        medicineList = await getActiveMedicines();
      }

      // Calculate distances if user location is available
      const medicinesWithDistance: MedicineWithDistance[] = medicineList.map(medicine => {
        if (userLocation) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            medicine.geo.lat,
            medicine.geo.lng
          );
          return { ...medicine, distance };
        }
        return medicine;
      });

      // Sort by distance (if available) then by expiry date
      medicinesWithDistance.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
        }
        return a.expiryDate.toMillis() - b.expiryDate.toMillis();
      });

      setMedicines(medicinesWithDistance);
    } catch (error) {
      console.error('Error loading medicines:', error);
      Alert.alert('Error', 'Failed to load medicines');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...medicines];

    // Apply distance filter
    if (selectedDistanceFilter && userLocation) {
      filtered = filtered.filter(medicine => 
        medicine.distance !== undefined && medicine.distance <= selectedDistanceFilter
      );
    }

    // Apply expiry filter
    if (selectedExpiryFilter) {
      const now = new Date();
      filtered = filtered.filter(medicine => {
        const expiryDate = medicine.expiryDate.toDate();
        const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        return daysToExpiry <= selectedExpiryFilter;
      });
    }

    setFilteredMedicines(filtered);
  }, [medicines, selectedDistanceFilter, selectedExpiryFilter, userLocation]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [searchQuery, userLocation])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMedicines();
  };

  const handleLocationSetup = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        loadMedicines();
      } else {
        Alert.alert('Location Error', 'Unable to get your location. Please check permissions.');
      }
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const renderMedicineItem = ({ item }: { item: MedicineWithDistance }) => (
    <MedicineCard
      medicine={item}
      distance={item.distance}
      onPress={() => navigation.navigate('MedicineDetails', { medicineId: item.id })}
    />
  );

  const renderHeader = () => (
    <View className="px-4 py-6 bg-white">
      {/* Greeting */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Hello, {user?.name?.split(' ')[0]}!
          </Text>
          <Text className="text-gray-600">Find affordable medicines near you</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('VedAI')}
          className="bg-primary-50 p-3 rounded-full"
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Location */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Location')}
        className="flex-row items-center mb-6 p-3 bg-gray-50 rounded-lg"
      >
        <Ionicons name="location" size={20} color="#64748b" />
        <Text className="flex-1 ml-2 text-gray-700">
          {userLocation ? userLocation.address || 'Current Location' : 'Set your location'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#64748b" />
      </TouchableOpacity>

      {!userLocation && (
        <TouchableOpacity
          onPress={handleLocationSetup}
          className="bg-primary-500 py-3 rounded-lg mb-6"
        >
          <Text className="text-white text-center font-semibold">
            Enable Location for Better Results
          </Text>
        </TouchableOpacity>
      )}

      {/* Search */}
      <View className="relative mb-4">
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-10"
          placeholder="Search medicines..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons
          name="search"
          size={20}
          color="#64748b"
          style={{ position: 'absolute', right: 12, top: 12 }}
        />
      </View>

      {/* Filters */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Distance</Text>
        <View className="flex-row space-x-2 mb-4">
          <TouchableOpacity
            onPress={() => setSelectedDistanceFilter(null)}
            className={`px-3 py-2 rounded-full border ${
              selectedDistanceFilter === null
                ? 'bg-primary-500 border-primary-500'
                : 'bg-white border-gray-300'
            }`}
          >
            <Text className={`text-sm ${
              selectedDistanceFilter === null ? 'text-white' : 'text-gray-700'
            }`}>
              All
            </Text>
          </TouchableOpacity>
          {distanceFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => setSelectedDistanceFilter(filter.value)}
              className={`px-3 py-2 rounded-full border ${
                selectedDistanceFilter === filter.value
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-sm ${
                selectedDistanceFilter === filter.value ? 'text-white' : 'text-gray-700'
              }`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-2">Expiry</Text>
        <View className="flex-row space-x-2">
          {expiryFilters.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              onPress={() => setSelectedExpiryFilter(filter.value)}
              className={`px-3 py-2 rounded-full border ${
                selectedExpiryFilter === filter.value
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-sm ${
                selectedExpiryFilter === filter.value ? 'text-white' : 'text-gray-700'
              }`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results Count */}
      <Text className="text-sm text-gray-600 mb-4">
        {filteredMedicines.length} medicine{filteredMedicines.length !== 1 ? 's' : ''} found
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading medicines...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {filteredMedicines.length === 0 ? (
        <View className="flex-1">
          {renderHeader()}
          <EmptyState
            icon="medical"
            title="No Medicines Found"
            description={
              searchQuery
                ? "No medicines match your search criteria. Try adjusting your filters or search terms."
                : "No medicines available in your area. Check back later or expand your search radius."
            }
            actionText={!userLocation ? "Enable Location" : undefined}
            onAction={!userLocation ? handleLocationSetup : undefined}
          />
        </View>
      ) : (
        <FlatList
          data={filteredMedicines}
          renderItem={renderMedicineItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;
