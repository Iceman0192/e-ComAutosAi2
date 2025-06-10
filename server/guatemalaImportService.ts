/**
 * Guatemala Import Calculator Service
 * No age restrictions, salvage allowed, complex IPRIMA tax system
 */

export interface GuatemalaVINAnalysis {
  vin: string;
  isValid: boolean;
  manufacturer: string;
  modelYear: number;
  caftaEligible: boolean;
  isUSAOrigin: boolean;
  wmi: string;
  isRebuildable: boolean; // Guatemala specific: salvage must be rebuildable
  isLHD: boolean; // Left-hand drive required
  aiValidation: {
    confidence: number;
    warnings: string[];
    recommendations: string[];
  };
}

export interface GuatemalaCalculationParams {
  vehiclePrice: number;
  freight: number;
  insurance: number;
  engineSize: number; // CC for IPRIMA category determination
  vehicleType: 'sedan' | 'suv' | 'pickup' | 'luxury' | 'motorcycle' | 'small_car';
  isLuxury: boolean;
  hasSalvageTitle: boolean;
  vinAnalysis: GuatemalaVINAnalysis;
}

export interface GuatemalaCalculationResult {
  cifValue: number;
  
  // Main taxes
  taxes: {
    dai: number; // Import Duty (0-20%, typically 10%)
    iva: number; // VAT 12% on (CIF + DAI)
    iprima: number; // First Registration Tax (5-20% based on category)
  };
  
  // Additional fees
  fees: {
    circulation: number; // Annual circulation fee (ISCV)
    licensePlate: number; // Q120 for cars, Q60 for motorcycles
    customsBroker: number; // Estimated broker fees
  };
  
  // Results
  totalTaxes: number;
  totalCost: number;
  
  // Guatemala specific
  vehicleCategory: string;
  iprimaRate: number;
  caftaSavings: number;
  salvagetitle: boolean;
  
  // Breakdown and insights
  breakdown: Array<{
    description: string;
    amount: number;
    percentage: number;
  }>;
  
  aiInsights?: {
    rebuildabilityAssessment: string;
    categoryClassification: string;
    costOptimization: string[];
    complianceNotes: string[];
  };
}

/**
 * Guatemala IPRIMA Vehicle Categories (15 categories defined by law)
 */
const GUATEMALA_IPRIMA_CATEGORIES = {
  motorcycle: { rate: 0.05, description: 'Motorcycles' },
  small_car: { rate: 0.05, description: 'Small cars (< 1000cc)' },
  sedan_small: { rate: 0.10, description: 'Standard sedans (1000-1500cc)' },
  sedan_medium: { rate: 0.12, description: 'Medium sedans (1500-2000cc)' },
  sedan_large: { rate: 0.15, description: 'Large sedans (2000-3000cc)' },
  suv_small: { rate: 0.12, description: 'Small SUVs (< 2000cc)' },
  suv_medium: { rate: 0.15, description: 'Medium SUVs (2000-3000cc)' },
  suv_large: { rate: 0.18, description: 'Large SUVs (> 3000cc)' },
  pickup_standard: { rate: 0.15, description: 'Standard pickup trucks' },
  pickup_luxury: { rate: 0.18, description: 'Luxury pickup trucks' },
  luxury_car: { rate: 0.20, description: 'Luxury cars (> Q300k value)' },
  luxury_suv: { rate: 0.20, description: 'Luxury SUVs (> Q300k value)' },
  sports_car: { rate: 0.20, description: 'Sports cars' },
  convertible: { rate: 0.18, description: 'Convertibles' },
  commercial_light: { rate: 0.10, description: 'Light commercial vehicles' }
};

/**
 * Determine IPRIMA category and rate based on vehicle specifications
 */
function determineIPRIMACategory(
  vehicleType: string,
  engineSize: number,
  isLuxury: boolean,
  vehicleValue: number
): { rate: number; description: string } {
  
  // Luxury threshold (approximately $38,500 USD = Q300,000)
  const luxuryThreshold = 300000; // Quetzals
  const vehicleValueQuetzals = vehicleValue * 7.8; // Approximate exchange rate
  
  if (vehicleType === 'motorcycle') {
    return GUATEMALA_IPRIMA_CATEGORIES.motorcycle;
  }
  
  if (engineSize < 1000) {
    return GUATEMALA_IPRIMA_CATEGORIES.small_car;
  }
  
  if (isLuxury || vehicleValueQuetzals > luxuryThreshold) {
    if (vehicleType === 'suv') {
      return GUATEMALA_IPRIMA_CATEGORIES.luxury_suv;
    }
    return GUATEMALA_IPRIMA_CATEGORIES.luxury_car;
  }
  
  switch (vehicleType) {
    case 'sedan':
      if (engineSize < 1500) return GUATEMALA_IPRIMA_CATEGORIES.sedan_small;
      if (engineSize < 2000) return GUATEMALA_IPRIMA_CATEGORIES.sedan_medium;
      return GUATEMALA_IPRIMA_CATEGORIES.sedan_large;
      
    case 'suv':
      if (engineSize < 2000) return GUATEMALA_IPRIMA_CATEGORIES.suv_small;
      if (engineSize < 3000) return GUATEMALA_IPRIMA_CATEGORIES.suv_medium;
      return GUATEMALA_IPRIMA_CATEGORIES.suv_large;
      
    case 'pickup':
      return isLuxury ? GUATEMALA_IPRIMA_CATEGORIES.pickup_luxury : GUATEMALA_IPRIMA_CATEGORIES.pickup_standard;
      
    default:
      return GUATEMALA_IPRIMA_CATEGORIES.sedan_medium; // Default fallback
  }
}

/**
 * Calculate Guatemala import duties and taxes
 */
export async function calculateGuatemalaImport(params: GuatemalaCalculationParams): Promise<GuatemalaCalculationResult> {
  const { vehiclePrice, freight, insurance, engineSize, vehicleType, isLuxury, hasSalvageTitle, vinAnalysis } = params;
  
  // CIF Value calculation
  const cifValue = vehiclePrice + freight + insurance;
  
  // Import Duty (DAI) - 10% standard, 0% if CAFTA eligible
  const daiRate = vinAnalysis.caftaEligible ? 0 : 0.10;
  const dai = cifValue * daiRate;
  
  // VAT (IVA) - 12% on (CIF + DAI)
  const ivaBase = cifValue + dai;
  const iva = ivaBase * 0.12;
  
  // IPRIMA (First Registration Tax) - Variable rate based on category
  const iprimaCategory = determineIPRIMACategory(vehicleType, engineSize, isLuxury, cifValue);
  const iprima = cifValue * iprimaCategory.rate;
  
  // Additional fees
  const circulation = vehicleType === 'motorcycle' ? 200 : 500; // ISCV (age-dependent, using average)
  const licensePlate = vehicleType === 'motorcycle' ? 60 : 120; // Q60/Q120
  const customsBroker = cifValue * 0.02; // Estimated 2% broker fees
  
  // Totals
  const totalTaxes = dai + iva + iprima;
  const totalFees = circulation + licensePlate + customsBroker;
  const totalCost = cifValue + totalTaxes + totalFees;
  
  // CAFTA savings
  const caftaSavings = vinAnalysis.caftaEligible ? (cifValue * 0.10) + ((cifValue * 0.10) * 0.12) : 0;
  
  // Breakdown for display
  const breakdown = [
    { description: 'Vehicle CIF Value', amount: cifValue, percentage: 100 },
    { description: `Import Duty (DAI) - ${(daiRate * 100).toFixed(0)}%`, amount: dai, percentage: (dai / cifValue) * 100 },
    { description: 'VAT (IVA) - 12%', amount: iva, percentage: (iva / cifValue) * 100 },
    { description: `IPRIMA - ${(iprimaCategory.rate * 100).toFixed(0)}% (${iprimaCategory.description})`, amount: iprima, percentage: (iprima / cifValue) * 100 },
    { description: 'Circulation Tax (ISCV)', amount: circulation, percentage: (circulation / cifValue) * 100 },
    { description: 'License Plate Fee', amount: licensePlate, percentage: (licensePlate / cifValue) * 100 },
    { description: 'Customs Broker Fee', amount: customsBroker, percentage: (customsBroker / cifValue) * 100 }
  ];
  
  return {
    cifValue,
    taxes: { dai, iva, iprima },
    fees: { circulation, licensePlate, customsBroker },
    totalTaxes,
    totalCost,
    vehicleCategory: iprimaCategory.description,
    iprimaRate: iprimaCategory.rate,
    caftaSavings,
    salvagetitle: hasSalvageTitle,
    breakdown,
    aiInsights: {
      rebuildabilityAssessment: hasSalvageTitle ? 
        'Salvage vehicle - ensure it is rebuildable (not branded "irreconstruible")' : 
        'Clean title vehicle - no salvage concerns',
      categoryClassification: `Vehicle classified as: ${iprimaCategory.description}`,
      costOptimization: [
        vinAnalysis.caftaEligible ? 'CAFTA benefits applied - duty-free import' : 'Consider CAFTA-eligible vehicles for duty savings',
        'No age restrictions in Guatemala - any model year allowed',
        hasSalvageTitle ? 'Salvage vehicles allowed if rebuildable' : 'Clean title provides import advantages'
      ],
      complianceNotes: [
        'Must be left-hand drive (LHD) - RHD vehicles prohibited',
        'Vehicle must be operational (engine starts) if 7+ years old',
        'No specific emissions standards required at import',
        'VIN tampering strictly prohibited'
      ]
    }
  };
}

/**
 * Validate vehicle eligibility for Guatemala import
 */
export function validateGuatemalaEligibility(vinAnalysis: GuatemalaVINAnalysis, hasSalvageTitle: boolean): {
  eligible: boolean;
  warnings: string[];
  restrictions: string[];
} {
  const warnings: string[] = [];
  const restrictions: string[] = [];
  
  // No age restrictions (2013 Constitutional Court ruling)
  // This is a major advantage for Guatemala
  
  // Left-hand drive requirement
  if (!vinAnalysis.isLHD) {
    restrictions.push('Vehicle must be left-hand drive (LHD). Right-hand drive vehicles are prohibited.');
  }
  
  // Salvage title handling
  if (hasSalvageTitle && !vinAnalysis.isRebuildable) {
    restrictions.push('Salvage vehicle must be rebuildable. Vehicles branded "irreconstruible" (irreparable/junk) cannot be imported.');
  }
  
  // VIN integrity
  if (!vinAnalysis.isValid) {
    restrictions.push('VIN must be intact and unaltered. VIN tampering is illegal.');
  }
  
  // Age-related operational requirement
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vinAnalysis.modelYear;
  if (vehicleAge >= 7) {
    warnings.push('Vehicle is 7+ years old - must be operational (engine must start) during customs inspection.');
  }
  
  // CAFTA eligibility note
  if (!vinAnalysis.caftaEligible) {
    warnings.push('Vehicle not CAFTA-eligible - full 10% import duty will apply.');
  }
  
  return {
    eligible: restrictions.length === 0,
    warnings,
    restrictions
  };
}