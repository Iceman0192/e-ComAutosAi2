/**
 * Dominican Republic Import Calculator API Routes
 * Based on comprehensive research from OpenAI ChatGPT and Claude 4.0 Sonnet
 * 
 * Key Features:
 * - 5-year age limit for passenger vehicles (Law 04-07)
 * - CAFTA duty-free benefits for US vehicles
 * - CO2-based environmental taxes (ISC)
 * - 17% first-plate registration tax
 * - Clean title requirement (no salvage)
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from './middleware/auth';

export function setupDominicanRepublicRoutes(app: any) {
  /**
   * Dominican Republic Import Calculation
   */
  app.post('/api/dominican-republic/calculate', requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        vehiclePrice,
        freight,
        insurance,
        vinNumber,
        vehicleAge,
        engineSize,
        isUSOrigin = false,
        hasCaftaCertificate = false,
        isElectricHybrid = false,
        hasDisability = false,
        co2Emissions = 150, // g/km default
        vehicleType = 'passenger'
      } = req.body;

      if (!vehiclePrice || vehiclePrice <= 0) {
        return res.status(400).json({
          error: 'Vehicle price is required and must be greater than 0'
        });
      }

      // Calculate CIF value (Cost + Insurance + Freight)
      const cifValue = vehiclePrice + (freight || 0) + (insurance || 0);

      // Validate eligibility
      const eligibility = validateDominicanEligibility(vehicleAge, vehicleType);
      if (!eligibility.eligible) {
        return res.status(400).json({
          error: 'Vehicle not eligible for import',
          reason: eligibility.reason,
          maxAge: eligibility.maxAge
        });
      }

      // Calculate all taxes and duties
      const calculation = calculateDominicanImport(
        cifValue,
        vehicleAge,
        isUSOrigin && hasCaftaCertificate,
        isElectricHybrid,
        hasDisability,
        co2Emissions
      );

      // AI-enhanced insights based on comprehensive research
      const aiInsights = generateDominicanInsights(
        vehicleAge,
        calculation.effectiveTaxRate,
        isUSOrigin,
        hasCaftaCertificate,
        isElectricHybrid
      );

      res.json({
        success: true,
        country: 'Dominican Republic',
        calculation: {
          ...calculation,
          cifValue,
          vehicleAge,
          aiInsights,
          eligibility
        }
      });

    } catch (error) {
      console.error('Dominican Republic calculation error:', error);
      res.status(500).json({
        error: 'Calculation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Dominican Republic Eligibility Check
   */
  app.post('/api/dominican-republic/eligibility', requireAuth, async (req: Request, res: Response) => {
    try {
      const { vinAnalysis, vehicleAge, vehicleType = 'passenger' } = req.body;

      const eligibility = validateDominicanEligibility(vehicleAge, vehicleType);
      
      res.json({
        success: true,
        eligible: eligibility.eligible,
        reason: eligibility.reason,
        maxAge: eligibility.maxAge,
        requirements: [
          'Clean title (no salvage history)',
          'Left-hand drive only',
          'Must pass emissions and safety inspection',
          'Proper documentation (title, bill of lading)',
          'CAFTA Certificate of Origin (for US vehicles)'
        ]
      });

    } catch (error) {
      console.error('Dominican Republic eligibility check error:', error);
      res.status(500).json({
        error: 'Eligibility check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Calculate Dominican Republic import duties based on official 2024 rates
 */
function calculateDominicanImport(
  cifValue: number,
  vehicleAge: number,
  hasCaftaBenefit: boolean,
  isElectricHybrid: boolean,
  hasDisability: boolean,
  co2Emissions: number
) {
  // Import Duty (Arancel) - 20% standard, 0% with CAFTA
  const importDuty = hasCaftaBenefit ? 0 : cifValue * 0.20;

  // Selective Consumption Tax (ISC) - CO2-based "Green Tax"
  // 0-5% based on emissions: 0% for <100g/km, up to 5% for high emissions
  let iscRate = 0;
  if (co2Emissions >= 200) iscRate = 0.05;
  else if (co2Emissions >= 150) iscRate = 0.03;
  else if (co2Emissions >= 120) iscRate = 0.015;
  else if (co2Emissions >= 100) iscRate = 0.01;
  
  // Electric/Hybrid vehicles get 50% reduction under Law 103-13
  if (isElectricHybrid) {
    iscRate *= 0.5;
  }
  
  const isc = cifValue * iscRate;

  // VAT (ITBIS) - 18% of (CIF + Import Duty + ISC)
  const taxableBase = cifValue + importDuty + isc;
  const vat = taxableBase * 0.18;

  // First Plate Registration Tax - 17% of CIF
  // 100% exemption for persons with disabilities under Law 5-13
  const registrationTax = hasDisability ? 0 : cifValue * 0.17;

  // Port/Handling Fees - approximately 3% of (CIF + Import Duty)
  const portFees = (cifValue + importDuty) * 0.03;

  // Annual Circulation Tax (Marbete)
  // DOP 3,000 for ≤5 years, DOP 1,500 for >5 years
  // Convert at approximate rate 1 USD = 58 DOP
  const marbete = vehicleAge <= 5 ? (3000 / 58) : (1500 / 58);

  // Calculate totals
  const totalTaxes = importDuty + isc + vat + registrationTax + portFees;
  const totalCost = cifValue + totalTaxes + marbete;
  const effectiveTaxRate = ((totalTaxes / cifValue) * 100);

  return {
    cifValue,
    vehicleAge,
    effectiveTaxRate: parseFloat(effectiveTaxRate.toFixed(1)),
    taxes: {
      importDuty,
      isc,
      vat,
      registrationTax,
      portFees
    },
    totalTaxes,
    totalCost,
    annualCosts: {
      marbete
    },
    caftaBenefit: hasCaftaBenefit,
    caftaSavings: hasCaftaBenefit ? cifValue * 0.20 : 0,
    disabilityExemption: hasDisability,
    disabilitySavings: hasDisability ? cifValue * 0.17 : 0,
    breakdown: [
      { item: 'Vehicle CIF Value', amount: cifValue },
      { item: 'Import Duty (Arancel)', amount: importDuty, note: hasCaftaBenefit ? 'CAFTA Exempt' : '20%' },
      { item: 'ISC Green Tax', amount: isc, note: `CO2-based (${(iscRate * 100).toFixed(1)}%)` },
      { item: 'VAT (ITBIS)', amount: vat, note: '18%' },
      { item: 'Registration Tax', amount: registrationTax, note: hasDisability ? 'Disability Exempt' : '17%' },
      { item: 'Port/Handling Fees', amount: portFees, note: '~3%' },
      { item: 'Annual Marbete', amount: marbete, note: vehicleAge <= 5 ? 'DOP 3,000' : 'DOP 1,500' }
    ]
  };
}

/**
 * Validate vehicle eligibility for Dominican Republic import
 */
function validateDominicanEligibility(vehicleAge: number, vehicleType: string) {
  // Age limits per Law 04-07
  if (vehicleType === 'passenger' && vehicleAge > 5) {
    return {
      eligible: false,
      reason: 'Passenger vehicles must be 5 years old or newer',
      maxAge: 5
    };
  }

  if (vehicleType === 'truck' && vehicleAge > 15) {
    return {
      eligible: false,
      reason: 'Heavy trucks (>5 tons) must be 15 years old or newer',
      maxAge: 15
    };
  }

  return {
    eligible: true,
    reason: 'Vehicle meets age requirements',
    maxAge: vehicleType === 'passenger' ? 5 : 15
  };
}

/**
 * Generate AI-enhanced insights for Dominican Republic imports
 */
function generateDominicanInsights(
  vehicleAge: number,
  effectiveTaxRate: number,
  isUSOrigin: boolean,
  hasCaftaCertificate: boolean,
  isElectricHybrid: boolean
): any {
  const insights = [];

  // Age analysis
  if (vehicleAge <= 3) {
    insights.push({
      type: 'advantage',
      title: 'Optimal Age Range',
      description: 'Vehicle is in the preferred age range with lower tax burden and higher resale value in DR market.'
    });
  } else if (vehicleAge >= 4) {
    insights.push({
      type: 'warning',
      title: 'Approaching Age Limit',
      description: `Vehicle is ${vehicleAge} years old. Dominican Republic has a strict 5-year limit for passenger vehicles.`
    });
  }

  // CAFTA benefits
  if (isUSOrigin) {
    if (hasCaftaCertificate) {
      insights.push({
        type: 'savings',
        title: 'CAFTA Duty Exemption',
        description: 'US origin vehicle with CAFTA certificate qualifies for 0% import duty (20% savings).'
      });
    } else {
      insights.push({
        type: 'missed_opportunity',
        title: 'Missing CAFTA Certificate',
        description: 'US vehicle without CAFTA certificate pays full 20% import duty. Obtain certificate to save significantly.'
      });
    }
  }

  // Environmental considerations
  if (isElectricHybrid) {
    insights.push({
      type: 'incentive',
      title: 'Green Vehicle Benefits',
      description: 'Electric/hybrid vehicles receive 50% reduction on ISC environmental tax under Law 103-13.'
    });
  }

  // Tax rate analysis
  if (effectiveTaxRate < 30) {
    insights.push({
      type: 'excellent',
      title: 'Low Tax Burden',
      description: 'Very favorable tax rate for Dominican Republic import. Excellent import opportunity.'
    });
  } else if (effectiveTaxRate > 50) {
    insights.push({
      type: 'caution',
      title: 'High Tax Burden',
      description: 'High effective tax rate. Consider if total cost justifies import versus local purchase.'
    });
  }

  // Market insights
  insights.push({
    type: 'market',
    title: 'Dominican Market Advantage',
    description: 'Strong used vehicle market with good resale values. Clean title vehicles from US auctions are highly valued.'
  });

  return {
    summary: `Dominican Republic import with ${effectiveTaxRate.toFixed(1)}% effective tax rate. ${isUSOrigin && hasCaftaCertificate ? 'CAFTA benefits applied.' : 'Standard rates apply.'}`,
    recommendations: [
      'Ensure clean title (no salvage history)',
      'Obtain CAFTA Certificate of Origin for US vehicles',
      'Plan for mandatory DEKRA inspection',
      'Budget for annual Marbete circulation tax'
    ],
    insights
  };
}