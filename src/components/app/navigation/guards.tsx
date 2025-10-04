import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../store/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('pharmacist' | 'user')[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  fallback 
}) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-lg font-semibold text-gray-800 text-center">
          Access Restricted
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          You don't have permission to access this section.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <Text className="text-lg font-semibold text-gray-800 text-center">
          Authentication Required
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Please sign in to continue.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};
