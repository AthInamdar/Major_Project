import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../../../store/auth';
import { useAppStore } from '../../../store/app';
import { useCartStore } from '../../../store/cart';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuthStore();
  const { userLocation } = useAppStore();
  const { clearCart } = useCartStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              clearCart();
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'location-outline' as const,
      title: 'Location Settings',
      subtitle: userLocation ? 'Location set' : 'Set your location',
      onPress: () => navigation.navigate('Location' as never),
      showChevron: true,
    },
    {
      icon: 'help-circle-outline' as const,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => {
        Alert.alert('Help & Support', 'Contact support at support@niyatkalpa.com');
      },
      showChevron: true,
    },
    {
      icon: 'document-text-outline' as const,
      title: 'Terms & Privacy',
      subtitle: 'Read our terms and privacy policy',
      onPress: () => {
        Alert.alert('Terms & Privacy', 'Terms and privacy policy coming soon');
      },
      showChevron: true,
    },
    {
      icon: 'information-circle-outline' as const,
      title: 'About NiyatKalpa',
      subtitle: 'Version 1.0.0',
      onPress: () => {
        Alert.alert(
          'About NiyatKalpa',
          'NiyatKalpa helps reduce medical waste by redistributing near-expiry medicines at affordable prices.\n\nVersion 1.0.0\nBuilt with ❤️ for better healthcare access.'
        );
      },
      showChevron: false,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 bg-white">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Profile</Text>
          <Text className="text-gray-600">Manage your account and preferences</Text>
        </View>

        {/* User Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-6 border border-gray-200 shadow-sm">
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-primary-100 rounded-full justify-center items-center mb-3">
              <Text className="text-2xl font-bold text-primary-600">
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-xl font-semibold text-gray-800">
              {user?.name}
            </Text>
            <Text className="text-gray-600 mb-2">{user?.email}</Text>
            
            {/* Role Badge */}
            <View className={`px-3 py-1 rounded-full ${
              user?.role === 'pharmacist' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              <Text className={`text-sm font-medium capitalize ${
                user?.role === 'pharmacist' ? 'text-blue-700' : 'text-green-700'
              }`}>
                {user?.role}
              </Text>
            </View>
          </View>

          {user?.phone && (
            <View className="flex-row items-center justify-center pt-4 border-t border-gray-100">
              <Ionicons name="call-outline" size={16} color="#64748b" />
              <Text className="text-gray-600 ml-2">{user.phone}</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View className="bg-white mx-4 mt-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className={`flex-row items-center p-4 ${
                index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-full justify-center items-center mr-4">
                <Ionicons name={item.icon} size={20} color="#64748b" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 mb-1">
                  {item.title}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.subtitle}
                </Text>
              </View>
              {item.showChevron && (
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-200 shadow-sm">
          <View className="items-center">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              NiyatKalpa
            </Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              Reducing medical waste, improving healthcare access
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 py-4 rounded-xl"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
