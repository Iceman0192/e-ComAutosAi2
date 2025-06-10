/**
 * Honduras Import Service - AI-Enhanced Multi-Model Analysis
 * Professional-grade import duty calculations with OpenAI validation
 */

import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface VINAnalysisResult {
  vin: string;
  isValid: boolean;
  modelYear: number | null;
  manufacturer: string;
  isUSAOrigin: boolean;
  caftaEligible: boolean;
  wmi: string;
  aiValidation: {
    confidence: number;
    warnings: string[];
    recommendations: string[];
  };
}

interface HondurasCalculationResult {
  cifValue: number;
  regime: 'standard' | 'amnesty';
  taxes: {
    dai: number;
    isc: number;
    isv: number;
    ecotasa: number;
    amnestyFee: number;
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
    riskAssessment: string;
    costOptimization: string[];
    complianceNotes: string[];
  };
}

/**
 * AI-Enhanced VIN Analysis using GPT-4o
 */
export async function analyzeVINWithAI(vin: string): Promise<VINAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert automotive VIN decoder specializing in CAFTA-DR import regulations. 
          
          Analyze the provided VIN and determine:
          1. Validity (17 characters, proper format)
          2. Model year from position 10
          3. Manufacturer from WMI (positions 1-3)
          4. USA origin (positions 1, 4, 5 only indicate US manufacturing)
          5. CAFTA-DR eligibility
          6. Any compliance warnings
          
          Respond with JSON format: {
            "isValid": boolean,
            "modelYear": number|null,
            "manufacturer": string,
            "isUSAOrigin": boolean,
            "caftaEligible": boolean,
            "wmi": string,
            "confidence": number,
            "warnings": string[],
            "recommendations": string[]
          }`
        },
        {
          role: "user",
          content: `Analyze this VIN: ${vin}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      vin,
      isValid: analysis.isValid || false,
      modelYear: analysis.modelYear,
      manufacturer: analysis.manufacturer || 'Unknown',
      isUSAOrigin: analysis.isUSAOrigin || false,
      caftaEligible: analysis.caftaEligible || false,
      wmi: analysis.wmi || vin.substring(0, 3),
      aiValidation: {
        confidence: analysis.confidence || 0,
        warnings: analysis.warnings || [],
        recommendations: analysis.recommendations || []
      }
    };
  } catch (error) {
    console.error('OpenAI VIN analysis failed:', error);
    // Fallback to basic analysis
    return basicVINAnalysis(vin);
  }
}

/**
 * Calculate Honduras Import Duties with AI Insights
 */
export async function calculateHondurasImport(
  vehiclePrice: number,
  freight: number,
  insurance: number,
  vinAnalysis: VINAnalysisResult
): Promise<HondurasCalculationResult> {
  
  const cifValue = vehiclePrice + freight + insurance;
  const currentDate = new Date();
  const amnestyExpiry = new Date('2026-04-04');
  
  // Determine regime
  const isAmnestyEligible = vinAnalysis.modelYear && vinAnalysis.modelYear <= 2005 && currentDate <= amnestyExpiry;
  const regime = isAmnestyEligible ? 'amnesty' : 'standard';
  
  // Calculate taxes
  const daiRate = vinAnalysis.caftaEligible ? 0.0 : 0.15;
  const dai = cifValue * daiRate;
  
  let isc = 0;
  let isv = 0;
  let amnestyFee = 0;
  const breakdown: any[] = [];
  
  // Step-by-step calculation
  breakdown.push({
    step: "1",
    description: "CIF Value (Vehicle + Freight + Insurance)",
    amount: cifValue,
    rate: "Base calculation"
  });
  
  breakdown.push({
    step: "2",
    description: `DAI - Import Duty ${vinAnalysis.caftaEligible ? '(CAFTA 0%)' : '(15%)'}`,
    amount: dai,
    rate: `${(daiRate * 100).toFixed(1)}%`
  });
  
  if (isAmnestyEligible) {
    amnestyFee = 400; // L 10,000 ≈ $400 USD
    breakdown.push({
      step: "3",
      description: "Amnesty Flat Fee (replaces ISC + ISV + Registration)",
      amount: amnestyFee,
      rate: "Fixed L 10,000"
    });
  } else {
    // ISC calculation
    const iscBase = cifValue + dai;
    let iscRate = 0.10;
    
    if (iscBase > 100000) iscRate = 0.60;
    else if (iscBase > 50000) iscRate = 0.45;
    else if (iscBase > 20000) iscRate = 0.30;
    else if (iscBase > 10000) iscRate = 0.20;
    else if (iscBase > 7000) iscRate = 0.15;
    
    isc = iscBase * iscRate;
    
    breakdown.push({
      step: "3",
      description: "ISC - Selective Consumption Tax",
      amount: isc,
      rate: `${(iscRate * 100).toFixed(1)}%`
    });
    
    // ISV calculation
    const isvBase = cifValue + dai + isc;
    isv = isvBase * 0.15;
    
    breakdown.push({
      step: "4",
      description: "ISV - Sales Tax",
      amount: isv,
      rate: "15%"
    });
  }
  
  // Ecotasa
  let ecotasa = 200;
  if (cifValue > 25000) ecotasa = 400;
  else if (cifValue > 15000) ecotasa = 280;
  
  breakdown.push({
    step: isAmnestyEligible ? "4" : "5",
    description: "Ecotasa - Environmental Tax",
    amount: ecotasa,
    rate: "Value-based brackets"
  });
  
  const totalTaxes = dai + isc + isv + amnestyFee + ecotasa;
  const totalCost = cifValue + totalTaxes;
  const caftaSavings = vinAnalysis.caftaEligible ? cifValue * 0.15 : 0;
  
  // Generate AI insights
  const aiInsights = await generateAIInsights(cifValue, totalTaxes, vinAnalysis, regime);
  
  return {
    cifValue,
    regime: regime as 'standard' | 'amnesty',
    taxes: {
      dai,
      isc,
      isv,
      ecotasa,
      amnestyFee
    },
    totalTaxes,
    totalCost,
    caftaSavings,
    breakdown,
    aiInsights
  };
}

/**
 * Generate AI-powered insights and recommendations
 */
async function generateAIInsights(
  cifValue: number,
  totalTaxes: number,
  vinAnalysis: VINAnalysisResult,
  regime: string
): Promise<any> {
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert import consultant specializing in Honduras vehicle imports under CAFTA-DR regulations.
          
          Provide professional analysis including:
          1. Risk assessment for this import
          2. Cost optimization strategies
          3. Compliance considerations
          
          Respond with JSON: {
            "riskAssessment": "string",
            "costOptimization": ["string"],
            "complianceNotes": ["string"]
          }`
        },
        {
          role: "user",
          content: `Analyze this import:
          - CIF Value: $${cifValue.toLocaleString()}
          - Total Taxes: $${totalTaxes.toLocaleString()}
          - Tax Rate: ${((totalTaxes/cifValue)*100).toFixed(1)}%
          - Vehicle Year: ${vinAnalysis.modelYear}
          - CAFTA Eligible: ${vinAnalysis.caftaEligible}
          - Regime: ${regime}
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
      riskAssessment: "Standard import process - verify all documentation",
      costOptimization: ["Ensure CAFTA eligibility documentation", "Consider timing for amnesty benefits"],
      complianceNotes: ["Verify left-hand drive requirement", "Ensure clean title documentation"]
    };
  }
}

/**
 * Fallback VIN analysis without AI
 */
function basicVINAnalysis(vin: string): VINAnalysisResult {
  if (!vin || vin.length !== 17) {
    return {
      vin,
      isValid: false,
      modelYear: null,
      manufacturer: 'Unknown',
      isUSAOrigin: false,
      caftaEligible: false,
      wmi: '',
      aiValidation: {
        confidence: 0,
        warnings: ['Invalid VIN format'],
        recommendations: ['Verify 17-character VIN']
      }
    };
  }

  const cleanVIN = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  const yearCode = cleanVIN.charAt(9);
  const wmi = cleanVIN.substring(0, 3);
  const firstChar = cleanVIN.charAt(0);
  
  // Basic year decoding
  const yearMap: Record<string, number> = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015, 
    'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021, 
    'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025,
    '1': 2001, '2': 2002, '3': 2003, '4': 2004, '5': 2005, '6': 2006, 
    '7': 2007, '8': 2008, '9': 2009, 'Y': 2000
  };
  
  const modelYear = yearMap[yearCode] || null;
  const isUSAOrigin = ['1', '4', '5'].includes(firstChar);
  
  return {
    vin,
    isValid: true,
    modelYear,
    manufacturer: 'Unknown',
    isUSAOrigin,
    caftaEligible: isUSAOrigin,
    wmi,
    aiValidation: {
      confidence: 0.7,
      warnings: [],
      recommendations: ['Consider AI validation for enhanced accuracy']
    }
  };
}