/**
 * Honduras Import Calculator API Routes
 * AI-Enhanced professional import duty calculations
 */

import { Express, Request, Response } from 'express';
import { analyzeVINWithAI, calculateHondurasImport } from './hondurasImportService';
import { multiAIService } from './multiAIService';

export function setupHondurasRoutes(app: Express) {
  
  /**
   * AI-Enhanced VIN Analysis Endpoint
   */
  app.post('/api/honduras/analyze-vin', async (req: Request, res: Response) => {
    try {
      const { vin } = req.body;
      
      if (!vin || typeof vin !== 'string') {
        return res.status(400).json({
          error: 'VIN is required and must be a string'
        });
      }

      const analysis = await analyzeVINWithAI(vin);
      
      res.json({
        success: true,
        data: analysis
      });
      
    } catch (error) {
      console.error('VIN analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze VIN',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Complete Honduras Import Calculation Endpoint
   */
  app.post('/api/honduras/calculate', async (req: Request, res: Response) => {
    try {
      const { 
        vehiclePrice, 
        freight = 0, 
        insurance = 0, 
        vin 
      } = req.body;
      
      // Validate inputs
      if (!vehiclePrice || vehiclePrice <= 0) {
        return res.status(400).json({
          error: 'Vehicle price is required and must be greater than 0'
        });
      }
      
      if (!vin) {
        return res.status(400).json({
          error: 'VIN is required for accurate calculation'
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

      // Calculate import duties with enhanced data
      const calculation = await calculateHondurasImport(
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
          aiValidation: {
            confidence: vinAnalysis.confidenceScore,
            warnings: vinAnalysis.warnings,
            recommendations: []
          }
        }
      );

      // Generate professional import insights
      const importInsights = await multiAIService.generateImportInsights(
        'honduras',
        { vehiclePrice, freight, insurance },
        calculation,
        vinAnalysis
      );

      // Add Multi-AI insights to calculation
      calculation.aiInsights = importInsights;

      res.json({
        success: true,
        data: {
          vinAnalysis,
          calculation,
          timestamp: new Date().toISOString(),
          country: 'honduras',
          currency: 'USD'
        }
      });
      
    } catch (error) {
      console.error('Honduras calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate import duties',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Honduras Tax Rates Information Endpoint
   */
  app.get('/api/honduras/tax-info', async (req: Request, res: Response) => {
    try {
      const currentDate = new Date();
      const amnestyExpiry = new Date('2026-04-04');
      const amnestyActive = currentDate <= amnestyExpiry;
      
      res.json({
        success: true,
        data: {
          country: 'Honduras',
          lastUpdated: '2025-06-10',
          regimes: {
            standard: {
              name: 'Standard Regime',
              applicable: '2006+ vehicles',
              dai_rates: {
                cafta_eligible: '0%',
                non_cafta: 'Up to 15%'
              },
              isc_brackets: [
                { range: '$0 - $7,000', rate: '10%' },
                { range: '$7,001 - $10,000', rate: '15%' },
                { range: '$10,001 - $20,000', rate: '20%' },
                { range: '$20,001 - $50,000', rate: '30%' },
                { range: '$50,001 - $100,000', rate: '45%' },
                { range: '$100,000+', rate: '60%' }
              ],
              isv_rate: '15%',
              ecotasa: [
                { range: '$0 - $15,000', fee: 'L 5,000 (~$200)' },
                { range: '$15,001 - $25,000', fee: 'L 7,000 (~$280)' },
                { range: '$25,000+', fee: 'L 10,000 (~$400)' }
              ]
            },
            amnesty: {
              name: 'Amnesty Regime',
              applicable: '≤2005 vehicles',
              expires: '2026-04-04',
              active: amnestyActive,
              dai_rates: {
                cafta_eligible: '0%',
                non_cafta: 'Up to 15%'
              },
              flat_fee: 'L 10,000 (~$400) replaces ISC + ISV + Registration',
              ecotasa: 'Same as standard regime'
            }
          },
          requirements: {
            steering: 'Left-hand drive only',
            age_restrictions: 'Suspended per Decreto 14-2023',
            prohibited_titles: [
              'Junk', 'Parts Only', 'Non-Repairable', 
              'Certificate of Destruction', 'Scrap Only'
            ]
          },
          cafta_dr: {
            eligibility: 'US manufactured vehicles (VIN starting with 1, 4, or 5)',
            benefit: '0% import duty',
            documentation: 'Certificate of origin required'
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
   * Honduras Import Timeline Endpoint
   */
  app.post('/api/honduras/timeline', async (req: Request, res: Response) => {
    try {
      const { vinAnalysis, hasDocuments = false } = req.body;
      
      const timeline = [
        {
          step: 1,
          title: 'Documentation Preparation',
          duration: hasDocuments ? '1-2 days' : '5-7 days',
          description: 'Gather title, bill of sale, certificate of origin (if CAFTA)',
          status: hasDocuments ? 'ready' : 'pending'
        },
        {
          step: 2,
          title: 'Customs Declaration',
          duration: '1-2 days',
          description: 'Submit import declaration with vehicle specifications',
          status: 'pending'
        },
        {
          step: 3,
          title: 'Tax Assessment',
          duration: '2-3 days',
          description: `${vinAnalysis?.regime === 'amnesty' ? 'Amnesty' : 'Standard'} regime tax calculation`,
          status: 'pending'
        },
        {
          step: 4,
          title: 'Payment Processing',
          duration: '1 day',
          description: 'Pay calculated duties and fees',
          status: 'pending'
        },
        {
          step: 5,
          title: 'Vehicle Inspection',
          duration: '1-2 days',
          description: 'Physical inspection for compliance verification',
          status: 'pending'
        },
        {
          step: 6,
          title: 'Registration',
          duration: '2-3 days',
          description: 'Vehicle registration and license plate issuance',
          status: 'pending'
        }
      ];
      
      const totalDays = timeline.reduce((total, step) => {
        const days = parseInt(step.duration.split('-')[1] || step.duration.split(' ')[0]);
        return total + days;
      }, 0);
      
      res.json({
        success: true,
        data: {
          timeline,
          estimatedDays: `${Math.max(7, totalDays - 3)}-${totalDays}`,
          regime: vinAnalysis?.regime || 'standard',
          expedited: hasDocuments
        }
      });
      
    } catch (error) {
      console.error('Timeline error:', error);
      res.status(500).json({
        error: 'Failed to generate import timeline'
      });
    }
  });
}