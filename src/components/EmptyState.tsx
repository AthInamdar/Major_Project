import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <View className="flex-1 justify-center items-center px-8 py-12">
      <View className="w-24 h-24 bg-gray-100 rounded-full justify-center items-center mb-6">
        <Ionicons name={icon} size={48} color="#64748b" />
      </View>
      
      <Text className="text-xl font-semibold text-gray-800 text-center mb-3">
        {title}
      </Text>
      
      <Text className="text-gray-600 text-center leading-6 mb-8">
        {description}
      </Text>
      
      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-primary-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
