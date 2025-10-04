import { ParsedFields } from '../../config/types';

// Mock medicine data for demo purposes
const mockMedicines = [
  {
    name: 'Paracetamol 500mg',
    batchNo: 'PCM001',
    manufacturer: 'HealthCorp Ltd',
    expiryDate: '03/2026',
    mrp: 45.50,
    mfdDate: '03/2024',
  },
  {
    name: 'Ibuprofen 400mg',
    batchNo: 'IBU202',
    manufacturer: 'MediPharm Inc',
    expiryDate: '08/2025',
    mrp: 78.00,
    mfdDate: '08/2023',
  },
  {
    name: 'Cetirizine 10mg',
    batchNo: 'CTZ305',
    manufacturer: 'AllergyMed',
    expiryDate: '11/2025',
    mrp: 32.75,
    mfdDate: '11/2023',
  },
  {
    name: 'Amoxicillin 250mg',
    batchNo: 'AMX789',
    manufacturer: 'AntiBio Labs',
    expiryDate: '07/2025',
    mrp: 125.00,
    mfdDate: '07/2023',
  },
  {
    name: 'Metformin 500mg',
    batchNo: 'MET456',
    manufacturer: 'DiabetCare',
    expiryDate: '04/2026',
    mrp: 89.25,
    mfdDate: '04/2024',
  },
];

const validateDateLogic = (mfdDate: string, expiryDate: string) => {
  // Parse dates to ensure expiry is always after manufacturing
  const mfd = new Date(mfdDate);
  const exp = new Date(expiryDate);
  
  // If expiry date is before manufacturing date, they were swapped
  if (exp < mfd) {
    return {
      mfdDate: expiryDate,
      expiryDate: mfdDate,
    };
  }
  
  return {
    mfdDate,
    expiryDate,
  };
};

export const mockParse = async (imageUri: string): Promise<ParsedFields> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return a random medicine from our mock data
  const randomMedicine = mockMedicines[Math.floor(Math.random() * mockMedicines.length)];
  
  // Validate that expiry date is after manufacturing date
  const validatedDates = validateDateLogic(randomMedicine.mfdDate, randomMedicine.expiryDate);
  
  return {
    name: randomMedicine.name,
    batchNo: randomMedicine.batchNo,
    manufacturer: randomMedicine.manufacturer,
    expiryDate: validatedDates.expiryDate,
    mrp: randomMedicine.mrp,
    mfdDate: validatedDates.mfdDate,
  };
};
