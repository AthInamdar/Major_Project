import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../../store/app';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Save Waste',
    description: 'Help reduce medical waste by giving near-expiry medicines a second chance to help others.',
    icon: 'leaf',
    color: '#22c55e',
  },
  {
    id: 2,
    title: 'Affordable Access',
    description: 'Get quality medicines at reduced prices, making healthcare more accessible for everyone.',
    icon: 'heart',
    color: '#ef4444',
  },
  {
    id: 3,
    title: 'Scan & List',
    description: 'Pharmacists can easily scan medicine labels and list them with smart pricing suggestions.',
    icon: 'camera',
    color: '#3b82f6',
  },
  {
    id: 4,
    title: 'Find Nearby',
    description: 'Discover available medicines near you with location-based search and delivery options.',
    icon: 'location',
    color: '#f59e0b',
  },
];

const OnboardingScreen: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setOnboardingCompleted } = useAppStore();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setOnboardingCompleted();
    }
  };

  const handleSkip = () => {
    setOnboardingCompleted();
  };

  const slide = slides[currentSlide];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <Text className="text-2xl font-bold text-gray-800">NiyatKalpa</Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-primary-500 font-medium">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center px-8">
          <View 
            className="w-32 h-32 rounded-full justify-center items-center mb-8"
            style={{ backgroundColor: `${slide.color}20` }}
          >
            <Ionicons name={slide.icon} size={64} color={slide.color} />
          </View>

          <Text className="text-3xl font-bold text-gray-800 text-center mb-4">
            {slide.title}
          </Text>

          <Text className="text-lg text-gray-600 text-center leading-6">
            {slide.description}
          </Text>
        </View>

        {/* Pagination Dots */}
        <View className="flex-row justify-center items-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === currentSlide ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>

        {/* Bottom Button */}
        <View className="px-6 pb-6">
          <TouchableOpacity
            onPress={handleNext}
            className="bg-primary-500 py-4 rounded-xl"
          >
            <Text className="text-white text-center text-lg font-semibold">
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
