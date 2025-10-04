import { ParsedFields } from '../../config/types';
import { mockParse } from './mock';
import { mlkitParse } from './mlkit';
import Constants from 'expo-constants';

export class OcrService {
  static async parse(imageUri: string): Promise<ParsedFields> {
    // For now, always use mock OCR for compatibility
    return mockParse(imageUri);
  }

  static async parseExpiryLabel(imageUri: string): Promise<ParsedFields> {
    // Extract all fields from expiry label photo (MRP, Batch No, Mfd date, Exp date)
    const result = await mockParse(imageUri);
    return {
      batchNo: result.batchNo,
      expiryDate: result.expiryDate,
      mrp: result.mrp,
      mfdDate: result.mfdDate,
    };
  }
}

export { mockParse, mlkitParse };
