import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Medicine } from '../config/types';
import { formatDistance } from '../services/geolocation';

interface MedicineCardProps {
  medicine: Medicine;
  distance?: number;
  onPress: () => void;
  showPharmacyInfo?: boolean;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ 
  medicine, 
  distance, 
  onPress, 
  showPharmacyInfo = true 
}) => {
  const getDaysToExpiry = () => {
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

  const daysToExpiry = getDaysToExpiry();
  const discountPercent = Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-200 shadow-sm"
    >
      <View className="flex-row">
        {/* Medicine Image */}
        <View className="w-20 h-20 bg-gray-100 rounded-lg mr-4 justify-center items-center">
          {medicine.photos.length > 0 ? (
            <Image
              source={{ uri: medicine.photos[0] }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="medical" size={32} color="#64748b" />
          )}
        </View>

        {/* Medicine Info */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800 mb-1" numberOfLines={2}>
            {medicine.name}
          </Text>
          
          <Text className="text-sm text-gray-600 mb-2">
            {medicine.manufacturer}
          </Text>

          {/* Price Info */}
          <View className="flex-row items-center mb-2">
            <Text className="text-xl font-bold text-primary-600">
              ₹{medicine.price.toFixed(2)}
            </Text>
            <Text className="text-sm text-gray-500 line-through ml-2">
              ₹{medicine.mrp.toFixed(2)}
            </Text>
            <View className="bg-green-100 px-2 py-1 rounded-full ml-2">
              <Text className="text-xs font-medium text-green-700">
                {discountPercent}% OFF
              </Text>
            </View>
          </View>

          {/* Expiry and Stock */}
          <View className="flex-row items-center justify-between">
            <View className={`px-2 py-1 rounded-full ${getExpiryBgColor(daysToExpiry)}`}>
              <Text className={`text-xs font-medium ${getExpiryColor(daysToExpiry)}`}>
                {daysToExpiry}d left
              </Text>
            </View>
            
            <Text className="text-xs text-gray-500">
              Stock: {medicine.quantity}
            </Text>
          </View>

          {/* Pharmacy Info and Distance */}
          {showPharmacyInfo && (
            <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <Text className="text-xs text-gray-600" numberOfLines={1}>
                {medicine.pharmacyName}
              </Text>
              {distance !== undefined && (
                <View className="flex-row items-center">
                  <Ionicons name="location" size={12} color="#64748b" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {formatDistance(distance)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MedicineCard;
