import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// User types
export const UserRoleSchema = z.enum(['pharmacist', 'user']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  geohash: z.string(),
  address: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export const UserSchema = z.object({
  uid: z.string(),
  role: UserRoleSchema,
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  location: LocationSchema.optional(),
  createdAt: z.instanceof(Timestamp),
});
export type User = z.infer<typeof UserSchema>;

// Medicine types
export const MedicineStatusSchema = z.enum(['active', 'paused', 'soldout']);
export type MedicineStatus = z.infer<typeof MedicineStatusSchema>;

export const MedicineSchema = z.object({
  id: z.string(),
  name: z.string(),
  batchNo: z.string(),
  manufacturer: z.string(),
  expiryDate: z.instanceof(Timestamp),
  mrp: z.number(),
  price: z.number(),
  suggestedPrice: z.number(),
  quantity: z.number(),
  photos: z.array(z.string()),
  frontPhoto: z.string().optional(),
  expiryLabelPhoto: z.string().optional(),
  pharmacyId: z.string(),
  pharmacyName: z.string(),
  geo: LocationSchema,
  createdAt: z.instanceof(Timestamp),
  status: MedicineStatusSchema,
  description: z.string().optional(),
});
export type Medicine = z.infer<typeof MedicineSchema>;

// Cart types
export const CartItemSchema = z.object({
  medicineId: z.string(),
  name: z.string(),
  price: z.number(),
  qty: z.number(),
  photo: z.string(),
  pharmacyId: z.string(),
  pharmacyName: z.string(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  updatedAt: z.instanceof(Timestamp),
});
export type Cart = z.infer<typeof CartSchema>;

// OCR types
export const ParsedFieldsSchema = z.object({
  name: z.string().optional(),
  batchNo: z.string().optional(),
  manufacturer: z.string().optional(),
  expiryDate: z.string().optional(),
  mrp: z.number().optional(),
  mfdDate: z.string().optional(),
});
export type ParsedFields = z.infer<typeof ParsedFieldsSchema>;

// Price advice types
export const PriceAdviceSchema = z.object({
  discountPct: z.number(),
  suggestedPrice: z.number(),
  daysToExpiry: z.number(),
  tier: z.string(),
});
export type PriceAdvice = z.infer<typeof PriceAdviceSchema>;

// Form schemas
export const MedicineUploadFormSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  batchNo: z.string().min(1, 'Batch number is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  mrp: z.number().min(0.1, 'MRP must be greater than 0'),
  price: z.number().min(0.1, 'Price must be greater than 0'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  description: z.string().optional(),
  declaration: z.boolean().refine(val => val === true, 'You must confirm the declaration'),
});
export type MedicineUploadForm = z.infer<typeof MedicineUploadFormSchema>;

export const LoginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginForm = z.infer<typeof LoginFormSchema>;

export const SignupFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: UserRoleSchema,
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export type SignupForm = z.infer<typeof SignupFormSchema>;

// Ved AI types
export const VedAIResponseSchema = z.object({
  question: z.string(),
  dosage: z.string().optional(),
  contraindications: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),
  precautions: z.array(z.string()).optional(),
  generalAdvice: z.string(),
});
export type VedAIResponse = z.infer<typeof VedAIResponseSchema>;

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Upload: undefined;
  Map: undefined;
  Cart: undefined;
  Profile: undefined;
  MyListings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  MedicineDetails: { medicineId: string };
  Location: undefined;
  VedAI: undefined;
};
