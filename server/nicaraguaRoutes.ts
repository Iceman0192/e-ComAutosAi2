/**
 * Nicaragua Import Calculator API Routes
 * 10-year age limit, engine-based ISC, and CAFTA-DR integration
 */

import { Express, Request, Response } from 'express';
import { calculateNicaraguaImport, validateNicaraguaEligibility, analyzeVINForNicaragua } from './nicaraguaImportService';
import { multiAIService } from './multiAIService';

export function setupNicaraguaRoutes(app: Express) {
  
  /**
   * Nicaragua Import Calculation with Age & Engine Size Validation
   */
  app.post('/api/nicaragua/calculate', async (req: Request, res: Response) => {
    try {
      const { 
        vehiclePrice, 
        freight = 0, 
        insurance = 0, 
        vin,
        engineSize = 2.0,
        hasSalvageTitle = false
      } = req.body;
      
      // Validate inputs
      if (!vehiclePrice || vehiclePrice <= 0) {
        return res.status(400).json({
          error: 'Vehicle price is required and must be greater than 0'
        });
      }
      
      if (!vin) {
        return res.status(400).json({
          error: 'VIN is required for age verification and CAFTA eligibility'
        });
      }

      // Multi-AI VIN analysis with consensus validation
      const vinAnalysis = await multiAIService.analyzeVIN(vin);
      
      if (vinAnalysis.confidenceScore < 70) {
        return res.status(400).json({
          error: 'VIN analysis confidence too low for reliable calculation',
          details: vinAnalysis.warnings,
          confidenceScore: vinAnalysis.confidenceScore
        });
      }

      // Nicaragua eligibility validation
      const eligibility = validateNicaraguaEligibility(
        {
          vin: vinAnalysis.vin,
          isValid: true,
          manufacturer: vinAnalysis.make,
          modelYear: vinAnalysis.modelYear,
          caftaEligible: vinAnalysis.caftaEligible,
          isUSAOrigin: vinAnalysis.countryOfOrigin === 'United States',
          wmi: vinAnalysis.vin.substring(0, 3),
          engineSize: parseFloat(engineSize.toString()),
          isLHD: true, // Assume LHD for US auction vehicles
          ageCompliant: true, // Will be validated in calculation
          aiValidation: {
            confidence: vinAnalysis.confidenceScore,
            warnings: vinAnalysis.warnings,
            recommendations: []
          }
        },
        Boolean(hasSalvageTitle)
      );

      if (!eligibility.eligible) {
        return res.status(400).json({
          error: 'Vehicle not eligible for Nicaragua import',
          restrictions: eligibility.restrictions,
          warnings: eligibility.warnings
        });
      }

      // Calculate import duties with enhanced data
      const calculation = await calculateNicaraguaImport(
        parseFloat(vehiclePrice),
        parseFloat(freight),
        parseFloat(insurance),
        {
          vin: vinAnalysis.vin,
          isValid: true,
          manufacturer: vinAnalysis.make,
          modelYear: vinAnalysis.modelYear,
          caftaEligible: vinAnalysis.caftaEligible,
          isUSAOrigin: vinAnalysis.countryOfOrigin === 'United States',
          wmi: vinAnalysis.vin.substring(0, 3),
          engineSize: parseFloat(engineSize.toString()),
          isLHD: true,
          ageCompliant: true,
          aiValidation: {
            confidence: vinAnalysis.confidenceScore,
            warnings: vinAnalysis.warnings,
            recommendations: []
          }
        }
      );

      // Generate professional import insights
      const importInsights = await multiAIService.generateImportInsights(
        'nicaragua',
        { vehiclePrice, freight, insurance },
        calculation,
        vinAnalysis
      );

      // Add Multi-AI insights to calculation
      calculation.aiInsights = importInsights;

      // Enhanced response with comprehensive data
      res.json({
        success: true,
        country: 'Nicaragua',
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
          ageLimitYears: 10,
          engineBasedISC: true,
          caftaAvailable: true,
          calculatedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Nicaragua calculation error:', error);
      res.status(500).json({
        error: error.message || 'Failed to calculate Nicaragua import duties',
        details: error.stack
      });
    }
  });

  /**
   * Nicaragua VIN Analysis Endpoint
   */
  app.post('/api/nicaragua/analyze-vin', async (req: Request, res: Response) => {
    try {
      const { vin } = req.body;
      
      if (!vin) {
        return res.status(400).json({
          error: 'VIN is required for analysis'
        });
      }

      // Multi-AI VIN analysis
      const vinAnalysis = await multiAIService.analyzeVIN(vin);
      
      // Nicaragua-specific validation
      const nicaraguaAnalysis = await analyzeVINForNicaragua(vin);
      
      // Age limit validation
      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - (vinAnalysis.modelYear || currentYear);
      const ageCompliant = vehicleAge <= 10;
      
      res.json({
        success: true,
        analysis: {
          vin: vinAnalysis.vin,
          modelYear: vinAnalysis.modelYear,
          vehicleAge,
          ageCompliant,
          ageLimitYears: 10,
          make: vinAnalysis.make,
          countryOfOrigin: vinAnalysis.countryOfOrigin,
          caftaEligible: vinAnalysis.caftaEligible,
          engineSize: nicaraguaAnalysis.engineSize,
          confidenceScore: vinAnalysis.confidenceScore,
          warnings: [
            ...vinAnalysis.warnings,
            ...(ageCompliant ? [] : [`Vehicle is ${vehicleAge} years old - exceeds Nicaragua's 10-year import limit`])
          ]
        },
        eligibility: ageCompliant ? 'eligible' : 'restricted',
        restrictions: ageCompliant ? [] : [
          'Vehicle exceeds 10-year age limit',
          'Exceptions may apply for donations, classic cars, or returning residents'
        ]
      });

    } catch (error: any) {
      console.error('Nicaragua VIN analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze VIN for Nicaragua import',
        details: error.message
      });
    }
  });

  /**
   * Nicaragua Tax Information Endpoint
   */
  app.get('/api/nicaragua/tax-info', (req: Request, res: Response) => {
    res.json({
      country: 'Nicaragua',
      taxStructure: {
        importDuty: {
          standard: '10%',
          caftaEligible: '0%',
          description: 'Basic customs tariff (DAI)'
        },
        selectiveConsumptionTax: {
          brackets: [
            { engineSize: '≤1600cc', rate: '10%' },
            { engineSize: '1601-2600cc', rate: '15%' },
            { engineSize: '2601-3000cc', rate: '20%' },
            { engineSize: '3001-4000cc', rate: '30%' },
            { engineSize: '>4000cc', rate: '35%' }
          ],
          description: 'Engine displacement-based excise tax (ISC)'
        },
        valueAddedTax: {
          rate: '15%',
          description: 'Applied on CIF + DAI + ISC (IVA)'
        },
        otherFees: {
          registration: '$50-$100',
          annualRoadTax: '~$3',
          description: 'Police registration, plates, and annual circulation fee'
        }
      },
      restrictions: {
        ageLimit: '10 years from manufacture date',
        steeringRequirement: 'Left-hand drive (LHD) only',
        titleStatus: 'Clean, salvage (repairable), or rebuilt titles allowed',
        prohibitedTitles: 'Junk, scrap, or certificate of destruction'
      },
      caftaEligibility: {
        eligibleOrigins: ['United States (VIN 1, 4, 5)'],
        notEligible: ['Canada (VIN 2)', 'Mexico (VIN 3)', 'Other countries'],
        benefit: 'Waives 10% import duty'
      },
      exceptions: {
        donations: 'Any age for approved NGOs, fire departments, Red Cross',
        classicCars: 'Antique/historical vehicles over 10 years as collector items',
        returningResidents: 'Citizens repatriating after 1+ year abroad (7-year limit for tax incentives)'
      }
    });
  });
}