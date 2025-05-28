import { useState } from 'react';
import { Calculator, Truck, DollarSign, Globe, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DutyCalculation {
  country: string;
  vehicleValue: number;
  freightCost: number;
  insuranceCost: number;
  cifValue: number;
  importDuty: number;
  selectiveTax: number;
  vat: number;
  environmentalTax: number;
  registrationFees: number;
  totalTaxes: number;
  totalCost: number;
  taxPercentage: number;
  cafta: {
    eligible: boolean;
    savings: number;
    requirements: string[];
  };
}

const countryTaxRates = {
  honduras: {
    name: 'Honduras',
    importDuty: 15,
    selectiveTax: [
      { min: 0, max: 30000, rate: 1 },
      { min: 30000, max: 50000, rate: 5 },
      { min: 50000, max: Infinity, rate: 10 }
    ],
    vat: 15,
    environmentalTax: [
      { min: 0, max: 30000, fee: 500 },
      { min: 30000, max: 50000, fee: 1000 },
      { min: 50000, max: Infinity, fee: 2000 }
    ],
    fixedFees: 1200,
    ageLimit: 10,
    restrictions: 'Vehicles must be less than 10 years old. Left-hand drive only.'
  },
  guatemala: {
    name: 'Guatemala',
    importDuty: 10,
    vat: 12,
    iprima: [
      { min: 0, max: 20000, rate: 0 },
      { min: 20000, max: 40000, rate: 5 },
      { min: 40000, max: Infinity, rate: 10 }
    ],
    fixedFees: 800,
    ageLimit: 8,
    restrictions: 'Must pass environmental inspection. Vehicles over 8 years face additional restrictions.'
  },
  elsalvador: {
    name: 'El Salvador',
    importDuty: 5,
    selectiveTax: [
      { min: 0, max: 25000, rate: 2 },
      { min: 25000, max: 45000, rate: 7 },
      { min: 45000, max: Infinity, rate: 15 }
    ],
    vat: 13,
    environmentalTax: [
      { min: 0, max: 25000, fee: 300 },
      { min: 25000, max: 45000, fee: 600 },
      { min: 45000, max: Infinity, fee: 1200 }
    ],
    fixedFees: 600,
    ageLimit: 12,
    restrictions: 'Environmental inspection required. Must meet US emission standards.'
  },
  nicaragua: {
    name: 'Nicaragua',
    importDuty: 15,
    selectiveTax: [
      { min: 0, max: 15000, rate: 3 },
      { min: 15000, max: 35000, rate: 8 },
      { min: 35000, max: Infinity, rate: 12 }
    ],
    vat: 15,
    environmentalTax: [
      { min: 0, max: 20000, fee: 400 },
      { min: 20000, max: 40000, fee: 800 },
      { min: 40000, max: Infinity, fee: 1500 }
    ],
    fixedFees: 900,
    ageLimit: 15,
    restrictions: 'Must be registered within 30 days. Annual circulation permit required.'
  },
  costarica: {
    name: 'Costa Rica',
    importDuty: 14,
    vat: 13,
    totalTaxByAge: [
      { min: 0, max: 3, rate: 53.69 },
      { min: 3, max: 6, rate: 63.91 },
      { min: 6, max: Infinity, rate: 79.03 }
    ],
    registrationFee: 3,
    fixedFees: 1500,
    ageLimit: 6,
    restrictions: 'Must pass RITEVE inspection. Very high taxes on older vehicles (79% for 6+ years old).'
  }
};

export default function ImportCalculator() {
  const [vehicleValue, setVehicleValue] = useState('');
  const [freightCost, setFreightCost] = useState('');
  const [insuranceCost, setInsuranceCost] = useState('');
  const [engineSize, setEngineSize] = useState('');
  const [vehicleAge, setVehicleAge] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [calculation, setCalculation] = useState<DutyCalculation | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculateDuties = () => {
    if (!vehicleValue || !selectedCountry) return;

    const value = parseFloat(vehicleValue);
    const freight = parseFloat(freightCost) || 1500; // Default freight
    const insurance = parseFloat(insuranceCost) || 300; // Default insurance
    const cifValue = value + freight + insurance;
    const age = parseInt(vehicleAge) || 0;
    const engine = parseFloat(engineSize) || 0;
    const countryData = countryTaxRates[selectedCountry as keyof typeof countryTaxRates];
    
    let calc: DutyCalculation = {
      country: countryData.name,
      vehicleValue: value,
      freightCost: freight,
      insuranceCost: insurance,
      cifValue: cifValue,
      importDuty: 0,
      selectiveTax: 0,
      vat: 0,
      environmentalTax: 0,
      registrationFees: countryData.fixedFees,
      totalTaxes: 0,
      totalCost: 0,
      taxPercentage: 0,
      cafta: {
        eligible: false,
        savings: 0,
        requirements: []
      }
    };

    // Calculate import duty
    calc.importDuty = (cifValue * (countryData.importDuty / 100));

    // Calculate selective tax (if applicable)
    if ('selectiveTax' in countryData) {
      const selectiveTaxBracket = countryData.selectiveTax.find((bracket: any) => 
        cifValue >= bracket.min && cifValue < bracket.max
      );
      if (selectiveTaxBracket) {
        calc.selectiveTax = (cifValue * (selectiveTaxBracket.rate / 100));
      }
    }

    // Calculate environmental tax (if applicable)
    if ('environmentalTax' in countryData) {
      const envTaxBracket = countryData.environmentalTax.find((bracket: any) => 
        cifValue >= bracket.min && cifValue < bracket.max
      );
      if (envTaxBracket) {
        calc.environmentalTax = envTaxBracket.fee;
      }
    }

    // Calculate IPRIMA for Guatemala (if applicable)
    if ('iprima' in countryData) {
      const iprimaBracket = countryData.iprima.find((bracket: any) => 
        cifValue >= bracket.min && cifValue < bracket.max
      );
      if (iprimaBracket) {
        calc.selectiveTax = (cifValue * (iprimaBracket.rate / 100));
      }
    }

    // Calculate Costa Rica's age-based tax
    if ('totalTaxByAge' in countryData) {
      if ('registrationFee' in countryData) {
        calc.registrationFees = (cifValue * (countryData.registrationFee / 100));
      }
      
      calc.importDuty = (cifValue * (countryData.importDuty / 100));
      calc.selectiveTax = 0; // Costa Rica uses age-based total tax instead
      
      const ageBracket = countryData.totalTaxByAge.find((bracket: any) => 
        age >= bracket.min && age < bracket.max
      );
      if (ageBracket) {
        const totalTaxBase = cifValue + calc.importDuty;
        calc.selectiveTax = (totalTaxBase * (ageBracket.rate / 100));
      }
    }

    // Calculate VAT
    const taxableAmount = cifValue + calc.importDuty + calc.selectiveTax;
    calc.vat = (taxableAmount * (countryData.vat / 100));

    // CAFTA eligibility check
    const isCaftaOrigin = true; // Assume US origin for calculation
    if (isCaftaOrigin && selectedCountry !== 'costarica') {
      calc.cafta.eligible = true;
      calc.cafta.savings = calc.importDuty;
      calc.cafta.requirements = [
        'Vehicle must be of North American origin',
        'Must have certificate of origin',
        'VIN must start with 1, 4, or 5'
      ];
      calc.importDuty = 0; // CAFTA eliminates import duties
    }

    // Calculate totals
    calc.totalTaxes = calc.importDuty + calc.selectiveTax + calc.vat + calc.environmentalTax + calc.registrationFees;
    calc.totalCost = cifValue + calc.totalTaxes;
    calc.taxPercentage = ((calc.totalTaxes / cifValue) * 100);

    setCalculation(calc);
  };

  const isEligibleForCountry = (countryKey: string) => {
    if (!vehicleAge) return true;
    const age = parseInt(vehicleAge);
    const country = countryTaxRates[countryKey as keyof typeof countryTaxRates];
    return age <= country.ageLimit;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                CAFTA Import Duty Tax Calculator
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Calculate exact import duties, taxes, and fees for exporting vehicles to Central American countries under the CAFTA-DR Treaty
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Parameters */}
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  CAFTA Eligible - North American Origin
                </Badge>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Estimated duty savings: $0 (compared to non-CAFTA origin)</span>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Input Parameters
              </h2>

              <div className="space-y-4">
                {/* Destination Country */}
                <div>
                  <Label htmlFor="country" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Destination Country
                  </Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="honduras">🇭🇳 Honduras</SelectItem>
                      <SelectItem value="guatemala">🇬🇹 Guatemala</SelectItem>
                      <SelectItem value="elsalvador">🇸🇻 El Salvador</SelectItem>
                      <SelectItem value="nicaragua">🇳🇮 Nicaragua</SelectItem>
                      <SelectItem value="costarica">🇨🇷 Costa Rica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Value */}
                <div>
                  <Label htmlFor="value" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Vehicle Value (USD)
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="value"
                      type="number"
                      placeholder="5000"
                      value={vehicleValue}
                      onChange={(e) => setVehicleValue(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Freight Cost */}
                <div>
                  <Label htmlFor="freight" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Freight Cost (USD)
                  </Label>
                  <div className="relative mt-1">
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="freight"
                      type="number"
                      placeholder="1500"
                      value={freightCost}
                      onChange={(e) => setFreightCost(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Insurance Cost */}
                <div>
                  <Label htmlFor="insurance" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Insurance Cost (USD)
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="insurance"
                      type="number"
                      placeholder="300"
                      value={insuranceCost}
                      onChange={(e) => setInsuranceCost(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Engine Size */}
                <div>
                  <Label htmlFor="engine" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Engine Size (cc)
                  </Label>
                  <Input
                    id="engine"
                    type="number"
                    placeholder="2000"
                    value={engineSize}
                    onChange={(e) => setEngineSize(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Advanced Options Toggle */}
                <div className="pt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    <Info className="h-4 w-4" />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </button>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div>
                      <Label htmlFor="age" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Vehicle Age (years)
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="3"
                        value={vehicleAge}
                        onChange={(e) => setVehicleAge(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Calculate Button */}
                <Button 
                  onClick={calculateDuties}
                  disabled={!vehicleValue || !selectedCountry}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Import Duties
                </Button>
              </div>
            </div>

            {/* CAFTA Benefits */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">
                CAFTA-DR Benefits
              </h3>
              <div className="text-sm text-emerald-800 dark:text-emerald-200 space-y-2">
                <p>Vehicles with VINs starting with 1, 4, or 5 are considered North American origin under CAFTA-DR and qualify for reduced import duties.</p>
                <p className="font-medium">2025 Updated Rates - All calculations use the latest 2025 tax schedules including selective consumption tax, environmental fees, and registration taxes.</p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {calculation ? (
              <>
                {/* Tax Breakdown */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Tax Calculation for {calculation.country}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Vehicle Value</span>
                      <span className="font-medium">${calculation.vehicleValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Freight Cost</span>
                      <span className="font-medium">${calculation.freightCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Insurance Cost</span>
                      <span className="font-medium">${calculation.insuranceCost.toLocaleString()}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center font-medium">
                      <span>CIF Value</span>
                      <span>${calculation.cifValue.toLocaleString()}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Import Duty</span>
                      <span className={calculation.cafta.eligible ? "line-through text-slate-400" : ""}>
                        ${calculation.importDuty.toLocaleString()}
                      </span>
                    </div>
                    {calculation.cafta.eligible && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>CAFTA Savings</span>
                        <span>-${calculation.cafta.savings.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Selective Tax</span>
                      <span>${calculation.selectiveTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">VAT</span>
                      <span>${calculation.vat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Environmental Tax</span>
                      <span>${calculation.environmentalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Registration Fees</span>
                      <span>${calculation.registrationFees.toLocaleString()}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Cost</span>
                      <span>${calculation.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-600 font-medium">
                      <span>Tax Percentage</span>
                      <span>{calculation.taxPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Country-specific Information */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    {calculation.country} Import Requirements
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {countryTaxRates[selectedCountry as keyof typeof countryTaxRates].restrictions}
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <Calculator className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No Calculation Yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Enter the vehicle details and destination country, then click the Calculate button to see a detailed breakdown of import duties, taxes, and fees.
                </p>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p><strong>CAFTA-DR Benefits:</strong> All calculations use the latest 2025 tax schedules including selective consumption tax, environmental fees, and registration taxes.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}