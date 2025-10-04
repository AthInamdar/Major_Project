import { PriceAdvice } from '../config/types';

export const getSuggestedPrice = (
  mrp: number,
  expiryDate: Date,
  now: Date = new Date(),
  costFloor: number = 5
): PriceAdvice => {
  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysToExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

  let discountPct: number;
  let tier: string;

  if (daysToExpiry <= 30) {
    discountPct = 80;
    tier = '≤ 30 days';
  } else if (daysToExpiry <= 90) {
    discountPct = 70;
    tier = '31-90 days';
  } else if (daysToExpiry <= 180) {
    discountPct = 50;
    tier = '91-180 days';
  } else {
    discountPct = 30;
    tier = '> 180 days';
  }

  const discountAmount = (mrp * discountPct) / 100;
  const calculatedPrice = mrp - discountAmount;
  const minPrice = Math.max(0.1 * mrp, costFloor);
  const suggestedPrice = Math.max(calculatedPrice, minPrice);

  return {
    discountPct,
    suggestedPrice: Math.round(suggestedPrice * 100) / 100, // Round to 2 decimal places
    daysToExpiry,
    tier,
  };
};

export const validatePriceOverride = (
  suggestedPrice: number,
  overridePrice: number,
  mrp: number
): { isValid: boolean; warning?: string } => {
  if (overridePrice > mrp) {
    return {
      isValid: false,
      warning: 'Price cannot exceed MRP',
    };
  }

  if (overridePrice < 0.1 * mrp) {
    return {
      isValid: false,
      warning: 'Price cannot be less than 10% of MRP',
    };
  }

  const priceDiff = Math.abs(overridePrice - suggestedPrice);
  const diffPercentage = (priceDiff / suggestedPrice) * 100;

  if (diffPercentage > 20) {
    return {
      isValid: true,
      warning: `Price differs significantly from suggested price (${diffPercentage.toFixed(1)}% difference)`,
    };
  }

  return { isValid: true };
};
