/**
 * El Salvador Import Service - AI-Enhanced Multi-Model Analysis
 * Professional-grade import duty calculations with comprehensive age restrictions and salvage handling
 */

import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ElSalvadorCalculationResult {
  cifValue: number;
  isEligible: boolean;
  eligibilityReason: string;
  vehicleCategory: 'passenger' | 'pickup' | 'bus' | 'heavy_truck' | 'motorcycle';
  hasSalvageDiscount: boolean;
  adjustedValue: number;
  taxes: {
    dai: number;
    iva: number;
    firstRegistration: number;
    incomeTaxAdvance: number;
  };
  totalTaxes: number;
  totalCost: number;
  caftaSavings: number;
  breakdown: {
    step: string;
    description: string;
    amount: number;
    rate?: string;
  }[];
  aiInsights: {
    ageCompliance: string;
    salvageStrategy: string[];
    costOptimization: string[];
    complianceNotes: string[];
  };
}

/**
 * El Salvador Age Eligibility Check
 */
function checkAgeEligibility(modelYear: number, vehicleCategory: string): { eligible: boolean; reason: string } {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - modelYear;
  
  const limits = {
    passenger: 8,    // Cars, SUVs, pickups, motorcycles
    bus: 10,         // Heavy passenger vehicles
    heavy_truck: 15  // Trucks ≥3 tons
  };
  
  const maxAge = limits[vehicleCategory as keyof typeof limits] || 8;
  
  if (vehicleAge > maxAge) {
    return {
      eligible: false,
      reason: `Vehicle is ${vehicleAge} years old. Maximum allowed age for ${vehicleCategory} is ${maxAge} years.`
    };
  }
  
  return {
    eligible: true,
    reason: `Vehicle age (${vehicleAge} years) complies with ${vehicleCategory} limit of ${maxAge} years.`
  };
}

/**
 * Determine vehicle category from VIN analysis
 */
function categorizeVehicle(vinAnalysis: any): string {
  // This would ideally use more sophisticated VIN decoding
  // For now, using basic rules
  const manufacturer = vinAnalysis.manufacturer?.toLowerCase() || '';
  
  if (manufacturer.includes('motorcycle') || manufacturer.includes('bike')) {
    return 'motorcycle';
  }
  
  // Default to passenger for most auction vehicles
  return 'passenger';
}

/**
 * Calculate DAI rates based on vehicle specifications
 */
function calculateDAIRate(vehicleCategory: string, engineSize: number, caftaEligible: boolean): number {
  if (caftaEligible) return 0.0; // CAFTA duty-free
  
  switch (vehicleCategory) {
    case 'pickup':
      return 0.05; // 5% for light cargo vehicles
    case 'bus':
    case 'heavy_truck':
      return 0.01; // 1% for commercial vehicles
    case 'passenger':
    default:
      // Engine size determines rate for passenger vehicles
      return engineSize > 2.0 ? 0.30 : 0.25; // 30% if >2.0L, 25% otherwise
  }
}

/**
 * Calculate First Registration Tax rates
 */
function calculateFirstRegRate(vehicleCategory: string, engineSize: number, is4x4: boolean): number {
  switch (vehicleCategory) {
    case 'pickup':
    case 'bus':
    case 'heavy_truck':
      return 0.01; // 1% for commercial vehicles
    case 'motorcycle':
      return engineSize <= 0.25 ? 0.01 : 0.08; // 1% for ≤250cc, 8% for >250cc
    case 'passenger':
    default:
      if (is4x4) return 0.06; // 6% for 4x4 vehicles
      return engineSize > 2.0 ? 0.08 : 0.04; // 8% if >2.0L, 4% otherwise
  }
}

/**
 * AI-Enhanced El Salvador Import Calculation
 */
export async function calculateElSalvadorImport(
  vehiclePrice: number,
  freight: number,
  insurance: number,
  vinAnalysis: any,
  engineSize: number = 2.0,
  is4x4: boolean = false,
  hasSalvageTitle: boolean = false,
  isPersonalUse: boolean = true
): Promise<ElSalvadorCalculationResult> {
  
  const cifValue = vehiclePrice + freight + insurance;
  const vehicleCategory = categorizeVehicle(vinAnalysis);
  
  // Check age eligibility
  const ageCheck = checkAgeEligibility(vinAnalysis.modelYear || 2020, vehicleCategory);
  
  if (!ageCheck.eligible) {
    return {
      cifValue,
      isEligible: false,
      eligibilityReason: ageCheck.reason,
      vehicleCategory: vehicleCategory as any,
      hasSalvageDiscount: false,
      adjustedValue: cifValue,
      taxes: { dai: 0, iva: 0, firstRegistration: 0, incomeTaxAdvance: 0 },
      totalTaxes: 0,
      totalCost: cifValue,
      caftaSavings: 0,
      breakdown: [],
      aiInsights: {
        ageCompliance: ageCheck.reason,
        salvageStrategy: ['Vehicle exceeds age limits - consider collector/antique exemption if 30+ years old'],
        costOptimization: [],
        complianceNotes: ['Vehicle cannot be imported for road use due to age restrictions']
      }
    };
  }
  
  // Apply salvage discount if applicable
  let adjustedValue = cifValue;
  const hasSalvageDiscount = hasSalvageTitle;
  
  if (hasSalvageDiscount) {
    adjustedValue = cifValue * 0.6; // 40% reduction for salvage vehicles
  }
  
  const breakdown: any[] = [];
  
  // Step 1: CIF Value
  breakdown.push({
    step: "1",
    description: "CIF Value (Vehicle + Freight + Insurance)",
    amount: cifValue,
    rate: "Base calculation"
  });
  
  // Step 2: Salvage adjustment (if applicable)
  if (hasSalvageDiscount) {
    breakdown.push({
      step: "2",
      description: "Salvage Title Discount (40% reduction)",
      amount: adjustedValue - cifValue,
      rate: "40% discount"
    });
  }
  
  // Step 3: DAI (Import Duty)
  const daiRate = calculateDAIRate(vehicleCategory, engineSize, vinAnalysis.caftaEligible);
  const dai = adjustedValue * daiRate;
  
  breakdown.push({
    step: hasSalvageDiscount ? "3" : "2",
    description: `DAI - Import Duty ${vinAnalysis.caftaEligible ? '(CAFTA 0%)' : `(${(daiRate * 100).toFixed(1)}%)`}`,
    amount: dai,
    rate: `${(daiRate * 100).toFixed(1)}%`
  });
  
  // Step 4: IVA (VAT) - 13% on (CIF + DAI)
  const ivaBase = adjustedValue + dai;
  const iva = ivaBase * 0.13;
  
  breakdown.push({
    step: hasSalvageDiscount ? "4" : "3",
    description: "IVA - Value Added Tax (13%)",
    amount: iva,
    rate: "13%"
  });
  
  // Step 5: First Registration Tax
  const firstRegRate = calculateFirstRegRate(vehicleCategory, engineSize, is4x4);
  const firstRegistration = (adjustedValue + dai) * firstRegRate;
  
  breakdown.push({
    step: hasSalvageDiscount ? "5" : "4",
    description: `First Registration Tax (${(firstRegRate * 100).toFixed(1)}%)`,
    amount: firstRegistration,
    rate: `${(firstRegRate * 100).toFixed(1)}%`
  });
  
  // Step 6: Income Tax Advance (for business imports)
  let incomeTaxAdvance = 0;
  if (!isPersonalUse) {
    incomeTaxAdvance = cifValue * 0.05; // 5% advance for business imports
    breakdown.push({
      step: hasSalvageDiscount ? "6" : "5",
      description: "Income Tax Advance (Business Import)",
      amount: incomeTaxAdvance,
      rate: "5%"
    });
  }
  
  const totalTaxes = dai + iva + firstRegistration + incomeTaxAdvance;
  const totalCost = cifValue + totalTaxes;
  const caftaSavings = vinAnalysis.caftaEligible ? adjustedValue * 0.25 : 0; // Estimated savings
  
  // Generate AI insights
  const aiInsights = await generateElSalvadorInsights(
    cifValue, totalTaxes, vinAnalysis, vehicleCategory, 
    hasSalvageDiscount, ageCheck.eligible
  );
  
  return {
    cifValue,
    isEligible: true,
    eligibilityReason: ageCheck.reason,
    vehicleCategory: vehicleCategory as any,
    hasSalvageDiscount,
    adjustedValue,
    taxes: {
      dai,
      iva,
      firstRegistration,
      incomeTaxAdvance
    },
    totalTaxes,
    totalCost,
    caftaSavings,
    breakdown,
    aiInsights
  };
}

/**
 * Generate AI insights for El Salvador imports
 */
async function generateElSalvadorInsights(
  cifValue: number,
  totalTaxes: number,
  vinAnalysis: any,
  vehicleCategory: string,
  hasSalvageDiscount: boolean,
  ageCompliant: boolean
): Promise<any> {
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert El Salvador vehicle import consultant specializing in auction vehicles and CAFTA-DR regulations.
          
          Provide professional analysis including:
          1. Age compliance assessment
          2. Salvage title strategy recommendations
          3. Cost optimization strategies
          4. Compliance considerations
          
          Respond with JSON: {
            "ageCompliance": "string",
            "salvageStrategy": ["string"],
            "costOptimization": ["string"],
            "complianceNotes": ["string"]
          }`
        },
        {
          role: "user",
          content: `Analyze this El Salvador import:
          - CIF Value: $${cifValue.toLocaleString()}
          - Total Taxes: $${totalTaxes.toLocaleString()}
          - Tax Rate: ${((totalTaxes/cifValue)*100).toFixed(1)}%
          - Vehicle Year: ${vinAnalysis.modelYear}
          - Category: ${vehicleCategory}
          - CAFTA Eligible: ${vinAnalysis.caftaEligible}
          - Has Salvage Discount: ${hasSalvageDiscount}
          - Age Compliant: ${ageCompliant}
          - VIN: ${vinAnalysis.vin}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('AI insights generation failed:', error);
    return {
      ageCompliance: ageCompliant ? "Vehicle meets age requirements" : "Vehicle exceeds age limits",
      salvageStrategy: hasSalvageDiscount ? 
        ["40% salvage discount applied", "Ensure proper salvage documentation"] : 
        ["Clean title - no additional discounts"],
      costOptimization: ["Verify CAFTA eligibility documentation", "Consider repair costs vs. savings"],
      complianceNotes: ["Ensure left-hand drive", "Prepare for emissions and safety inspection"]
    };
  }
}