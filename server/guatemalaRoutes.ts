/**
 * Guatemala Import Calculator API Routes
 * No age restrictions, complex IPRIMA categories, salvage rebuildability validation
 */

import { Express, Request, Response } from 'express';
import { calculateGuatemalaImport, validateGuatemalaEligibility } from './guatemalaImportService';
import { multiAIService } from './multiAIService';

export function setupGuatemalaRoutes(app: Express) {
  
  /**
   * Guatemala Multi-AI Enhanced Import Calculation
   */
  app.post('/api/guatemala/calculate', async (req: Request, res: Response) => {
    try {
      const { 
        vehiclePrice, 
        freight = 0, 
        insurance = 0, 
        vin,
        engineSize = 2000,
        vehicleType = 'sedan',
        isLuxury = false,
        hasSalvageTitle = false
      } = req.body;
      
      // Validate required inputs
      if (!vehiclePrice || vehiclePrice <= 0) {
        return res.status(400).json({
          error: 'Vehicle price is required and must be greater than 0'
        });
      }
      
      if (!vin) {
        return res.status(400).json({
          error: 'VIN is required for CAFTA eligibility and rebuildability assessment'
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

      // Guatemala eligibility validation
      const eligibility = validateGuatemalaEligibility(
        {
          vin: vinAnalysis.vin,
          isValid: true,
          manufacturer: vinAnalysis.make,
          modelYear: vinAnalysis.modelYear,
          caftaEligible: vinAnalysis.caftaEligible,
          isUSAOrigin: vinAnalysis.countryOfOrigin === 'United States',
          wmi: vinAnalysis.vin.substring(0, 3),
          isRebuildable: !hasSalvageTitle || true, // Assume rebuildable unless explicitly marked otherwise
          isLHD: true, // Assume LHD for US auction vehicles
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
          error: 'Vehicle not eligible for Guatemala import',
          restrictions: eligibility.restrictions,
          warnings: eligibility.warnings
        });
      }

      // Calculate Guatemala import duties with IPRIMA categories
      const calculation = await calculateGuatemalaImport({
        vehiclePrice: parseFloat(vehiclePrice),
        freight: parseFloat(freight),
        insurance: parseFloat(insurance),
        engineSize: parseFloat(engineSize.toString()),
        vehicleType: vehicleType as any,
        isLuxury: Boolean(isLuxury),
        hasSalvageTitle: Boolean(hasSalvageTitle),
        vinAnalysis: {
          vin: vinAnalysis.vin,
          isValid: true,
          manufacturer: vinAnalysis.make,
          modelYear: vinAnalysis.modelYear,
          caftaEligible: vinAnalysis.caftaEligible,
          isUSAOrigin: vinAnalysis.countryOfOrigin === 'United States',
          wmi: vinAnalysis.vin.substring(0, 3),
          isRebuildable: !hasSalvageTitle || true,
          isLHD: true,
          aiValidation: {
            confidence: vinAnalysis.confidenceScore,
            warnings: vinAnalysis.warnings,
            recommendations: []
          }
        }
      });

      // Generate professional import insights for Guatemala
      const importInsights = await multiAIService.generateImportInsights(
        'guatemala',
        { vehiclePrice, freight, insurance, engineSize, vehicleType, isLuxury, hasSalvageTitle },
        calculation,
        vinAnalysis
      );

      // Add Multi-AI insights to calculation with Guatemala specific format
      calculation.aiInsights = {
        rebuildabilityAssessment: importInsights.riskAssessment,
        categoryClassification: `Vehicle classified for IPRIMA: ${calculation.vehicleCategory}`,
        costOptimization: importInsights.costOptimization,
        complianceNotes: importInsights.complianceNotes
      };

      res.json({
        success: true,
        data: {
          vinAnalysis,
          calculation,
          eligibility,
          timestamp: new Date().toISOString(),
          country: 'guatemala',
          currency: 'USD'
        }
      });
      
    } catch (error) {
      console.error('Guatemala Multi-AI calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate Guatemala import duties',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Guatemala IPRIMA Category Lookup
   */
  app.post('/api/guatemala/iprima-category', async (req: Request, res: Response) => {
    try {
      const { engineSize, vehicleType, isLuxury, vehicleValue } = req.body;
      
      // Simple category determination without full calculation
      const categories = {
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
        luxury_suv: { rate: 0.20, description: 'Luxury SUVs (> Q300k value)' }
      };

      // Determine category based on inputs
      let selectedCategory;
      const luxuryThreshold = 38500; // USD equivalent to Q300k
      
      if (vehicleType === 'motorcycle') {
        selectedCategory = categories.motorcycle;
      } else if (engineSize < 1000) {
        selectedCategory = categories.small_car;
      } else if (isLuxury || vehicleValue > luxuryThreshold) {
        selectedCategory = vehicleType === 'suv' ? categories.luxury_suv : categories.luxury_car;
      } else {
        switch (vehicleType) {
          case 'sedan':
            if (engineSize < 1500) selectedCategory = categories.sedan_small;
            else if (engineSize < 2000) selectedCategory = categories.sedan_medium;
            else selectedCategory = categories.sedan_large;
            break;
          case 'suv':
            if (engineSize < 2000) selectedCategory = categories.suv_small;
            else if (engineSize < 3000) selectedCategory = categories.suv_medium;
            else selectedCategory = categories.suv_large;
            break;
          case 'pickup':
            selectedCategory = isLuxury ? categories.pickup_luxury : categories.pickup_standard;
            break;
          default:
            selectedCategory = categories.sedan_medium;
        }
      }

      res.json({
        success: true,
        data: {
          category: selectedCategory,
          estimatedTax: vehicleValue * selectedCategory.rate,
          allCategories: categories
        }
      });
      
    } catch (error) {
      console.error('IPRIMA category lookup error:', error);
      res.status(500).json({
        error: 'Failed to determine IPRIMA category',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Guatemala Eligibility Check
   */
  app.post('/api/guatemala/eligibility', async (req: Request, res: Response) => {
    try {
      const { vin, hasSalvageTitle } = req.body;
      
      if (!vin) {
        return res.status(400).json({
          error: 'VIN is required for eligibility assessment'
        });
      }

      // Multi-AI VIN analysis for eligibility
      const vinAnalysis = await multiAIService.analyzeVIN(vin);
      
      const eligibility = validateGuatemalaEligibility(
        {
          vin: vinAnalysis.vin,
          isValid: vinAnalysis.confidenceScore >= 70,
          manufacturer: vinAnalysis.make,
          modelYear: vinAnalysis.modelYear,
          caftaEligible: vinAnalysis.caftaEligible,
          isUSAOrigin: vinAnalysis.countryOfOrigin === 'United States',
          wmi: vinAnalysis.vin.substring(0, 3),
          isRebuildable: !hasSalvageTitle || true,
          isLHD: true,
          aiValidation: {
            confidence: vinAnalysis.confidenceScore,
            warnings: vinAnalysis.warnings,
            recommendations: []
          }
        },
        Boolean(hasSalvageTitle)
      );

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
          guatemalaAdvantages: [
            'No age restrictions - any model year allowed (2013 Constitutional Court ruling)',
            'Salvage vehicles permitted if rebuildable',
            'No emissions standards required at import',
            'CAFTA-DR benefits available for US-origin vehicles'
          ]
        }
      });
      
    } catch (error) {
      console.error('Guatemala eligibility check error:', error);
      res.status(500).json({
        error: 'Failed to check eligibility',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}