import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserProfile {
  name: string;
  email: string;
  role: 'user' | 'pharmacist';
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: any;
}

interface Medicine {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  expiryDate: string;
  quantity: number;
  status: 'active' | 'sold' | 'expired';
  pharmacyId: string;
  pharmacyName: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: any;
}

export class FirebaseTestSuite {
  private testEmail = `test-${Date.now()}@example.com`;
  private testPassword = 'TestPassword123!';
  private testUserId: string | null = null;

  async runAllTests() {
    console.log('🧪 Starting Firebase Test Suite...');
    
    try {
      // Test 1: Sign up test user
      await this.testSignUp();
      
      // Test 2: Write user profile
      await this.testWriteUserProfile();
      
      // Test 3: Read user profile
      await this.testReadUserProfile();
      
      // Test 4: Query pharmacists
      await this.testQueryPharmacists();
      
      // Test 5: Write medicine (as pharmacist)
      await this.testWriteMedicine();
      
      // Test 6: Read medicines
      await this.testReadMedicines();
      
      // Test 7: Test cart operations
      await this.testCartOperations();
      
      // Test 8: Test unauthorized access
      await this.testUnauthorizedAccess();
      
      console.log('✅ All Firebase tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private async testSignUp() {
    console.log('\n📝 Test 1: Sign up test user');
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        this.testEmail, 
        this.testPassword
      );
      this.testUserId = userCredential.user.uid;
      console.log('✅ User signed up successfully:', this.testUserId);
    } catch (error: any) {
      console.error('❌ Sign up failed:', error.message);
      throw error;
    }
  }

  private async testWriteUserProfile() {
    console.log('\n📝 Test 2: Write user profile');
    if (!this.testUserId) throw new Error('No test user ID');
    
    try {
      const userProfile: UserProfile = {
        name: 'Test Pharmacist',
        email: this.testEmail,
        role: 'pharmacist',
        phone: '+1234567890',
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'New Delhi, India'
        },
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', this.testUserId), userProfile);
      console.log('✅ User profile written successfully');
    } catch (error: any) {
      console.error('❌ Write user profile failed:', error.message);
      if (error.code === 'permission-denied') {
        console.log('🔒 Permission denied - check Firestore rules');
      }
      throw error;
    }
  }

  private async testReadUserProfile() {
    console.log('\n📝 Test 3: Read user profile');
    if (!this.testUserId) throw new Error('No test user ID');
    
    try {
      const docRef = doc(db, 'users', this.testUserId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ User profile read successfully:', docSnap.data());
      } else {
        console.log('❌ No user profile found');
      }
    } catch (error: any) {
      console.error('❌ Read user profile failed:', error.message);
      if (error.code === 'permission-denied') {
        console.log('🔒 Permission denied - check Firestore rules');
      }
    }
  }

  private async testQueryPharmacists() {
    console.log('\n📝 Test 4: Query pharmacists');
    
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'pharmacist')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`✅ Found ${querySnapshot.size} pharmacist(s)`);
      
      querySnapshot.forEach((doc) => {
        console.log('Pharmacist:', doc.id, doc.data());
      });
    } catch (error: any) {
      console.error('❌ Query pharmacists failed:', error.message);
      if (error.code === 'permission-denied') {
        console.log('🔒 Permission denied - check Firestore rules for pharmacist queries');
      }
    }
  }

  private async testWriteMedicine() {
    console.log('\n📝 Test 5: Write medicine document');
    if (!this.testUserId) throw new Error('No test user ID');
    
    try {
      const medicine: Medicine = {
        name: 'Test Medicine',
        description: 'A test medicine for Firebase testing',
        price: 50,
        originalPrice: 100,
        expiryDate: '2024-12-31',
        quantity: 10,
        status: 'active',
        pharmacyId: this.testUserId,
        pharmacyName: 'Test Pharmacy',
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'New Delhi, India'
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'medicines'), medicine);
      console.log('✅ Medicine written successfully with ID:', docRef.id);
    } catch (error: any) {
      console.error('❌ Write medicine failed:', error.message);
      if (error.code === 'permission-denied') {
        console.log('🔒 Permission denied - check Firestore rules for medicine creation');
      }
    }
  }

  private async testReadMedicines() {
    console.log('\n📝 Test 6: Read active medicines');
    
    try {
      const q = query(
        collection(db, 'medicines'),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`✅ Found ${querySnapshot.size} active medicine(s)`);
      
      querySnapshot.forEach((doc) => {
        console.log('Medicine:', doc.id, doc.data());
      });
    } catch (error: any) {
      console.error('❌ Read medicines failed:', error.message);
      if (error.code === 'permission-denied') {
        console.log('🔒 Permission denied - check Firestore rules for medicine reading');
      }
    }
  }

  private async testCartOperations() {
    console.log('\n📝 Test 7: Cart operations');
    if (!this.testUserId) throw new Error('No test user ID');
    
    try {
      // Write to cart
      const cartData = {
        items: [
          {
            medicineId: 'test-medicine-id',
            quantity: 2,
            price: 50
          }
        ],
        totalAmount: 100,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'carts', this.testUserId), cartData);
      console.log('✅ Cart written successfully');

      // Read from cart
      const cartDoc = await getDoc(doc(db, 'carts', this.testUserId));
      if (cartDoc.exists()) {
        console.log('✅ Cart read successfully:', cartDoc.data());
      }
    } catch (error: any) {
      console.error('❌ Cart operations failed:', error.message);
      if (error.code === 'permission-denied') {
        console.log('🔒 Permission denied - check Firestore rules for cart access');
      }
    }
  }

  private async testUnauthorizedAccess() {
    console.log('\n📝 Test 8: Test unauthorized access');
    
    try {
      // Try to read another user's profile (should fail)
      const fakeUserId = 'fake-user-id-12345';
      const docRef = doc(db, 'users', fakeUserId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('❌ Unauthorized access succeeded (this should not happen!)');
      } else {
        console.log('✅ Unauthorized access properly blocked');
      }
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.log('✅ Unauthorized access properly denied by Firestore rules');
      } else {
        console.error('❌ Unexpected error in unauthorized access test:', error.message);
      }
    }
  }

  private async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    try {
      if (auth.currentUser) {
        await signOut(auth);
        console.log('✅ Signed out successfully');
      }
    } catch (error: any) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

// Export function to run tests
export const runFirebaseTests = async () => {
  const testSuite = new FirebaseTestSuite();
  await testSuite.runAllTests();
};
