import { ParsedFields } from '../../config/types';

// ML Kit OCR implementation for Dev Client
// This would use expo-ml-kit or similar package in a real implementation
export const mlkitParse = async (imageUri: string): Promise<ParsedFields> => {
  try {
    // Note: This is a placeholder implementation
    // In a real app, you would use ML Kit Text Recognition
    // Example with expo-ml-kit:
    // import { TextRecognition } from 'expo-ml-kit';
    // const result = await TextRecognition.recognizeTextAsync(imageUri);
    
    // For now, we'll simulate ML Kit processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted text that would come from ML Kit
    const mockExtractedText = `
      Paracetamol Tablets 500mg
      Batch No: PCM123456
      Mfg: HealthCorp Pharmaceuticals
      Exp: 08/2024
      MRP: Rs. 45.00
    `;
    
    return parseTextToFields(mockExtractedText);
  } catch (error) {
    console.error('ML Kit OCR error:', error);
    return {};
  }
};

const parseTextToFields = (text: string): ParsedFields => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const result: ParsedFields = {};
  
  for (const line of lines) {
    // Extract medicine name (usually the first substantial line)
    if (!result.name && line.length > 5 && !line.includes('Batch') && !line.includes('Mfg') && !line.includes('Exp') && !line.includes('MRP')) {
      result.name = line.replace(/tablets?|capsules?|syrup|suspension/gi, '').trim();
    }
    
    // Extract batch number
    const batchMatch = line.match(/batch\s*no?[:\s-]*([A-Z0-9]+)/i);
    if (batchMatch) {
      result.batchNo = batchMatch[1];
    }
    
    // Extract manufacturer
    const mfgMatch = line.match(/mfg[:\s-]*(.+)/i) || line.match(/manufacturer[:\s-]*(.+)/i);
    if (mfgMatch) {
      result.manufacturer = mfgMatch[1].trim();
    }
    
    // Extract expiry date
    const expMatch = line.match(/exp[:\s-]*(\d{2}\/\d{2,4}|\d{2}\/\d{4}|[A-Za-z]{3}\s?\d{4})/i);
    if (expMatch) {
      result.expiryDate = expMatch[1];
    }
  }
  
  return result;
};
