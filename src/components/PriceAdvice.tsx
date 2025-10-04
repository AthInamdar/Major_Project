import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PriceAdvice } from '../config/types';

interface PriceAdviceProps {
  advice: PriceAdvice;
  mrp: number;
  isOverridden?: boolean;
}

const PriceAdviceComponent: React.FC<PriceAdviceProps> = ({ 
  advice, 
  mrp, 
  isOverridden = false 
}) => {
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

  return (
    <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <View className="flex-row items-center mb-3">
        <Ionicons name="calculator" size={20} color="#3b82f6" />
        <Text className="text-lg font-semibold text-gray-800 ml-2">
          Price Recommendation
        </Text>
      </View>

      {/* Expiry Status */}
      <View className={`rounded-lg p-3 mb-4 ${getExpiryBgColor(advice.daysToExpiry)}`}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`font-semibold ${getExpiryColor(advice.daysToExpiry)}`}>
              {advice.daysToExpiry} days to expiry
            </Text>
            <Text className="text-gray-600 text-sm">
              Tier: {advice.tier}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${getExpiryBgColor(advice.daysToExpiry)}`}>
            <Text className={`font-medium text-sm ${getExpiryColor(advice.daysToExpiry)}`}>
              {advice.discountPct}% OFF
            </Text>
          </View>
        </View>
      </View>

      {/* Price Breakdown */}
      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-gray-600">MRP</Text>
          <Text className="font-medium text-gray-800">₹{mrp.toFixed(2)}</Text>
        </View>
        
        <View className="flex-row justify-between">
          <Text className="text-gray-600">Discount ({advice.discountPct}%)</Text>
          <Text className="font-medium text-green-600">
            -₹{(mrp - advice.suggestedPrice).toFixed(2)}
          </Text>
        </View>
        
        <View className="border-t border-gray-200 pt-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-gray-800">
              Suggested Price
            </Text>
            <Text className="text-xl font-bold text-primary-600">
              ₹{advice.suggestedPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {isOverridden && (
        <View className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <View className="flex-row items-center">
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text className="text-yellow-700 text-sm ml-2 flex-1">
              Price has been manually adjusted from the recommendation
            </Text>
          </View>
        </View>
      )}

      {/* Pricing Guidelines */}
      <View className="mt-4 p-3 bg-blue-50 rounded-lg">
        <Text className="text-blue-800 font-medium text-sm mb-1">
          Pricing Guidelines:
        </Text>
        <Text className="text-blue-700 text-xs leading-4">
          • Prices are calculated based on expiry date
          • Minimum price is 10% of MRP or ₹5, whichever is higher
          • Earlier expiry = higher discount for faster turnover
        </Text>
      </View>
    </View>
  );
};

export default PriceAdviceComponent;
