import { VedAIResponse } from '../config/types';

// Stubbed Ved AI responses for common medicines
const medicineDatabase: Record<string, Omit<VedAIResponse, 'question'>> = {
  paracetamol: {
    dosage: 'Adults: 500-1000mg every 4-6 hours, max 4g/day. Children: 10-15mg/kg every 4-6 hours.',
    contraindications: ['Severe liver disease', 'Allergy to paracetamol'],
    sideEffects: ['Nausea', 'Skin rash (rare)', 'Liver damage (overdose)'],
    precautions: ['Do not exceed recommended dose', 'Avoid alcohol', 'Check other medications for paracetamol content'],
    generalAdvice: 'Safe when used as directed. Effective for pain and fever relief.',
  },
  ibuprofen: {
    dosage: 'Adults: 200-400mg every 4-6 hours, max 1200mg/day. Take with food.',
    contraindications: ['Peptic ulcer', 'Severe heart failure', 'Severe kidney disease', 'Allergy to NSAIDs'],
    sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness', 'Headache'],
    precautions: ['Take with food', 'Avoid if pregnant (3rd trimester)', 'Monitor blood pressure'],
    generalAdvice: 'Anti-inflammatory pain reliever. Use lowest effective dose for shortest duration.',
  },
  cetirizine: {
    dosage: 'Adults: 10mg once daily. Children 6-12 years: 5mg once daily.',
    contraindications: ['Severe kidney disease', 'Allergy to cetirizine or hydroxyzine'],
    sideEffects: ['Drowsiness', 'Dry mouth', 'Fatigue', 'Headache'],
    precautions: ['May cause drowsiness', 'Avoid alcohol', 'Use caution when driving'],
    generalAdvice: 'Non-sedating antihistamine for allergies. Less likely to cause drowsiness than older antihistamines.',
  },
  amoxicillin: {
    dosage: 'Adults: 250-500mg every 8 hours. Complete full course as prescribed.',
    contraindications: ['Penicillin allergy', 'Severe kidney disease'],
    sideEffects: ['Nausea', 'Diarrhea', 'Skin rash', 'Allergic reactions'],
    precautions: ['Complete full course', 'Take with food if stomach upset', 'Report any rash immediately'],
    generalAdvice: 'Antibiotic - prescription only. Must complete full course even if feeling better.',
  },
  metformin: {
    dosage: 'Start 500mg twice daily with meals. May increase gradually as directed by doctor.',
    contraindications: ['Severe kidney disease', 'Severe liver disease', 'Heart failure'],
    sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste', 'Vitamin B12 deficiency (long-term)'],
    precautions: ['Take with meals', 'Regular kidney function monitoring', 'Stop before surgery'],
    generalAdvice: 'Diabetes medication - prescription only. Regular monitoring required.',
  },
};

export const askVed = async (question: string): Promise<VedAIResponse> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lowerQuestion = question.toLowerCase();
  
  // Find matching medicine in our database
  for (const [medicine, data] of Object.entries(medicineDatabase)) {
    if (lowerQuestion.includes(medicine)) {
      return {
        question,
        ...data,
      };
    }
  }
  
  // Generic response for unknown medicines or general questions
  return {
    question,
    generalAdvice: 'I recommend consulting with a licensed healthcare professional or pharmacist for specific medical advice. Always read the medicine label and follow prescribed dosages. If you experience any adverse effects, seek medical attention immediately.',
  };
};

// Get available medicine information
export const getAvailableMedicines = (): string[] => {
  return Object.keys(medicineDatabase);
};
