/**
 * Nicaragua Import Service - 10-Year Age Limit & Engine-Based ISC
 * Professional-grade import duty calculations with Multi-AI validation
 */

import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface NicaraguaVINAnalysis {
  vin: string;
  isValid: boolean;
  modelYear: number | null;
  manufacturer: string;
  isUSAOrigin: boolean;
  caftaEligible: boolean;
  wmi: string;
  engineSize: number;
  isLHD: boolean;
  ageCompliant: boolean;
  aiValidation: {
    confidence: number;
    warnings: string[];
    recommendations: string[];
  };
}

interface NicaraguaCalculationResult {
  cifValue: number;
  vehicleAge: number;
  ageCompliant: boolean;
  taxes: {
    dai: number;
    isc: number;
    iva: number;
    registrationFee: number;
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
    importFeasibility: string;
    costOptimization: string[];
    complianceNotes: string[];
  };
}

/**
 * Validate vehicle eligibility for Nicaragua import
 */
export function validateNicaraguaEligibility(vinAnalysis: NicaraguaVINAnalysis, hasSalvageTitle: boolean): {
  eligible: boolean;
  warnings: string[];
  restrictions: string[];
} {
  const warnings: string[] = [];
  const restrictions: string[] = [];
  
  // 10-year age limit (strict enforcement)
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - (vinAnalysis.modelYear || currentYear);
  
  if (vehicleAge > 10) {
    restrictions.push(`Vehicle is ${vehicleAge} years old. Nicaragua prohibits import of passenger vehicles older than 10 years from manufacture date.`);
    restrictions.push('Exceptions exist for donations to NGOs, classic car collectors, or returning residents with special permits.');
  }
  
  // Left-hand drive requirement
  if (!vinAnalysis.isLHD) {
    restrictions.push('Vehicle must be left-hand drive (LHD). Right-hand drive vehicles are prohibited for road use in Nicaragua.');
  }
  
  // Salvage title handling
  if (hasSalvageTitle) {
    warnings.push('Salvage vehicles allowed if repairable and ≤10 years old. Must be rebuilt to roadworthy condition before registration.');
    warnings.push('Vehicle will undergo police inspection - VIN and engine numbers must be intact and match documentation.');
  }
  
  // VIN integrity
  if (!vinAnalysis.isValid) {
    restrictions.push('VIN must be intact and unaltered. VIN tampering will result in registration denial.');
  }
  
  // Age-related warnings
  if (vehicleAge >= 8) {
    warnings.push(`Vehicle is ${vehicleAge} years old - approaching the 10-year import limit. Consider newer alternatives.`);
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

/**
 * Calculate ISC rate based on engine displacement
 */
function calculateISCRate(engineSize: number): number {
  if (engineSize <= 1.6) return 0.10;      // ≤1600cc: 10%
  if (engineSize <= 2.6) return 0.15;      // 1601-2600cc: 15%
  if (engineSize <= 3.0) return 0.20;      // 2601-3000cc: 20%
  if (engineSize <= 4.0) return 0.30;      // 3001-4000cc: 30%
  return 0.35;                              // >4000cc: 35%
}

/**
 * Get ISC bracket description
 */
function getISCBracketDescription(engineSize: number): string {
  if (engineSize <= 1.6) return '≤1600cc (10%)';
  if (engineSize <= 2.6) return '1601-2600cc (15%)';
  if (engineSize <= 3.0) return '2601-3000cc (20%)';
  if (engineSize <= 4.0) return '3001-4000cc (30%)';
  return '>4000cc (35%)';
}

/**
 * Calculate Nicaragua import duties with age and engine-based taxes
 */
export async function calculateNicaraguaImport(
  vehiclePrice: number,
  freight: number,
  insurance: number,
  vinAnalysis: NicaraguaVINAnalysis
): Promise<NicaraguaCalculationResult> {
  
  // Calculate CIF value
  const cifValue = vehiclePrice + freight + insurance;
  
  // Age validation
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - (vinAnalysis.modelYear || currentYear);
  const ageCompliant = vehicleAge <= 10;
  
  if (!ageCompliant) {
    throw new Error(`Vehicle is ${vehicleAge} years old. Nicaragua prohibits import of vehicles older than 10 years.`);
  }
  
  // Tax calculations based on Nicaragua's structure
  
  // 1. Import Duty (DAI) - 10% standard, 0% if CAFTA-eligible
  const daiRate = vinAnalysis.caftaEligible ? 0 : 0.10;
  const dai = cifValue * daiRate;
  
  // 2. Selective Consumption Tax (ISC) - engine-based rates
  const iscRate = calculateISCRate(vinAnalysis.engineSize);
  const iscBase = cifValue + dai;
  const isc = iscBase * iscRate;
  
  // 3. Value Added Tax (IVA) - 15% on CIF + DAI + ISC
  const ivaBase = cifValue + dai + isc;
  const iva = ivaBase * 0.15;
  
  // 4. Registration and processing fees (estimated)
  const registrationFee = 75; // ~$50-$100 for registration and plates
  
  const totalTaxes = dai + isc + iva + registrationFee;
  const totalCost = cifValue + totalTaxes;
  const caftaSavings = vinAnalysis.caftaEligible ? (cifValue * 0.10) : 0;
  
  // Detailed breakdown
  const breakdown = [
    {
      step: 'Vehicle CIF Value',
      description: 'Cost + Insurance + Freight',
      amount: cifValue
    },
    {
      step: 'Import Duty (DAI)',
      description: vinAnalysis.caftaEligible ? 'CAFTA-DR Eligible (0%)' : 'Standard Rate (10%)',
      amount: dai,
      rate: `${(daiRate * 100).toFixed(0)}%`
    },
    {
      step: 'Selective Consumption Tax (ISC)',
      description: `Engine ${getISCBracketDescription(vinAnalysis.engineSize)}`,
      amount: isc,
      rate: `${(iscRate * 100).toFixed(0)}%`
    },
    {
      step: 'Value Added Tax (IVA)',
      description: 'Applied on CIF + DAI + ISC (15%)',
      amount: iva,
      rate: '15%'
    },
    {
      step: 'Registration & Fees',
      description: 'Police registration, plates, processing',
      amount: registrationFee
    }
  ];
  
  // Generate AI insights using OpenAI
  let aiInsights = {
    importFeasibility: 'Import calculation completed successfully.',
    costOptimization: ['Consider vehicle age and engine size for optimal tax rates.'],
    complianceNotes: ['Ensure all documentation is complete for customs clearance.']
  };
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a Nicaragua customs and import specialist. Analyze this vehicle import calculation and provide professional insights in JSON format with these fields:
          - importFeasibility: brief assessment of import viability
          - costOptimization: array of 2-3 practical cost-saving recommendations
          - complianceNotes: array of 2-3 important compliance requirements`
        },
        {
          role: "user",
          content: `Vehicle Import Analysis:
          - VIN: ${vinAnalysis.vin}
          - Model Year: ${vinAnalysis.modelYear}
          - Vehicle Age: ${vehicleAge} years (limit: 10 years)
          - Engine Size: ${vinAnalysis.engineSize}L
          - CIF Value: $${cifValue.toLocaleString()}
          - CAFTA Eligible: ${vinAnalysis.caftaEligible}
          - Total Taxes: $${totalTaxes.toLocaleString()}
          - ISC Rate: ${(iscRate * 100).toFixed(0)}% (${getISCBracketDescription(vinAnalysis.engineSize)})
          - Age Compliant: ${ageCompliant}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    aiInsights = JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('AI insights generation failed:', error);
  }
  
  return {
    cifValue,
    vehicleAge,
    ageCompliant,
    taxes: {
      dai,
      isc,
      iva,
      registrationFee
    },
    totalTaxes,
    totalCost,
    caftaSavings,
    breakdown,
    aiInsights
  };
}

/**
 * Analyze VIN for Nicaragua import compliance
 */
export async function analyzeVINForNicaragua(vin: string): Promise<NicaraguaVINAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a VIN analysis expert for Nicaragua vehicle imports. Analyze the VIN and provide accurate information in JSON format with these exact fields:
          - isValid: boolean
          - modelYear: number (extracted from position 10)
          - manufacturer: string
          - isUSAOrigin: boolean (true only for VIN starting with 1, 4, or 5)
          - wmi: string (first 3 characters)
          - engineSize: number (estimated in liters, default 2.0 if unknown)
          - isLHD: boolean (assume true for USA/Canada vehicles)
          - confidence: number (0-100)
          - warnings: array of strings`
        },
        {
          role: "user",
          content: `Analyze this VIN for Nicaragua import: ${vin}
          
          Key requirements:
          - CAFTA-DR eligibility (only USA vehicles: VIN 1,4,5)
          - Age limit (≤10 years from manufacture)
          - Must be left-hand drive
          - Engine size affects ISC tax rates`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    // Calculate age compliance
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - (analysis.modelYear || currentYear);
    const ageCompliant = vehicleAge <= 10;
    
    return {
      vin,
      isValid: analysis.isValid || false,
      modelYear: analysis.modelYear || null,
      manufacturer: analysis.manufacturer || 'Unknown',
      isUSAOrigin: analysis.isUSAOrigin || false,
      caftaEligible: analysis.isUSAOrigin || false,
      wmi: analysis.wmi || vin.substring(0, 3),
      engineSize: analysis.engineSize || 2.0,
      isLHD: analysis.isLHD !== false,
      ageCompliant,
      aiValidation: {
        confidence: analysis.confidence || 50,
        warnings: analysis.warnings || [],
        recommendations: ageCompliant ? [] : ['Vehicle exceeds 10-year age limit for Nicaragua import']
      }
    };
    
  } catch (error) {
    console.error('VIN analysis failed:', error);
    
    // Fallback analysis
    const currentYear = new Date().getFullYear();
    const modelYear = parseInt(vin.charAt(9)) || currentYear;
    const vehicleAge = currentYear - modelYear;
    
    return {
      vin,
      isValid: vin.length === 17,
      modelYear,
      manufacturer: 'Unknown',
      isUSAOrigin: ['1', '4', '5'].includes(vin.charAt(0)),
      caftaEligible: ['1', '4', '5'].includes(vin.charAt(0)),
      wmi: vin.substring(0, 3),
      engineSize: 2.0,
      isLHD: true,
      ageCompliant: vehicleAge <= 10,
      aiValidation: {
        confidence: 30,
        warnings: ['AI analysis failed - using basic VIN parsing'],
        recommendations: []
      }
    };
  }
}