import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CartItem } from '../../../../config/types';
import { useAuthStore } from '../../../../store/auth';
import { useCartStore } from '../../../../store/cart';
import EmptyState from '../../../../components/EmptyState';

const CartScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { items, totalAmount, totalItems, updateQuantity, removeItem, loadCart, syncCart } = useCartStore();

  useEffect(() => {
    if (user) {
      loadCart(user.uid);
    }
  }, [user]);

  const handleQuantityChange = async (medicineId: string, newQuantity: number) => {
    updateQuantity(medicineId, newQuantity);
    if (user) {
      await syncCart(user.uid);
    }
  };

  const handleRemoveItem = async (medicineId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            removeItem(medicineId);
            if (user) {
              await syncCart(user.uid);
            }
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200 shadow-sm">
      <View className="flex-row">
        {/* Medicine Image */}
        <View className="w-16 h-16 bg-gray-100 rounded-lg mr-4 justify-center items-center">
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="medical" size={24} color="#64748b" />
          )}
        </View>

        {/* Item Details */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800 mb-1" numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text className="text-sm text-gray-600 mb-2">
            {item.pharmacyName}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-primary-600">
              ₹{item.price.toFixed(2)}
            </Text>
            
            {/* Quantity Controls */}
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.medicineId, item.qty - 1)}
                className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center"
              >
                <Ionicons name="remove" size={16} color="#374151" />
              </TouchableOpacity>
              
              <Text className="mx-3 text-lg font-semibold text-gray-800">
                {item.qty}
              </Text>
              
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.medicineId, item.qty + 1)}
                className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center"
              >
                <Ionicons name="add" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Item Total and Remove */}
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-sm text-gray-600">
              Total: ₹{(item.price * item.qty).toFixed(2)}
            </Text>
            
            <TouchableOpacity
              onPress={() => handleRemoveItem(item.medicineId)}
              className="p-1"
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800">Your Cart</Text>
          <Text className="text-gray-600 mt-1">
            {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
          </Text>
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon="bag-outline"
            title="Your Cart is Empty"
            description="Add some medicines to your cart to get started with affordable healthcare."
            actionText="Browse Medicines"
            onAction={() => {
              // Navigation would be handled by parent navigator
            }}
          />
        ) : (
          <>
            {/* Cart Items */}
            <FlatList
              data={items}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.medicineId}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />

            {/* Cart Summary */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
              {/* Delivery Banner */}
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <Text className="flex-1 ml-2 text-blue-800 font-medium">
                    Delivery Coming Soon!
                  </Text>
                </View>
                <Text className="text-blue-700 text-sm mt-1">
                  We're working on delivery options. For now, you can contact the pharmacy directly.
                </Text>
              </View>

              {/* Total */}
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-semibold text-gray-800">
                    Total Amount
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-primary-600">
                  ₹{totalAmount.toFixed(2)}
                </Text>
              </View>

              {/* Checkout Button (Disabled) */}
              <TouchableOpacity
                disabled
                className="bg-gray-400 py-4 rounded-xl"
              >
                <Text className="text-white text-center text-lg font-semibold">
                  Checkout (Coming Soon)
                </Text>
              </TouchableOpacity>
              
              <Text className="text-xs text-gray-500 text-center mt-2">
                Contact pharmacy directly for now
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;
