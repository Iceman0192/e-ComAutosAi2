import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, DollarSign, BarChart4 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function ImportCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState<number>(4545);
  const [freight, setFreight] = useState<number>(681.75);
  const [insurance, setInsurance] = useState<number>(0);
  const [vinNumber, setVinNumber] = useState<string>("");
  const [isCaftaEligible, setIsCaftaEligible] = useState<boolean>(false);
  const [calculationDetails, setCalculationDetails] = useState<any>(null);

  // Check CAFTA eligibility based on VIN
  const isNorthAmericanOrigin = (vin: string): boolean => {
    if (!vin || vin.length !== 17) return false;
    const firstChar = vin.charAt(0).toUpperCase();
    return ['1', '4', '5'].includes(firstChar); // US manufactured VINs only
  };

  // Honduras Tax Rules - 2025 CAFTA-DR
  const hondurasRules = {
    north_american_origin: {
      duty: 0.0, // 0% duty for CAFTA North American vehicles
      selectiveTaxBrackets: {
        0: 0.10,     // 10% for vehicles up to $7,000
        7000: 0.15,  // 15% for vehicles $7,000-10,000
        10000: 0.20, // 20% for vehicles $10,000-20,000
        20000: 0.30, // 30% for vehicles $20,000-50,000
        50000: 0.45, // 45% for vehicles $50,000-100,000
        100000: 0.60 // 60% for vehicles over $100,000
      },
      ecoTaxBrackets: {
        0: 200,     // $200 for vehicles up to $15,000
        15000: 280, // $280 for vehicles $15,001-25,000
        25000: 400  // $400 for vehicles over $25,000
      },
      salesTax: 0.15, // 15% Sales Tax
      otherFees: 0.10 // 10% for storage, customs broker, registration
    },
    other_origin: {
      duty: 0.15, // 15% duty for non-CAFTA vehicles
      selectiveTaxBrackets: {
        0: 0.10,
        7000: 0.15,
        10000: 0.20,
        20000: 0.30,
        50000: 0.45,
        100000: 0.60
      },
      ecoTaxBrackets: {
        0: 205,
        15000: 280,
        25000: 410
      },
      salesTax: 0.15,
      otherFees: 0.03
    }
  };

  // Calculate taxes with proper cumulative/stackable logic
  const calculateHondurasTaxes = () => {
    if (!vehiclePrice) return null;

    const isNorthAmerican = vinNumber ? isNorthAmericanOrigin(vinNumber) : isCaftaEligible;
    const rules = isNorthAmerican ? hondurasRules.north_american_origin : hondurasRules.other_origin;

    // Step 1: Calculate CIF (Cost, Insurance, Freight)
    const cifValue = vehiclePrice + freight + insurance;
    let accumulatedValue = cifValue;

    // Step 2: Calculate import duty
    let dutyTax = 0;
    if (rules.duty > 0) {
      dutyTax = cifValue * rules.duty;
      accumulatedValue += dutyTax;
    }

    // Step 3: Calculate selective consumption tax on accumulated value (CIF + Duty)
    const applyBracketTax = (value: number, brackets: Record<number, number>): number => {
      const thresholds = Object.keys(brackets).map(Number).sort((a, b) => b - a);
      for (const threshold of thresholds) {
        if (value >= threshold) {
          return brackets[threshold];
        }
      }
      return 0;
    };

    const selectiveTaxRate = applyBracketTax(accumulatedValue, rules.selectiveTaxBrackets);
    const selectiveTax = accumulatedValue * selectiveTaxRate;
    accumulatedValue += selectiveTax;

    // Step 4: Calculate environmental tax
    const ecoTaxThresholds = Object.keys(rules.ecoTaxBrackets).map(Number).sort((a, b) => b - a);
    let environmentalTax = 0;
    for (const threshold of ecoTaxThresholds) {
      if (cifValue >= threshold) {
        environmentalTax = rules.ecoTaxBrackets[threshold];
        break;
      }
    }
    accumulatedValue += environmentalTax;

    // Step 5: Calculate sales tax on accumulated value
    const salesTax = accumulatedValue * rules.salesTax;
    accumulatedValue += salesTax;

    // Step 6: Calculate other fees
    const otherFees = cifValue * rules.otherFees;
    accumulatedValue += otherFees;

    return {
      cifValue,
      dutyTax,
      selectiveTax,
      selectiveTaxRate: selectiveTaxRate * 100,
      environmentalTax,
      salesTax,
      otherFees,
      totalTaxAmount: accumulatedValue - cifValue,
      totalImportCost: accumulatedValue,
      taxPercentage: ((accumulatedValue - cifValue) / cifValue * 100).toFixed(1),
      caftaEligible: isNorthAmerican,
      caftaSavings: isNorthAmerican ? (cifValue * hondurasRules.other_origin.duty) : 0,
      breakdown: [
        { step: "CIF Value", value: cifValue, accumulated: cifValue },
        { step: "Import Duty", value: dutyTax, accumulated: cifValue + dutyTax },
        { step: "Selective Tax", value: selectiveTax, accumulated: cifValue + dutyTax + selectiveTax },
        { step: "Environmental Tax", value: environmentalTax, accumulated: cifValue + dutyTax + selectiveTax + environmentalTax },
        { step: "Sales Tax (15%)", value: salesTax, accumulated: accumulatedValue - otherFees },
        { step: "Other Fees", value: otherFees, accumulated: accumulatedValue }
      ]
    };
  };

  useEffect(() => {
    const calculation = calculateHondurasTaxes();
    setCalculationDetails(calculation);
  }, [vehiclePrice, freight, insurance, isCaftaEligible, vinNumber]);

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
                🇭🇳 Honduras Import Duty Calculator
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Accurate 2025 Honduras import cost calculator with cumulative tax calculations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* VIN Number for CAFTA Eligibility */}
                <div>
                  <Label htmlFor="vin">Vehicle VIN (for CAFTA eligibility)</Label>
                  <Input
                    id="vin"
                    type="text"
                    placeholder="1N6AD0ER4DN751317"
                    value={vinNumber}
                    onChange={(e) => {
                      const vin = e.target.value.toUpperCase();
                      setVinNumber(vin);
                      if (vin.length >= 1) {
                        setIsCaftaEligible(isNorthAmericanOrigin(vin));
                      }
                    }}
                    className="font-mono"
                    maxLength={17}
                  />
                  {vinNumber.length > 0 && (
                    <div className={`mt-2 p-2 rounded ${isCaftaEligible ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                      <div className="flex items-center gap-2">
                        {isCaftaEligible ? (
                          <>
                            <Badge className="bg-emerald-100 text-emerald-800">CAFTA Eligible</Badge>
                            <span className="text-sm">US manufactured - duty exemption</span>
                          </>
                        ) : (
                          <>
                            <Badge className="bg-orange-100 text-orange-800">Non-CAFTA</Badge>
                            <span className="text-sm">Foreign origin - 15% duty applies</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Price */}
                <div>
                  <Label htmlFor="price">Vehicle Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={vehiclePrice || ''}
                    onChange={(e) => setVehiclePrice(Number(e.target.value))}
                  />
                </div>

                {/* Freight Cost */}
                <div>
                  <Label htmlFor="freight">Freight Cost (USD)</Label>
                  <Input
                    id="freight"
                    type="number"
                    value={freight || ''}
                    onChange={(e) => setFreight(Number(e.target.value))}
                  />
                </div>

                {/* Insurance Cost */}
                <div>
                  <Label htmlFor="insurance">Insurance Cost (USD)</Label>
                  <Input
                    id="insurance"
                    type="number"
                    value={insurance || ''}
                    onChange={(e) => setInsurance(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {calculationDetails ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart4 className="h-5 w-5" />
                      Honduras Import Cost Summary
                    </CardTitle>
                    <CardDescription>
                      Cumulative tax calculation breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Vehicle Price:</span>
                          <span className="font-medium">${vehiclePrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">CIF Value:</span>
                          <span className="font-medium">${calculationDetails.cifValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Selective Tax Rate:</span>
                          <span className="font-medium text-orange-600">{calculationDetails.selectiveTaxRate}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Taxes:</span>
                          <span className="font-medium text-red-600">${calculationDetails.totalTaxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Import Cost:</span>
                          <span className="text-blue-600">${calculationDetails.totalImportCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Tax Percentage:</span>
                          <span className="font-medium text-orange-600">{calculationDetails.taxPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Breakdown */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                        Cumulative Tax Calculation Steps
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Step</TableHead>
                            <TableHead className="text-right">Tax Amount</TableHead>
                            <TableHead className="text-right">Accumulated Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calculationDetails.breakdown.map((step: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{step.step}</TableCell>
                              <TableCell className="text-right">${step.value.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">${step.accumulated.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* CAFTA Status */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        CAFTA-DR Status for Honduras
                      </h4>
                      {calculationDetails.caftaEligible ? (
                        <div className="space-y-1">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            ✅ This vehicle qualifies for CAFTA-DR benefits (0% import duty).
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💰 Duty savings: ${calculationDetails.caftaSavings.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          ⚠️ This vehicle does not qualify for CAFTA-DR benefits. 15% import duty applies.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calculator className="h-16 w-16 text-slate-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Ready to Calculate
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-center">
                    Enter vehicle information to see detailed Honduras import cost breakdown.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}