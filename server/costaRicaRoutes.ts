/**
 * Costa Rica Import Calculator API Routes
 * Age-based tax brackets, EV incentives, and new resident exemptions
 */

import { Express, Request, Response } from 'express';
import { multiAIService } from './multiAIService';

export function setupCostaRicaRoutes(app: Express) {
  
  /**
   * Costa Rica Import Calculation with Age-Based Tax Brackets
   */
  app.post('/api/costa-rica/calculate', async (req: Request, res: Response) => {
    try {
      const { 
        vehiclePrice, 
        freight = 0, 
        insurance = 0, 
        vin,
        vehicleAge,
        isElectric = false,
        isNewResident = false,
        exemptionUsed = false
      } = req.body;
      
      // Validate inputs
      if (!vehiclePrice || vehiclePrice <= 0) {
        return res.status(400).json({
          error: 'Vehicle price is required and must be greater than 0'
        });
      }

      if (!vehicleAge || vehicleAge < 0) {
        return res.status(400).json({
          error: 'Vehicle age is required for Costa Rica tax calculation'
        });
      }
      
      // VIN Analysis for CAFTA eligibility
      const vinAnalysis = vin ? await multiAIService.analyzeVIN(vin) : {
        vin: vin || '',
        modelYear: new Date().getFullYear() - vehicleAge,
        make: 'Unknown',
        model: 'Unknown',
        caftaEligible: false,
        countryOfOrigin: 'Unknown',
        confidenceScore: 0.5,
        warnings: [],
        aiConsensus: {
          agreementLevel: 0.5,
          primarySource: 'fallback',
          conflictingData: []
        }
      };

      // Calculate CIF value
      const cifValue = vehiclePrice + freight + insurance;
      
      // Costa Rica Import Calculation
      const calculation = calculateCostaRicaImport(cifValue, vehicleAge, isElectric, isNewResident, exemptionUsed);
      
      // Eligibility check
      const eligibility = validateCostaRicaEligibility(vinAnalysis, isElectric);
      
      // Generate AI insights for Costa Rica import
      const importInsights = await multiAIService.generateImportInsights(
        'costa_rica',
        { vehiclePrice, freight, insurance },
        calculation,
        vinAnalysis
      );

      // Add Multi-AI insights to calculation with required structure
      (calculation as any).aiInsights = {
        importFeasibility: importInsights.riskAssessment,
        costOptimization: importInsights.costOptimization,
        complianceNotes: importInsights.complianceNotes
      };

      // Enhanced response with comprehensive data
      res.json({
        success: true,
        country: 'Costa Rica',
        calculation,
        eligibility,
        vinAnalysis: {
          vin: vinAnalysis.vin,
          modelYear: vinAnalysis.modelYear,
          make: vinAnalysis.make,
          countryOfOrigin: vinAnalysis.countryOfOrigin,
          caftaEligible: vinAnalysis.caftaEligible,
          confidenceScore: vinAnalysis.confidenceScore,
          warnings: vinAnalysis.warnings
        },
        systemInfo: {
          taxSystem: 'Age-based brackets with high duties',
          specialPrograms: [
            'New Resident Tax Exemption (Law 9996)',
            'Electric Vehicle Incentives (Law 9518)',
            'Full exemption for first 2 vehicles for new residents'
          ],
          requirements: [
            'Left-hand drive only (RHD prohibited)',
            'Clean title required (no salvage)',
            'DEKRA technical inspection mandatory',
            'Annual Marchamo tax and inspection required'
          ]
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Costa Rica Multi-AI calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate Costa Rica import duties',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Costa Rica Eligibility Check
   */
  app.post('/api/costa-rica/eligibility', async (req: Request, res: Response) => {
    try {
      const { vin, hasSalvageTitle = false } = req.body;
      
      if (!vin) {
        return res.status(400).json({
          error: 'VIN is required for eligibility assessment'
        });
      }

      const vinAnalysis = await multiAIService.analyzeVIN(vin);
      const eligibility = validateCostaRicaEligibility(vinAnalysis, false);

      res.json({
        success: true,
        data: {
          eligible: eligibility.eligible,
          warnings: eligibility.warnings,
          restrictions: eligibility.restrictions,
          vinAnalysis: {
            modelYear: vinAnalysis.modelYear,
            make: vinAnalysis.make,
            caftaEligible: vinAnalysis.caftaEligible,
            confidenceScore: vinAnalysis.confidenceScore
          },
          costaRicaAdvantages: [
            'No maximum age limit on vehicles',
            'EV incentives - 100% duty exemption up to $30,000',
            'New resident exemption for first 2 vehicles',
            'Well-established import process with customs brokers'
          ]
        }
      });
      
    } catch (error) {
      console.error('Costa Rica eligibility check error:', error);
      res.status(500).json({
        error: 'Failed to check eligibility',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Calculate Costa Rica import duties based on official 2025 rates
 */
function calculateCostaRicaImport(
  cifValue: number, 
  vehicleAge: number, 
  isElectric: boolean,
  isNewResident: boolean,
  exemptionUsed: boolean
): any {
  let totalTaxes = 0;
  let importDuty = 0;
  let evExemption = 0;
  let residentExemption = 0;
  
  // Age-based tax rates (combined import duty + consumption tax + VAT)
  let effectiveTaxRate = 0;
  if (vehicleAge <= 3) {
    effectiveTaxRate = 0.5229; // 52.29% for vehicles under 3 years
  } else if (vehicleAge <= 5) {
    effectiveTaxRate = 0.6391; // 63.91% for vehicles 4-5 years
  } else {
    effectiveTaxRate = 0.7903; // 79.03% for vehicles 6+ years
  }
  
  // Calculate base import duty
  importDuty = cifValue * effectiveTaxRate;
  
  // Electric Vehicle Exemption (Law 9518)
  if (isElectric) {
    const exemptionLimit = 30000; // $30,000 USD
    if (cifValue <= exemptionLimit) {
      evExemption = importDuty; // 100% exemption
      importDuty = 0;
    } else {
      // Partial exemption for vehicles over $30k
      const exemptAmount = exemptionLimit * effectiveTaxRate;
      evExemption = exemptAmount;
      importDuty = (cifValue - exemptionLimit) * effectiveTaxRate;
    }
  }
  
  // New Resident Exemption (Law 9996) - 100% exemption for first 2 vehicles
  if (isNewResident && !exemptionUsed) {
    residentExemption = importDuty;
    importDuty = 0;
  }
  
  totalTaxes = importDuty;
  
  // Additional fees (estimated)
  const customsBrokerFee = cifValue * 0.02; // ~2% for customs broker
  const portFees = 250; // Estimated port handling fees
  const inspectionFee = 150; // DEKRA inspection fee
  const registrationFee = cifValue * 0.025; // 2.5% transfer tax
  
  const otherFees = customsBrokerFee + portFees + inspectionFee + registrationFee;
  
  // Calculate annual Marchamo (varies by vehicle value)
  let marchamo = 0;
  if (cifValue < 5000) {
    marchamo = 100;
  } else if (cifValue < 15000) {
    marchamo = 300;
  } else if (cifValue < 30000) {
    marchamo = 600;
  } else {
    marchamo = 1000;
  }
  
  const totalCost = cifValue + totalTaxes + otherFees;
  const caftaSavings = 0; // Costa Rica doesn't have CAFTA benefits for vehicles
  
  return {
    cifValue,
    vehicleAge,
    effectiveTaxRate: (effectiveTaxRate * 100).toFixed(2),
    taxes: {
      importDuty: Math.round(importDuty),
      evExemption: Math.round(evExemption),
      residentExemption: Math.round(residentExemption)
    },
    fees: {
      customsBroker: Math.round(customsBrokerFee),
      port: portFees,
      inspection: inspectionFee,
      registration: Math.round(registrationFee)
    },
    annualCosts: {
      marchamo: marchamo,
      inspection: 50 // Annual inspection fee
    },
    totalTaxes: Math.round(totalTaxes),
    totalFees: Math.round(otherFees),
    totalCost: Math.round(totalCost),
    caftaSavings,
    isElectric,
    isNewResident,
    breakdown: [
      { item: 'Vehicle Price', amount: cifValue },
      { item: 'CIF Value', amount: cifValue },
      { item: `Import Duty (${(effectiveTaxRate * 100).toFixed(1)}%)`, amount: Math.round(importDuty) },
      ...(evExemption > 0 ? [{ item: 'EV Tax Exemption', amount: -Math.round(evExemption) }] : []),
      ...(residentExemption > 0 ? [{ item: 'New Resident Exemption', amount: -Math.round(residentExemption) }] : []),
      { item: 'Customs Broker Fee', amount: Math.round(customsBrokerFee) },
      { item: 'Port & Handling', amount: portFees },
      { item: 'DEKRA Inspection', amount: inspectionFee },
      { item: 'Registration Fee', amount: Math.round(registrationFee) },
      { item: 'TOTAL COST', amount: Math.round(totalCost) }
    ]
  };
}

/**
 * Validate vehicle eligibility for Costa Rica import
 */
function validateCostaRicaEligibility(vinAnalysis: any, isElectric: boolean) {
  const warnings: string[] = [];
  const restrictions: string[] = [];
  let eligible = true;
  
  // Check for right-hand drive (prohibited)
  if (vinAnalysis.countryOfOrigin === 'Japan' || vinAnalysis.countryOfOrigin === 'United Kingdom') {
    warnings.push('Verify left-hand drive - RHD vehicles are prohibited in Costa Rica');
  }
  
  // Age-based warnings
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vinAnalysis.modelYear;
  
  if (vehicleAge > 10) {
    warnings.push(`Vehicle is ${vehicleAge} years old - expect very high import taxes (79.03% of value)`);
  } else if (vehicleAge > 5) {
    warnings.push(`Vehicle is ${vehicleAge} years old - expect high import taxes (79.03% of value)`);
  } else if (vehicleAge > 3) {
    warnings.push(`Vehicle is ${vehicleAge} years old - expect moderate import taxes (63.91% of value)`);
  }
  
  // Salvage title restrictions
  restrictions.push('Salvage titles are prohibited - vehicle must have clean title');
  restrictions.push('Must pass DEKRA technical inspection upon arrival');
  restrictions.push('Left-hand drive only - RHD vehicles cannot be imported');
  
  // EV benefits
  if (isElectric) {
    warnings.push('Electric vehicle - eligible for 100% duty exemption up to $30,000 value');
  }
  
  return {
    eligible,
    warnings,
    restrictions,
    requirements: [
      'Clean title (no salvage/rebuilt)',
      'Left-hand drive configuration',
      'Original title and bill of sale',
      'Vehicle must be roadworthy for inspection'
    ],
    incentives: [
      'EV exemption: 100% duty-free up to $30,000',
      'New resident exemption: 2 vehicles duty-free',
      'No maximum age limit (unlike other CA countries)'
    ]
  };
}