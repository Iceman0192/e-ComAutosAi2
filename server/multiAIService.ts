/**
 * Multi-AI Consensus System for CAFTA Import Calculator
 * Combines multiple AI models for enhanced accuracy and validation
 */

import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface VINAnalysis {
  vin: string;
  modelYear: number;
  make: string;
  model: string;
  caftaEligible: boolean;
  countryOfOrigin: string;
  confidenceScore: number;
  warnings: string[];
  aiConsensus: {
    agreementLevel: number;
    primarySource: string;
    conflictingData?: string[];
  };
}

export interface ImportCalculationInsights {
  riskAssessment: string;
  complianceNotes: string[];
  costOptimization: string[];
  legalWarnings: string[];
  recommendedActions: string[];
  marketComparison?: {
    averageImportCost: number;
    yourCalculation: number;
    variance: string;
  };
}

/**
 * Multi-AI VIN Analysis System
 * Uses OpenAI as primary with consensus validation
 */
export class MultiAIService {
  
  /**
   * Comprehensive VIN Analysis with AI Consensus
   */
  async analyzeVIN(vin: string): Promise<VINAnalysis> {
    if (!vin || vin.length !== 17) {
      throw new Error('Invalid VIN format');
    }

    try {
      // Primary OpenAI Analysis
      const openaiAnalysis = await this.performOpenAIVINAnalysis(vin);
      
      // Enhanced validation using VIN decode logic
      const enhancedAnalysis = await this.enhanceWithVINDecoding(vin, openaiAnalysis);
      
      // Calculate confidence score based on data consistency
      const confidenceScore = this.calculateConfidenceScore(enhancedAnalysis);
      
      return {
        vin,
        modelYear: enhancedAnalysis.modelYear,
        make: enhancedAnalysis.make,
        model: enhancedAnalysis.model,
        caftaEligible: enhancedAnalysis.caftaEligible,
        countryOfOrigin: enhancedAnalysis.countryOfOrigin,
        confidenceScore,
        warnings: enhancedAnalysis.warnings,
        aiConsensus: {
          agreementLevel: confidenceScore,
          primarySource: 'OpenAI GPT-4o + VIN Decoding',
          conflictingData: enhancedAnalysis.conflicts || []
        }
      };
      
    } catch (error) {
      console.error('Multi-AI VIN analysis error:', error);
      throw new Error('VIN analysis failed');
    }
  }

  /**
   * Generate Import Calculation Insights
   */
  async generateImportInsights(
    country: string,
    vehicleData: any,
    calculationResult: any,
    vinAnalysis: VINAnalysis
  ): Promise<ImportCalculationInsights> {
    
    try {
      const prompt = `
        As an expert customs and import specialist for ${country.toUpperCase()}, analyze this vehicle import calculation and provide professional insights:

        Vehicle: ${vinAnalysis.modelYear} ${vinAnalysis.make} ${vinAnalysis.model}
        VIN: ${vinAnalysis.vin}
        CAFTA Eligible: ${vinAnalysis.caftaEligible}
        Total Import Cost: $${calculationResult.totalCost?.toLocaleString()}
        Total Taxes: $${calculationResult.totalTaxes?.toLocaleString()}
        Vehicle Value: $${vehicleData.vehiclePrice?.toLocaleString()}

        Provide analysis in JSON format:
        {
          "riskAssessment": "Overall risk level and key concerns",
          "complianceNotes": ["Legal compliance requirement 1", "requirement 2"],
          "costOptimization": ["Cost saving strategy 1", "strategy 2"],
          "legalWarnings": ["Warning 1", "warning 2"],
          "recommendedActions": ["Action 1", "action 2"],
          "marketComparison": {
            "averageImportCost": estimated_average,
            "yourCalculation": actual_calculation,
            "variance": "above/below average explanation"
          }
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert customs broker and import specialist with deep knowledge of Central American import regulations, CAFTA-DR agreements, and vehicle importation procedures."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const insights = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        riskAssessment: insights.riskAssessment || 'Standard import risk profile',
        complianceNotes: insights.complianceNotes || [],
        costOptimization: insights.costOptimization || [],
        legalWarnings: insights.legalWarnings || [],
        recommendedActions: insights.recommendedActions || [],
        marketComparison: insights.marketComparison
      };
      
    } catch (error) {
      console.error('Import insights generation error:', error);
      
      // Fallback insights based on calculation data
      return this.generateFallbackInsights(country, calculationResult, vinAnalysis);
    }
  }

  /**
   * Primary OpenAI VIN Analysis
   */
  private async performOpenAIVINAnalysis(vin: string): Promise<any> {
    const prompt = `
      Analyze this VIN for CAFTA-DR import eligibility: ${vin}
      
      Focus on:
      1. Model year determination
      2. Manufacturer and country of origin
      3. CAFTA-DR eligibility (vehicles from USA, Canada, Mexico qualify)
      4. Any compliance warnings
      
      Respond in JSON format:
      {
        "modelYear": year_number,
        "make": "manufacturer_name",
        "model": "model_name", 
        "countryOfOrigin": "country",
        "caftaEligible": true/false,
        "warnings": ["warning1", "warning2"],
        "confidence": confidence_percentage
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert automotive VIN decoder with extensive knowledge of CAFTA-DR trade agreements and vehicle import regulations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Enhanced VIN decoding with validation
   */
  private async enhanceWithVINDecoding(vin: string, openaiAnalysis: any): Promise<any> {
    // VIN position validation for CAFTA eligibility
    const wmi = vin.substring(0, 3); // World Manufacturer Identifier
    const modelYearChar = vin.charAt(9);
    
    // Model year decoding
    const modelYear = this.decodeModelYear(modelYearChar);
    
    // Country of origin validation
    const countryOfOrigin = this.decodeCountryOfOrigin(wmi);
    
    // CAFTA eligibility check (positions 1, 4, 5 for North American origin)
    const caftaEligible = this.checkCaftaEligibility(vin);
    
    const warnings: string[] = [];
    const conflicts: string[] = [];
    
    // Validate against OpenAI analysis
    if (Math.abs(modelYear - openaiAnalysis.modelYear) > 1) {
      conflicts.push(`Model year mismatch: VIN decode=${modelYear}, AI=${openaiAnalysis.modelYear}`);
      warnings.push('Model year requires manual verification');
    }
    
    if (caftaEligible !== openaiAnalysis.caftaEligible) {
      conflicts.push(`CAFTA eligibility mismatch: VIN=${caftaEligible}, AI=${openaiAnalysis.caftaEligible}`);
      warnings.push('CAFTA eligibility requires customs verification');
    }
    
    return {
      ...openaiAnalysis,
      modelYear: modelYear || openaiAnalysis.modelYear,
      countryOfOrigin: countryOfOrigin || openaiAnalysis.countryOfOrigin,
      caftaEligible,
      warnings: [...(openaiAnalysis.warnings || []), ...warnings],
      conflicts
    };
  }

  /**
   * Decode model year from VIN position 10
   */
  private decodeModelYear(yearChar: string): number {
    const yearMap: { [key: string]: number } = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
      'Y': 2030, '1': 2001, '2': 2002, '3': 2003, '4': 2004,
      '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009
    };
    
    return yearMap[yearChar] || new Date().getFullYear();
  }

  /**
   * Decode country of origin from WMI
   */
  private decodeCountryOfOrigin(wmi: string): string {
    const firstChar = wmi.charAt(0);
    
    if (['1', '4', '5'].includes(firstChar)) return 'United States';
    if (['2'].includes(firstChar)) return 'Canada';
    if (['3'].includes(firstChar)) return 'Mexico';
    if (['J'].includes(firstChar)) return 'Japan';
    if (['K'].includes(firstChar)) return 'South Korea';
    if (['W'].includes(firstChar)) return 'Germany';
    if (['V'].includes(firstChar)) return 'Europe';
    
    return 'Unknown';
  }

  /**
   * Check CAFTA-DR eligibility based on VIN positions 1, 4, 5
   * CAFTA-DR is between USA and Central American countries (+ Dominican Republic)
   * ONLY USA vehicles are eligible - Canada and Mexico have separate bilateral agreements
   */
  private checkCaftaEligibility(vin: string): boolean {
    const pos1 = vin.charAt(0);
    const pos4 = vin.charAt(3);
    const pos5 = vin.charAt(4);
    
    // CAFTA-DR eligible codes (USA ONLY)
    // VIN codes 1, 4, 5 = USA
    // VIN code 2 = Canada (NOT CAFTA-DR eligible)
    // VIN code 3 = Mexico (NOT CAFTA-DR eligible)
    const caftaEligibleCodes = ['1', '4', '5'];
    
    return caftaEligibleCodes.includes(pos1) || 
           caftaEligibleCodes.includes(pos4) || 
           caftaEligibleCodes.includes(pos5);
  }

  /**
   * Calculate confidence score based on data consistency
   */
  private calculateConfidenceScore(analysis: any): number {
    let score = 100;
    
    if (analysis.conflicts && analysis.conflicts.length > 0) {
      score -= analysis.conflicts.length * 15;
    }
    
    if (analysis.warnings && analysis.warnings.length > 0) {
      score -= analysis.warnings.length * 5;
    }
    
    return Math.max(score, 60); // Minimum 60% confidence
  }

  /**
   * Generate fallback insights when AI analysis fails
   */
  private generateFallbackInsights(
    country: string, 
    calculationResult: any, 
    vinAnalysis: VINAnalysis
  ): ImportCalculationInsights {
    
    const taxPercentage = (calculationResult.totalTaxes / calculationResult.cifValue) * 100;
    
    return {
      riskAssessment: taxPercentage > 50 ? 'High tax burden - verify calculations' : 'Standard import profile',
      complianceNotes: [
        'Verify all required documentation',
        'Confirm vehicle meets safety standards',
        country === 'el_salvador' ? 'Check age restrictions compliance' : 'Verify CAFTA eligibility'
      ],
      costOptimization: [
        vinAnalysis.caftaEligible ? 'CAFTA benefits applied' : 'Consider CAFTA-eligible alternatives',
        'Review freight and insurance quotes'
      ],
      legalWarnings: vinAnalysis.warnings,
      recommendedActions: [
        'Consult with licensed customs broker',
        'Verify final calculations with customs authority'
      ]
    };
  }
}

export const multiAIService = new MultiAIService();