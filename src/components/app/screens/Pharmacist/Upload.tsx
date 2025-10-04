import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { MedicineUploadForm, MedicineUploadFormSchema, PriceAdvice } from '../../../../config/types';
import { useAuthStore } from '../../../../store/auth';
import { useAppStore } from '../../../../store/app';
import { OcrService } from '../../../../services/ocr';
import { getSuggestedPrice, validatePriceOverride } from '../../../../services/pricing';
import { createMedicine } from '../../../../services/firestore';
import { getCurrentLocation } from '../../../../services/geolocation';
import { storage } from '../../../../services/firebase';
import PriceAdviceComponent from '../../../../components/PriceAdvice';

const UploadScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { userLocation, setUserLocation, setLocationLoading } = useAppStore();
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [expiryLabelPhoto, setExpiryLabelPhoto] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isProcessingExpiryOCR, setIsProcessingExpiryOCR] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [priceAdvice, setPriceAdvice] = useState<PriceAdvice | null>(null);
  const [isPriceOverridden, setIsPriceOverridden] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<MedicineUploadForm>({
    resolver: zodResolver(MedicineUploadFormSchema),
    defaultValues: {
      quantity: 1,
      declaration: false,
    },
  });

  const watchedMrp = watch('mrp');
  const watchedExpiryDate = watch('expiryDate');
  const watchedPrice = watch('price');

  // Calculate price advice when MRP or expiry date changes
  useEffect(() => {
    if (watchedMrp && watchedExpiryDate) {
      try {
        const expiryDate = new Date(watchedExpiryDate);
        if (!isNaN(expiryDate.getTime())) {
          const advice = getSuggestedPrice(watchedMrp, expiryDate);
          setPriceAdvice(advice);
          
          // Auto-set suggested price if not manually overridden
          if (!isPriceOverridden) {
            setValue('price', advice.suggestedPrice);
          }
        }
      } catch (error) {
        console.error('Error calculating price advice:', error);
      }
    }
  }, [watchedMrp, watchedExpiryDate, isPriceOverridden, setValue]);

  // Check if price is manually overridden
  useEffect(() => {
    if (priceAdvice && watchedPrice !== undefined) {
      const isOverridden = Math.abs(watchedPrice - priceAdvice.suggestedPrice) > 0.01;
      setIsPriceOverridden(isOverridden);
    }
  }, [watchedPrice, priceAdvice]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const pickFrontPhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFrontPhoto(result.assets[0].uri);
      processOCR(result.assets[0].uri);
    }
  };

  const pickExpiryLabelPhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setExpiryLabelPhoto(result.assets[0].uri);
      processExpiryOCR(result.assets[0].uri);
    }
  };

  const takeFrontPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFrontPhoto(result.assets[0].uri);
      processOCR(result.assets[0].uri);
    }
  };

  const takeExpiryLabelPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setExpiryLabelPhoto(result.assets[0].uri);
      processExpiryOCR(result.assets[0].uri);
    }
  };

  const processOCR = async (imageUri: string) => {
    try {
      setIsProcessingOCR(true);
      const parsedFields = await OcrService.parse(imageUri);
      
      // Prefill form with OCR results
      if (parsedFields.name) setValue('name', parsedFields.name);
      if (parsedFields.batchNo) setValue('batchNo', parsedFields.batchNo);
      if (parsedFields.manufacturer) setValue('manufacturer', parsedFields.manufacturer);
      if (parsedFields.expiryDate) setValue('expiryDate', parsedFields.expiryDate);
      
    } catch (error) {
      console.error('OCR processing error:', error);
      Alert.alert('OCR Error', 'Failed to process the image. Please fill the form manually.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const processExpiryOCR = async (imageUri: string) => {
    try {
      setIsProcessingExpiryOCR(true);
      const result = await OcrService.parseExpiryLabel(imageUri);
      
      // Auto-fill all extracted fields from label photo
      if (result.batchNo) setValue('batchNo', result.batchNo);
      if (result.mrp) setValue('mrp', result.mrp);
      if (result.expiryDate) setValue('expiryDate', result.expiryDate);
      
      // Only confirm expiry date to user with additional context
      if (result.expiryDate) {
        const mfdInfo = result.mfdDate ? `\nMfd: ${result.mfdDate}` : '';
        Alert.alert(
          'Expiry Date Detected', 
          `Found expiry date: ${result.expiryDate}${mfdInfo}\n\nPlease verify if the expiry date is correct.`
        );
      }
      
    } catch (error) {
      console.error('Expiry OCR processing error:', error);
      Alert.alert('OCR Error', 'Failed to extract information from label. Please enter manually.');
    } finally {
      setIsProcessingExpiryOCR(false);
    }
  };

  const uploadImage = async (imageUri: string): Promise<string> => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const filename = `medicines/${user?.uid}/${Date.now()}.jpg`;
    const imageRef = ref(storage, filename);
    
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const ensureLocation = async () => {
    if (!userLocation) {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
      } else {
        throw new Error('Location is required to list medicines');
      }
      setLocationLoading(false);
    }
  };

  const onSubmit = async (data: MedicineUploadForm) => {
    try {
      setIsUploading(true);
      
      // Ensure we have user location
      await ensureLocation();
      
      if (!userLocation || !user) {
        throw new Error('User location and authentication required');
      }

      // Validate price override if applicable
      if (priceAdvice && isPriceOverridden) {
        const validation = validatePriceOverride(priceAdvice.suggestedPrice, data.price, data.mrp);
        if (!validation.isValid) {
          Alert.alert('Price Validation Error', validation.warning);
          return;
        }
        if (validation.warning) {
          const confirmed = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Price Override Warning',
              validation.warning + '\n\nDo you want to continue?',
              [
                { text: 'Cancel', onPress: () => resolve(false) },
                { text: 'Continue', onPress: () => resolve(true) },
              ]
            );
          });
          if (!confirmed) return;
        }
      }

      // Upload images if selected
      let photoUrls: string[] = [];
      let frontPhotoUrl: string | undefined;
      let expiryLabelPhotoUrl: string | undefined;
      
      if (frontPhoto) {
        frontPhotoUrl = await uploadImage(frontPhoto);
        photoUrls.push(frontPhotoUrl);
      }
      
      if (expiryLabelPhoto) {
        expiryLabelPhotoUrl = await uploadImage(expiryLabelPhoto);
        if (!photoUrls.includes(expiryLabelPhotoUrl)) {
          photoUrls.push(expiryLabelPhotoUrl);
        }
      }

      // Create medicine document
      const medicineData = {
        name: data.name,
        batchNo: data.batchNo,
        manufacturer: data.manufacturer,
        expiryDate: new Date(data.expiryDate) as any, // Will be converted to Timestamp in firestore service
        mrp: data.mrp,
        price: data.price,
        suggestedPrice: priceAdvice?.suggestedPrice || data.price,
        quantity: data.quantity,
        photos: photoUrls,
        frontPhoto: frontPhotoUrl,
        expiryLabelPhoto: expiryLabelPhotoUrl,
        pharmacyId: user.uid,
        pharmacyName: user.name,
        geo: userLocation,
        status: 'active' as const,
        description: data.description,
      };

      await createMedicine(medicineData);

      Alert.alert('Success', 'Medicine listed successfully!', [
        { text: 'OK', onPress: () => {
          reset();
          setFrontPhoto(null);
          setExpiryLabelPhoto(null);
          setPriceAdvice(null);
          setIsPriceOverridden(false);
        }}
      ]);

    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to list medicine');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Upload Medicine</Text>
          <Text className="text-gray-600">
            Upload two photos: front view for users and expiry label for automatic extraction of MRP, batch number, and expiry date
          </Text>
        </View>

        {/* Dual Photo Upload Section */}
        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Medicine Photos</Text>
          
          {/* Front Photo Section */}
          <View className="mb-6">
            <Text className="text-md font-medium text-gray-700 mb-3">
              1. Front Photo (for users to see)
            </Text>
            {frontPhoto ? (
              <View className="relative">
                <Image
                  source={{ uri: frontPhoto }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setFrontPhoto(null)}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
                {isProcessingOCR && (
                  <View className="absolute inset-0 bg-black bg-opacity-50 rounded-lg justify-center items-center">
                    <ActivityIndicator size="large" color="white" />
                    <Text className="text-white mt-2">Processing image...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center">
                <Ionicons name="camera" size={40} color="#64748b" />
                <Text className="text-gray-600 text-center mt-2 mb-3">
                  Upload front view of medicine
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={takeFrontPhoto}
                    className="bg-primary-500 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="camera" size={14} color="white" />
                    <Text className="text-white ml-1 text-sm">Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickFrontPhoto}
                    className="bg-gray-500 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="images" size={14} color="white" />
                    <Text className="text-white ml-1 text-sm">Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Expiry Label Photo Section */}
          <View>
            <Text className="text-md font-medium text-gray-700 mb-3">
              2. Product Label (auto-extracts MRP, Batch No, Expiry Date)
            </Text>
            {expiryLabelPhoto ? (
              <View className="relative">
                <Image
                  source={{ uri: expiryLabelPhoto }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setExpiryLabelPhoto(null)}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                >
                  <Ionicons name="close" size={16} color="white" />
                </TouchableOpacity>
                {isProcessingExpiryOCR && (
                  <View className="absolute inset-0 bg-black bg-opacity-50 rounded-lg justify-center items-center">
                    <ActivityIndicator size="large" color="white" />
                    <Text className="text-white mt-2">Extracting product details...</Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="border-2 border-dashed border-orange-300 rounded-lg p-6 items-center">
                <Ionicons name="calendar" size={40} color="#f97316" />
                <Text className="text-gray-600 text-center mt-2 mb-3">
                  Upload product label to auto-extract MRP, batch number, and expiry date
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={takeExpiryLabelPhoto}
                    className="bg-orange-500 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="camera" size={14} color="white" />
                    <Text className="text-white ml-1 text-sm">Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickExpiryLabelPhoto}
                    className="bg-orange-400 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="images" size={14} color="white" />
                    <Text className="text-white ml-1 text-sm">Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Medicine Details Form */}
        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Medicine Details</Text>
          
          {/* Medicine Name */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Medicine Name *</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-lg px-3 py-3 text-gray-800 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter medicine name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-sm mt-1">{errors.name.message}</Text>
            )}
          </View>

          {/* Batch Number */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Batch Number *</Text>
            <Controller
              control={control}
              name="batchNo"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-lg px-3 py-3 text-gray-800 ${
                    errors.batchNo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter batch number"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.batchNo && (
              <Text className="text-red-500 text-sm mt-1">{errors.batchNo.message}</Text>
            )}
          </View>

          {/* Manufacturer */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Manufacturer *</Text>
            <Controller
              control={control}
              name="manufacturer"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-lg px-3 py-3 text-gray-800 ${
                    errors.manufacturer ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter manufacturer name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.manufacturer && (
              <Text className="text-red-500 text-sm mt-1">{errors.manufacturer.message}</Text>
            )}
          </View>

          {/* Expiry Date */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Expiry Date *</Text>
            <Controller
              control={control}
              name="expiryDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-lg px-3 py-3 text-gray-800 ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="MM/YYYY or DD/MM/YYYY"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.expiryDate && (
              <Text className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</Text>
            )}
            <Text className="text-xs text-gray-500 mt-1">
              You can edit the expiry date if OCR detection was incorrect
            </Text>
          </View>

          {/* MRP */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">MRP (₹) *</Text>
            <Controller
              control={control}
              name="mrp"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-lg px-3 py-3 text-gray-800 ${
                    errors.mrp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter MRP"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseFloat(text) || 0)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.mrp && (
              <Text className="text-red-500 text-sm mt-1">{errors.mrp.message}</Text>
            )}
          </View>

          {/* Quantity */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Quantity *</Text>
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-lg px-3 py-3 text-gray-800 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter quantity"
                  value={value?.toString()}
                  onChangeText={(text) => onChange(parseInt(text) || 1)}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.quantity && (
              <Text className="text-red-500 text-sm mt-1">{errors.quantity.message}</Text>
            )}
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Description (Optional)</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-3 text-gray-800"
                  placeholder="Additional notes about the medicine"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
          </View>
        </View>

        {/* Price Advice */}
        {priceAdvice && (
          <View className="mb-6">
            <PriceAdviceComponent
              advice={priceAdvice}
              mrp={watchedMrp || 0}
              isOverridden={isPriceOverridden}
            />
          </View>
        )}

        {/* Price Input */}
        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Final Price</Text>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg px-3 py-3 text-gray-800 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter selling price"
                value={value?.toString()}
                onChangeText={(text) => {
                  const price = parseFloat(text) || 0;
                  onChange(price);
                }}
                onBlur={onBlur}
                keyboardType="numeric"
              />
            )}
          />
          {errors.price && (
            <Text className="text-red-500 text-sm mt-1">{errors.price.message}</Text>
          )}
        </View>

        {/* Declaration */}
        <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <Controller
            control={control}
            name="declaration"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                onPress={() => onChange(!value)}
                className="flex-row items-start"
              >
                <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 justify-center items-center ${
                  value ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                }`}>
                  {value && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="flex-1 text-gray-700 leading-5">
                  I confirm that all details are correct and the medicine is safe for consumption until the expiry date. I take full responsibility for the quality and authenticity of this medicine.
                </Text>
              </TouchableOpacity>
            )}
          />
          {errors.declaration && (
            <Text className="text-red-500 text-sm mt-2">{errors.declaration.message}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isUploading}
          className={`py-4 rounded-xl mb-6 ${
            isUploading ? 'bg-gray-400' : 'bg-primary-500'
          }`}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {isUploading ? 'Uploading...' : 'List Medicine'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UploadScreen;
