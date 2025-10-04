import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Medicine } from '../../../../config/types';
import { useAuthStore } from '../../../../store/auth';
import { getMedicinesByPharmacy, updateMedicine, deleteMedicine } from '../../../../services/firestore';
import MedicineCard from '../../../../components/MedicineCard';
import EmptyState from '../../../../components/EmptyState';

const MyListingsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMedicines = async () => {
    if (!user) return;
    
    try {
      const userMedicines = await getMedicinesByPharmacy(user.uid);
      setMedicines(userMedicines);
    } catch (error) {
      console.error('Error loading medicines:', error);
      Alert.alert('Error', 'Failed to load your listings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMedicines();
  };

  const handleStatusChange = async (medicineId: string, newStatus: 'active' | 'paused' | 'soldout') => {
    try {
      await updateMedicine(medicineId, { status: newStatus });
      setMedicines(prev => 
        prev.map(medicine => 
          medicine.id === medicineId 
            ? { ...medicine, status: newStatus }
            : medicine
        )
      );
    } catch (error) {
      console.error('Error updating medicine status:', error);
      Alert.alert('Error', 'Failed to update medicine status');
    }
  };

  const handleDelete = async (medicineId: string) => {
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedicine(medicineId);
              setMedicines(prev => prev.filter(medicine => medicine.id !== medicineId));
            } catch (error) {
              console.error('Error deleting medicine:', error);
              Alert.alert('Error', 'Failed to delete medicine');
            }
          },
        },
      ]
    );
  };

  const showActionSheet = (medicine: Medicine) => {
    const actions = [
      { text: 'Cancel', style: 'cancel' },
      {
        text: medicine.status === 'active' ? 'Pause Listing' : 'Activate Listing',
        onPress: () => handleStatusChange(
          medicine.id, 
          medicine.status === 'active' ? 'paused' : 'active'
        ),
      },
      {
        text: 'Mark as Sold Out',
        onPress: () => handleStatusChange(medicine.id, 'soldout'),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDelete(medicine.id),
      },
    ];

    Alert.alert('Medicine Actions', 'Choose an action');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'soldout': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50';
      case 'paused': return 'bg-yellow-50';
      case 'soldout': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const renderMedicineItem = ({ item }: { item: Medicine }) => (
    <View className="mb-4">
      <MedicineCard
        medicine={item}
        onPress={() => showActionSheet(item)}
        showPharmacyInfo={false}
      />
      
      {/* Status Badge */}
      <View className="absolute top-2 right-2">
        <View className={`px-2 py-1 rounded-full ${getStatusBgColor(item.status)}`}>
          <Text className={`text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading your listings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800">My Listings</Text>
          <Text className="text-gray-600 mt-1">
            Manage your medicine listings
          </Text>
        </View>

        {/* Stats */}
        <View className="px-4 py-4 bg-white mb-2">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                {medicines.filter(m => m.status === 'active').length}
              </Text>
              <Text className="text-sm text-gray-600">Active</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-yellow-600">
                {medicines.filter(m => m.status === 'paused').length}
              </Text>
              <Text className="text-sm text-gray-600">Paused</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-red-600">
                {medicines.filter(m => m.status === 'soldout').length}
              </Text>
              <Text className="text-sm text-gray-600">Sold Out</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-800">
                {medicines.length}
              </Text>
              <Text className="text-sm text-gray-600">Total</Text>
            </View>
          </View>
        </View>

        {/* Listings */}
        {medicines.length === 0 ? (
          <EmptyState
            icon="medical"
            title="No Listings Yet"
            description="Start by uploading your first medicine to help others access affordable healthcare."
            actionText="Upload Medicine"
            onAction={() => {
              // Navigation would be handled by parent navigator
            }}
          />
        ) : (
          <FlatList
            data={medicines}
            renderItem={renderMedicineItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MyListingsScreen;
