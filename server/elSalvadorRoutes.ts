/**
 * El Salvador Import Calculator API Routes
 * Complex age restrictions, salvage handling, and CAFTA-DR integration
 */

import { Express, Request, Response } from 'express';
import { analyzeVINWithAI } from './hondurasImportService';
import { calculateElSalvadorImport } from './elSalvadorImportService';
import { multiAIService } from './multiAIService';

export function setupElSalvadorRoutes(app: Express) {
  
  /**
   * El Salvador Import Calculation with Age & Salvage Handling
   */
  app.post('/api/elsalvador/calculate', async (req: Request, res: Response) => {
    try {
      const { 
        vehiclePrice, 
        freight = 0, 
        insurance = 0, 
        vin,
        engineSize = 2.0,
        is4x4 = false,
        hasSalvageTitle = false,
        isPersonalUse = true
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

      // First analyze the VIN
      const vinAnalysis = await analyzeVINWithAI(vin);
      
      if (!vinAnalysis.isValid) {
        return res.status(400).json({
          error: 'Invalid VIN format',
          details: vinAnalysis.aiValidation.warnings
        });
      }

      // Calculate El Salvador import duties with age restrictions
      const calculation = await calculateElSalvadorImport(
        parseFloat(vehiclePrice),
        parseFloat(freight),
        parseFloat(insurance),
        vinAnalysis,
        parseFloat(engineSize.toString()),
        Boolean(is4x4),
        Boolean(hasSalvageTitle),
        Boolean(isPersonalUse)
      );

      res.json({
        success: true,
        data: {
          vinAnalysis,
          calculation,
          timestamp: new Date().toISOString(),
          country: 'el_salvador',
          currency: 'USD'
        }
      });
      
    } catch (error) {
      console.error('El Salvador calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate import duties',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * El Salvador Age Eligibility Check
   */
  app.post('/api/elsalvador/check-eligibility', async (req: Request, res: Response) => {
    try {
      const { vin, vehicleType = 'passenger' } = req.body;
      
      if (!vin) {
        return res.status(400).json({
          error: 'VIN is required for age verification'
        });
      }

      const vinAnalysis = await analyzeVINWithAI(vin);
      
      if (!vinAnalysis.isValid || !vinAnalysis.modelYear) {
        return res.status(400).json({
          error: 'Unable to determine vehicle age from VIN'
        });
      }

      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - vinAnalysis.modelYear;
      
      const ageLimits = {
        passenger: 8,     // Cars, SUVs, pickups, motorcycles
        bus: 10,          // Heavy passenger vehicles
        heavy_truck: 15   // Trucks ≥3 tons
      };
      
      const maxAge = ageLimits[vehicleType as keyof typeof ageLimits] || 8;
      const isEligible = vehicleAge <= maxAge;
      
      res.json({
        success: true,
        data: {
          vin,
          modelYear: vinAnalysis.modelYear,
          vehicleAge,
          vehicleType,
          maxAllowedAge: maxAge,
          isEligible,
          reason: isEligible ? 
            `Vehicle is ${vehicleAge} years old (within ${maxAge}-year limit)` :
            `Vehicle is ${vehicleAge} years old (exceeds ${maxAge}-year limit)`,
          exemptions: isEligible ? [] : [
            'Antique/Collector vehicles (30+ years)',
            'Government/Charity donations',
            'Disabled use vehicles',
            'Specialized agricultural/off-road machinery'
          ]
        }
      });
      
    } catch (error) {
      console.error('Eligibility check error:', error);
      res.status(500).json({
        error: 'Failed to check eligibility',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * El Salvador Tax Structure Information
   */
  app.get('/api/elsalvador/tax-info', async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      
      res.json({
        success: true,
        data: {
          country: 'El Salvador',
          lastUpdated: '2025-06-10',
          ageRestrictions: {
            passenger_vehicles: {
              category: 'Cars, SUVs, pickups, motorcycles',
              maxAge: 8,
              currentCutoff: currentYear - 8,
              example: `For ${currentYear}, only ${currentYear - 8} and newer allowed`
            },
            buses: {
              category: 'Heavy passenger vehicles',
              maxAge: 10,
              currentCutoff: currentYear - 10
            },
            heavy_trucks: {
              category: 'Trucks ≥3 tons',
              maxAge: 15,
              currentCutoff: currentYear - 15
            }
          },
          taxStructure: {
            dai_import_duty: {
              passenger_cars: '25% (or 30% if engine >2.0L)',
              pickups: '5%',
              buses_trucks: '1%',
              cafta_eligible: '0% (duty-free)'
            },
            iva_vat: {
              rate: '13%',
              base: 'CIF + DAI'
            },
            first_registration: {
              passenger_up_to_2L: '4%',
              passenger_over_2L: '8%',
              passenger_4x4: '6%',
              pickups_commercial: '1%',
              motorcycles_small: '1% (≤250cc)',
              motorcycles_large: '8% (>250cc)'
            }
          },
          salvageDiscount: {
            eligible: 'Vehicles with salvage/damaged titles',
            discount: '40% reduction in customs value',
            requirement: 'Must present official salvage documentation'
          },
          cafta_dr: {
            eligibility: 'US manufactured vehicles',
            benefit: '0% import duty (DAI)',
            documentation: 'Certificate of origin required',
            vin_indicators: 'VIN starting with 1, 4, or 5 (USA)'
          },
          exemptions: {
            age_exemptions: [
              'Antique/collector vehicles (30+ years)',
              'Government donations',
              'Charity donations',
              'Disabled use vehicles',
              'Agricultural/off-road machinery'
            ],
            registration_exemptions: [
              'Repatriates (returning Salvadorans)',
              'Certain diplomatic vehicles'
            ]
          },
          compliance: {
            steering: 'Left-hand drive required',
            emissions: 'Certificate required (60 days before arrival)',
            inspection: 'Safety and emissions test required for registration',
            prohibited_titles: ['Junk', 'Certificate of Destruction', 'Parts Only']
          }
        }
      });
      
    } catch (error) {
      console.error('Tax info error:', error);
      res.status(500).json({
        error: 'Failed to retrieve tax information'
      });
    }
  });

  /**
   * El Salvador Import Cost Comparison (CAFTA vs Non-CAFTA)
   */
  app.post('/api/elsalvador/compare-costs', async (req: Request, res: Response) => {
    try {
      const { vehiclePrice, freight = 0, insurance = 0, engineSize = 2.0, hasSalvageTitle = false } = req.body;
      
      if (!vehiclePrice || vehiclePrice <= 0) {
        return res.status(400).json({
          error: 'Vehicle price is required'
        });
      }

      const cifValue = parseFloat(vehiclePrice) + parseFloat(freight.toString()) + parseFloat(insurance.toString());
      const adjustedValue = hasSalvageTitle ? cifValue * 0.6 : cifValue;
      
      // CAFTA scenario (0% DAI)
      const caftaDAI = 0;
      const caftaIVA = (adjustedValue + caftaDAI) * 0.13;
      const caftaFirstReg = (adjustedValue + caftaDAI) * (engineSize > 2.0 ? 0.08 : 0.04);
      const caftaTotal = caftaDAI + caftaIVA + caftaFirstReg;
      
      // Non-CAFTA scenario (25-30% DAI)
      const nonCaftaDAIRate = engineSize > 2.0 ? 0.30 : 0.25;
      const nonCaftaDAI = adjustedValue * nonCaftaDAIRate;
      const nonCaftaIVA = (adjustedValue + nonCaftaDAI) * 0.13;
      const nonCaftaFirstReg = (adjustedValue + nonCaftaDAI) * (engineSize > 2.0 ? 0.08 : 0.04);
      const nonCaftaTotal = nonCaftaDAI + nonCaftaIVA + nonCaftaFirstReg;
      
      const savings = nonCaftaTotal - caftaTotal;
      const savingsPercentage = ((savings / cifValue) * 100).toFixed(1);
      
      res.json({
        success: true,
        data: {
          vehicleInfo: {
            cifValue,
            adjustedValue,
            engineSize,
            hasSalvageDiscount: hasSalvageTitle
          },
          caftaScenario: {
            dai: caftaDAI,
            iva: caftaIVA,
            firstRegistration: caftaFirstReg,
            total: caftaTotal,
            totalCost: cifValue + caftaTotal
          },
          nonCaftaScenario: {
            dai: nonCaftaDAI,
            iva: nonCaftaIVA,
            firstRegistration: nonCaftaFirstReg,
            total: nonCaftaTotal,
            totalCost: cifValue + nonCaftaTotal
          },
          comparison: {
            savings,
            savingsPercentage: `${savingsPercentage}%`,
            recommendation: savings > 1000 ? 
              'Strong recommendation to verify CAFTA eligibility' :
              'Modest savings from CAFTA - verify if documentation effort is worthwhile'
          }
        }
      });
      
    } catch (error) {
      console.error('Cost comparison error:', error);
      res.status(500).json({
        error: 'Failed to compare costs'
      });
    }
  });
}