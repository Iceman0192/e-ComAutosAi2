import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DutyCalculation {
  country: string;
  vehicleValue: number;
  importDuty: number;
  selectiveTax: number;
  vat: number;
  environmentalTax: number;
  registrationFees: number;
  totalTaxes: number;
  totalCost: number;
  taxPercentage: number;
}

const countryTaxRates = {
  honduras: {
    name: 'Honduras',
    selectiveTax: [
      { min: 0, max: 7000, rate: 10 },
      { min: 7000, max: 10000, rate: 15 },
      { min: 10000, max: 20000, rate: 20 },
      { min: 20000, max: 50000, rate: 30 },
      { min: 50000, max: 100000, rate: 45 },
      { min: 100000, max: Infinity, rate: 60 }
    ],
    vat: 15,
    environmentalTax: [
      { min: 0, max: 15000, fee: 200 }, // L.5,000 ≈ $200
      { min: 15000, max: 25000, fee: 280 }, // L.7,000 ≈ $280
      { min: 25000, max: Infinity, fee: 400 } // L.10,000 ≈ $400
    ],
    fixedFees: 530, // Port + broker + registration ≈ $530
    ageLimit: 10,
    restrictions: 'No vehicles over 10 years old. No irreparable/junk titles. Salvage OK if repairable.'
  },
  guatemala: {
    name: 'Guatemala',
    importDuty: 0, // Used vehicles exempt
    vat: 12,
    iprima: [
      { min: 0, max: 15000, rate: 10 },
      { min: 15000, max: 30000, rate: 15 },
      { min: 30000, max: Infinity, rate: 20 }
    ],
    fixedFees: 350, // Broker + registration ≈ $350
    ageLimit: 15,
    restrictions: 'Up to 15 years old. Must be operable at inspection. Salvage OK if repairable.'
  },
  elsalvador: {
    name: 'El Salvador',
    importDuty: [
      { type: 'standard', rate: 25 },
      { type: 'over2000cc', rate: 30 },
      { type: 'pickup', rate: 5 }
    ],
    vat: 13,
    registrationFee: 71,
    fixedFees: 350, // Port + broker + registration
    ageLimit: 8,
    restrictions: 'Only 8 years or newer (2017+ in 2025). Salvage OK if repairable. Heavy vehicles have different age limits.'
  },
  nicaragua: {
    name: 'Nicaragua',
    importDuty: 25,
    selectiveTax: 10, // Standard cars
    vat: 15,
    fixedFees: 375, // Port + broker + registration
    ageLimit: 10,
    restrictions: 'Up to 10 years old. Salvage OK if repairable. Pensioner exemptions available up to $13,000.'
  },
  costarica: {
    name: 'Costa Rica',
    importDuty: 10,
    totalTaxByAge: [
      { minAge: 0, maxAge: 3, rate: 53 },
      { minAge: 4, maxAge: 5, rate: 64 },
      { minAge: 6, maxAge: Infinity, rate: 79 }
    ],
    vat: 13,
    fixedFees: 400,
    ageLimit: null, // No hard age limit, but high taxes on older vehicles
    restrictions: 'Must pass RITEVE inspection. Very high taxes on older vehicles (79% for 6+ years old).'
  }
};

export function ImportDutyCalculator({ className }: { className?: string }) {
  const [vehicleValue, setVehicleValue] = useState('');
  const [freightCost, setFreightCost] = useState('');
  const [insuranceCost, setInsuranceCost] = useState('');
  const [engineSize, setEngineSize] = useState('');
  const [vehicleAge, setVehicleAge] = useState('');
  const [vehicleType, setVehicleType] = useState('standard');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [calculation, setCalculation] = useState<DutyCalculation | null>(null);

  const calculateDuties = () => {
    if (!vehicleValue || !selectedCountry) return;

    const value = parseFloat(vehicleValue);
    const freight = parseFloat(freightCost) || 0;
    const insurance = parseFloat(insuranceCost) || 0;
    const cifValue = value + freight + insurance;
    const age = parseInt(vehicleAge) || 0;
    const engine = parseFloat(engineSize) || 0;
    const countryData = countryTaxRates[selectedCountry as keyof typeof countryTaxRates];
    
    let calc: DutyCalculation = {
      country: countryData.name,
      vehicleValue: value,
      importDuty: 0,
      selectiveTax: 0,
      vat: 0,
      environmentalTax: 0,
      registrationFees: countryData.fixedFees,
      totalTaxes: 0,
      totalCost: 0,
      taxPercentage: 0
    };

    // Country-specific calculations
    switch (selectedCountry) {
      case 'honduras':
        // Selective consumption tax (ISC)
        const hndTaxBracket = countryData.selectiveTax.find(bracket => 
          value >= bracket.min && value < bracket.max
        );
        calc.selectiveTax = value * (hndTaxBracket?.rate || 60) / 100;
        
        // Environmental tax
        const envTaxBracket = countryData.environmentalTax.find(bracket =>
          value >= bracket.min && value < bracket.max
        );
        calc.environmentalTax = envTaxBracket?.fee || 400;
        
        // VAT on CIF + ISC
        calc.vat = (value + calc.selectiveTax) * (countryData.vat / 100);
        break;

      case 'guatemala':
        // IPRIMA tax
        const gtmTaxBracket = countryData.iprima.find(bracket =>
          value >= bracket.min && value < bracket.max
        );
        calc.selectiveTax = value * (gtmTaxBracket?.rate || 20) / 100;
        calc.vat = value * (countryData.vat / 100);
        break;

      case 'elsalvador':
        // Import duty based on vehicle type
        let dutyRate = 25; // Standard
        if (vehicleType === 'pickup') dutyRate = 5;
        else if (vehicleType === 'over2000cc') dutyRate = 30;
        
        calc.importDuty = value * (dutyRate / 100);
        calc.vat = (value + calc.importDuty) * (countryData.vat / 100);
        calc.registrationFees += countryData.registrationFee;
        break;

      case 'nicaragua':
        calc.importDuty = value * (countryData.importDuty / 100);
        calc.selectiveTax = value * (countryData.selectiveTax / 100);
        calc.vat = (value + calc.importDuty + calc.selectiveTax) * (countryData.vat / 100);
        break;

      case 'costarica':
        // Costa Rica uses total tax percentage by age
        const crTaxBracket = countryData.totalTaxByAge.find(bracket =>
          age >= bracket.minAge && age <= bracket.maxAge
        );
        const totalTaxRate = crTaxBracket?.rate || 79;
        calc.importDuty = value * (totalTaxRate / 100);
        calc.vat = (value + calc.importDuty) * (countryData.vat / 100);
        break;
    }

    calc.totalTaxes = calc.importDuty + calc.selectiveTax + calc.vat + calc.environmentalTax;
    calc.totalCost = value + calc.totalTaxes + calc.registrationFees;
    calc.taxPercentage = ((calc.totalTaxes + calc.registrationFees) / value) * 100;

    setCalculation(calc);
  };

  return (
    <Card className={`border-green-200 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
        <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
          <Calculator className="h-6 w-6" />
          Import Duty Calculator
          <Badge variant="outline" className="ml-auto">Central America</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vehicle-value">Vehicle CIF Value (USD)</Label>
            <Input
              id="vehicle-value"
              type="number"
              placeholder="10000"
              value={vehicleValue}
              onChange={(e) => setVehicleValue(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="vehicle-age">Vehicle Age (Years)</Label>
            <Input
              id="vehicle-age"
              type="number"
              placeholder="5"
              value={vehicleAge}
              onChange={(e) => setVehicleAge(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="vehicle-type">Vehicle Type</Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Car</SelectItem>
                <SelectItem value="pickup">Pickup Truck</SelectItem>
                <SelectItem value="over2000cc">Over 2.0L Engine</SelectItem>
                <SelectItem value="luxury">Luxury Vehicle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="country">Destination Country</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="honduras">Honduras</SelectItem>
                <SelectItem value="guatemala">Guatemala</SelectItem>
                <SelectItem value="elsalvador">El Salvador</SelectItem>
                <SelectItem value="nicaragua">Nicaragua</SelectItem>
                <SelectItem value="costarica">Costa Rica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={calculateDuties}
          disabled={!vehicleValue || !selectedCountry}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Import Costs
        </Button>

        {calculation && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Import Cost Breakdown - {calculation.country}</h4>
              <Badge variant="secondary" className="text-lg font-bold">
                {calculation.taxPercentage.toFixed(1)}% Total Tax Rate
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Vehicle CIF Value:</span>
                  <span className="font-bold">${calculation.vehicleValue.toLocaleString()}</span>
                </div>
                {calculation.importDuty > 0 && (
                  <div className="flex justify-between">
                    <span>Import Duty:</span>
                    <span>${calculation.importDuty.toLocaleString()}</span>
                  </div>
                )}
                {calculation.selectiveTax > 0 && (
                  <div className="flex justify-between">
                    <span>Selective Tax:</span>
                    <span>${calculation.selectiveTax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT:</span>
                  <span>${calculation.vat.toLocaleString()}</span>
                </div>
                {calculation.environmentalTax > 0 && (
                  <div className="flex justify-between">
                    <span>Environmental Tax:</span>
                    <span>${calculation.environmentalTax.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Port & Registration Fees:</span>
                  <span>${calculation.registrationFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total Taxes:</span>
                  <span className="font-bold text-red-600">${calculation.totalTaxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold text-lg">Total Import Cost:</span>
                  <span className="font-bold text-lg text-green-600">${calculation.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedCountry && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">Import Restrictions - {calculation.country}</h5>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {countryTaxRates[selectedCountry as keyof typeof countryTaxRates].restrictions}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}