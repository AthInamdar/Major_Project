import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { Medicine, CartItem, HomeStackParamList } from '../../../../config/types';
import { useAuthStore } from '../../../../store/auth';
import { useCartStore } from '../../../../store/cart';
import { useAppStore } from '../../../../store/app';
import { getMedicine } from '../../../../services/firestore';
import { calculateDistance, formatDistance } from '../../../../services/geolocation';

type MedicineDetailsRouteProp = RouteProp<HomeStackParamList, 'MedicineDetails'>;
type MedicineDetailsNavigationProp = StackNavigationProp<HomeStackParamList, 'MedicineDetails'>;

const MedicineDetailsScreen: React.FC = () => {
  const route = useRoute<MedicineDetailsRouteProp>();
  const navigation = useNavigation<MedicineDetailsNavigationProp>();
  const { user } = useAuthStore();
  const { addItem, syncCart } = useCartStore();
  const { userLocation } = useAppStore();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { medicineId } = route.params;

  useEffect(() => {
    loadMedicine();
  }, [medicineId]);

  const loadMedicine = async () => {
    try {
      const medicineData = await getMedicine(medicineId);
      setMedicine(medicineData);
    } catch (error) {
      console.error('Error loading medicine:', error);
      Alert.alert('Error', 'Failed to load medicine details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysToExpiry = () => {
    if (!medicine) return 0;
    const now = new Date();
    const expiry = medicine.expiryDate.toDate();
    const timeDiff = expiry.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getExpiryColor = (days: number) => {
    if (days <= 30) return 'text-red-600';
    if (days <= 90) return 'text-orange-600';
    if (days <= 180) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getExpiryBgColor = (days: number) => {
    if (days <= 30) return 'bg-red-50';
    if (days <= 90) return 'bg-orange-50';
    if (days <= 180) return 'bg-yellow-50';
    return 'bg-green-50';
  };

  const getDistance = () => {
    if (!medicine || !userLocation) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      medicine.geo.lat,
      medicine.geo.lng
    );
  };

  const handleAddToCart = async () => {
    if (!medicine || !user) return;

    if (quantity > medicine.quantity) {
      Alert.alert('Insufficient Stock', `Only ${medicine.quantity} items available`);
      return;
    }

    const cartItem: CartItem = {
      medicineId: medicine.id,
      name: medicine.name,
      price: medicine.price,
      qty: quantity,
      photo: medicine.photos[0] || '',
      pharmacyId: medicine.pharmacyId,
      pharmacyName: medicine.pharmacyName,
    };

    addItem(cartItem);
    await syncCart(user.uid);

    Alert.alert('Added to Cart', `${quantity} ${medicine.name} added to your cart`);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading medicine details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!medicine) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Medicine not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const daysToExpiry = getDaysToExpiry();
  const discountPercent = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100);
  const distance = getDistance();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800">Medicine Details</Text>
          <View className="w-6" />
        </View>

        {/* Medicine Image */}
        <View className="p-4">
          <View className="w-full h-64 bg-gray-100 rounded-xl justify-center items-center">
            {medicine.photos.length > 0 ? (
              <Image
                source={{ uri: medicine.photos[0] }}
                className="w-full h-full rounded-xl"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="medical" size={80} color="#64748b" />
            )}
          </View>
        </View>

        {/* Medicine Info */}
        <View className="px-4 pb-4">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {medicine.name}
          </Text>
          
          <Text className="text-lg text-gray-600 mb-4">
            {medicine.manufacturer}
          </Text>

          {/* Price Section */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-3xl font-bold text-primary-600">
                ₹{medicine.price.toFixed(2)}
              </Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 font-semibold">
                  {discountPercent}% OFF
                </Text>
              </View>
            </View>
            <Text className="text-gray-500 line-through text-lg">
              MRP: ₹{medicine.mrp.toFixed(2)}
            </Text>
            <Text className="text-green-600 font-medium">
              You save ₹{(medicine.mrp - medicine.price).toFixed(2)}
            </Text>
          </View>

          {/* Expiry and Stock */}
          <View className="flex-row justify-between mb-6">
            <View className={`flex-1 p-3 rounded-lg mr-2 ${getExpiryBgColor(daysToExpiry)}`}>
              <Text className="text-sm text-gray-600 mb-1">Expires in</Text>
              <Text className={`text-lg font-semibold ${getExpiryColor(daysToExpiry)}`}>
                {daysToExpiry} days
              </Text>
            </View>
            <View className="flex-1 p-3 bg-blue-50 rounded-lg ml-2">
              <Text className="text-sm text-gray-600 mb-1">Stock</Text>
              <Text className="text-lg font-semibold text-blue-600">
                {medicine.quantity} available
              </Text>
            </View>
          </View>

          {/* Safety Notice */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-yellow-800 mb-1">
                  Safety Information
                </Text>
                <Text className="text-yellow-700 text-sm leading-5">
                  This medicine expires in {daysToExpiry} days. Please consume before the expiry date. 
                  Consult your doctor before use. Check for any allergic reactions.
                </Text>
              </View>
            </View>
          </View>

          {/* Medicine Details */}
          <View className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Details</Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Batch Number</Text>
                <Text className="font-medium text-gray-800">{medicine.batchNo}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Expiry Date</Text>
                <Text className="font-medium text-gray-800">
                  {medicine.expiryDate.toDate().toLocaleDateString()}
                </Text>
              </View>
              
              {medicine.description && (
                <View>
                  <Text className="text-gray-600 mb-1">Description</Text>
                  <Text className="text-gray-800">{medicine.description}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Pharmacy Info */}
          <View className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Pharmacy</Text>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium text-gray-800 mb-1">
                  {medicine.pharmacyName}
                </Text>
                {distance && (
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={16} color="#64748b" />
                    <Text className="text-gray-600 ml-1">
                      {formatDistance(distance)} away
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity className="bg-primary-50 p-2 rounded-lg">
                <Ionicons name="map" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quantity Selector */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Quantity</Text>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg justify-center items-center"
              >
                <Ionicons name="remove" size={20} color="#374151" />
              </TouchableOpacity>
              
              <Text className="text-xl font-semibold text-gray-800 mx-6">
                {quantity}
              </Text>
              
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(medicine.quantity, quantity + 1))}
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg justify-center items-center"
              >
                <Ionicons name="add" size={20} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-center text-gray-600 mt-2">
              Total: ₹{(medicine.price * quantity).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View className="p-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleAddToCart}
          className="bg-primary-500 py-4 rounded-xl"
        >
          <Text className="text-white text-center text-lg font-semibold">
            Add to Cart - ₹{(medicine.price * quantity).toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MedicineDetailsScreen;
