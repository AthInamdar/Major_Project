import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  QueryConstraint,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { User, Medicine, Cart, UserRole } from '../config/types';

// User operations
export const createUser = async (uid: string, userData: Omit<User, 'uid' | 'createdAt'>) => {
  const userRef = doc(db, 'users', uid);
  const user: User = {
    ...userData,
    uid,
    createdAt: Timestamp.now(),
  };
  await setDoc(userRef, user);
  return user;
};

export const getUser = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() as User : null;
};

export const updateUser = async (uid: string, updates: Partial<User>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);
};

// Medicine operations
export const createMedicine = async (medicineData: Omit<Medicine, 'id' | 'createdAt'>) => {
  const medicinesRef = collection(db, 'medicines');
  const medicine = {
    ...medicineData,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(medicinesRef, medicine);
  return { ...medicine, id: docRef.id };
};

export const getMedicine = async (id: string): Promise<Medicine | null> => {
  const medicineRef = doc(db, 'medicines', id);
  const medicineSnap = await getDoc(medicineRef);
  return medicineSnap.exists() ? { ...medicineSnap.data(), id } as Medicine : null;
};

export const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
  const medicineRef = doc(db, 'medicines', id);
  await updateDoc(medicineRef, updates);
};

export const deleteMedicine = async (id: string) => {
  const medicineRef = doc(db, 'medicines', id);
  await deleteDoc(medicineRef);
};

export const getMedicinesByPharmacy = async (pharmacyId: string): Promise<Medicine[]> => {
  const medicinesRef = collection(db, 'medicines');
  const q = query(
    medicinesRef,
    where('pharmacyId', '==', pharmacyId),
    where('status', '==', 'active'), // Added to comply with security rules
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medicine));
};

// For pharmacists to get ALL their medicines (active, paused, soldout)
export const getAllMedicinesByPharmacy = async (pharmacyId: string): Promise<Medicine[]> => {
  const medicinesRef = collection(db, 'medicines');
  const q = query(
    medicinesRef,
    where('pharmacyId', '==', pharmacyId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medicine));
};

export const getActiveMedicines = async (constraints: QueryConstraint[] = []): Promise<Medicine[]> => {
  const medicinesRef = collection(db, 'medicines');
  const baseConstraints = [
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
  ];
  const q = query(medicinesRef, ...baseConstraints, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medicine));
};

export const searchMedicines = async (searchTerm: string): Promise<Medicine[]> => {
  const medicinesRef = collection(db, 'medicines');
  const q = query(
    medicinesRef,
    where('status', '==', 'active'),
    orderBy('name'),
    limit(50)
  );
  const querySnapshot = await getDocs(q);
  const medicines = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Medicine));
  
  // Client-side filtering for search term
  return medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Cart operations
export const getCart = async (uid: string): Promise<Cart | null> => {
  const cartRef = doc(db, 'carts', uid);
  const cartSnap = await getDoc(cartRef);
  return cartSnap.exists() ? cartSnap.data() as Cart : null;
};

export const updateCart = async (uid: string, cart: Omit<Cart, 'updatedAt'>) => {
  const cartRef = doc(db, 'carts', uid);
  const cartData: Cart = {
    ...cart,
    updatedAt: Timestamp.now(),
  };
  await setDoc(cartRef, cartData);
};

export const clearCart = async (uid: string) => {
  const cartRef = doc(db, 'carts', uid);
  await deleteDoc(cartRef);
};

// Pharmacy operations
export const getPharmacies = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('role', '==', 'pharmacist'),
    where('location', '!=', null)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as User);
};

// Medicine upload interface for validation
interface MedicineUploadData {
  name: string;
  batchNo: string | number;
  manufacturer: string;
  expiryDate: Date | Timestamp | string;
  mrp: number;
  price: number;
  quantity: number;
  pharmacyName: string;
  geo: {
    lat: number;
    lng: number;
    geohash?: string;
    address?: string;
  };
  description?: string;
  photos?: string[];
}

/**
 * Upload a medicine document to Firestore with proper validation
 * @param medicineData - Medicine data to upload
 * @returns Promise<string> - Document ID of created medicine
 * @throws Error if validation fails or user not authenticated
 */
export const uploadMedicine = async (medicineData: MedicineUploadData): Promise<string> => {
  // Check authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be authenticated to upload medicines');
  }

  // Validate required fields
  const requiredFields = [
    'name', 'batchNo', 'manufacturer', 'expiryDate', 
    'mrp', 'price', 'quantity', 'pharmacyName', 'geo'
  ];
  
  const missingFields = requiredFields.filter(field => {
    const value = medicineData[field as keyof MedicineUploadData];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate geo object structure
  if (!medicineData.geo.lat || !medicineData.geo.lng) {
    throw new Error('geo object must contain lat and lng coordinates');
  }

  // Validate numeric fields
  if (typeof medicineData.mrp !== 'number' || medicineData.mrp <= 0) {
    throw new Error('mrp must be a positive number');
  }
  if (typeof medicineData.price !== 'number' || medicineData.price <= 0) {
    throw new Error('price must be a positive number');
  }
  if (typeof medicineData.quantity !== 'number' || medicineData.quantity <= 0) {
    throw new Error('quantity must be a positive number');
  }

  // Convert expiryDate to Timestamp if needed
  let expiryTimestamp: Timestamp;
  if (medicineData.expiryDate instanceof Timestamp) {
    expiryTimestamp = medicineData.expiryDate;
  } else if (medicineData.expiryDate instanceof Date) {
    expiryTimestamp = Timestamp.fromDate(medicineData.expiryDate);
  } else if (typeof medicineData.expiryDate === 'string') {
    expiryTimestamp = Timestamp.fromDate(new Date(medicineData.expiryDate));
  } else {
    throw new Error('expiryDate must be a Date, Timestamp, or valid date string');
  }

  // Prepare the medicine document
  const medicineDoc = {
    name: String(medicineData.name).trim(),
    batchNo: String(medicineData.batchNo).trim(),
    manufacturer: String(medicineData.manufacturer).trim(),
    expiryDate: expiryTimestamp,
    mrp: Number(medicineData.mrp),
    price: Number(medicineData.price),
    quantity: Number(medicineData.quantity),
    pharmacyId: currentUser.uid, // Auto-set from authenticated user
    pharmacyName: String(medicineData.pharmacyName).trim(),
    geo: {
      lat: Number(medicineData.geo.lat),
      lng: Number(medicineData.geo.lng),
      geohash: medicineData.geo.geohash || '',
      address: medicineData.geo.address || ''
    },
    status: 'active' as const, // Default status
    description: medicineData.description?.trim() || '',
    photos: medicineData.photos || [],
    createdAt: Timestamp.now(),
  };

  // Log payload for debugging
  console.log('📤 Uploading medicine payload:', {
    ...medicineDoc,
    expiryDate: medicineDoc.expiryDate.toDate().toISOString(),
    createdAt: medicineDoc.createdAt.toDate().toISOString()
  });

  try {
    // Upload to Firestore
    const medicinesRef = collection(db, 'medicines');
    const docRef = await addDoc(medicinesRef, medicineDoc);
    
    console.log('✅ Medicine uploaded successfully with ID:', docRef.id);
    return docRef.id;
    
  } catch (error: any) {
    console.error('❌ Medicine upload failed:', error);
    
    // Provide helpful error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore security rules and authentication');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Upload failed: Required Firestore index may be missing');
    } else if (error.code === 'invalid-argument') {
      throw new Error('Invalid data: Check that all fields match expected types');
    } else {
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }
};
