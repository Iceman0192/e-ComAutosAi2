import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calculator, ArrowRight, DollarSign, AlertTriangle, Info, Clipboard, 
  RefreshCw, Share2, Download, BarChart4, FileText, Truck, Ship 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface DutyTaxCalculatorTabProps {
  vehicle?: any;
}

// Central American countries supported in our system
const CENTRAL_AMERICAN_COUNTRIES = [
  { id: "honduras", name: "Honduras", flag: "🇭🇳" },
  { id: "guatemala", name: "Guatemala", flag: "🇬🇹" },
  { id: "el_salvador", name: "El Salvador", flag: "🇸🇻" },
  { id: "nicaragua", name: "Nicaragua", flag: "🇳🇮" },
  { id: "costa_rica", name: "Costa Rica", flag: "🇨🇷" },
  { id: "panama", name: "Panama", flag: "🇵🇦" },
  { id: "belize", name: "Belize", flag: "🇧🇿" },
  { id: "dominican_republic", name: "Dominican Republic", flag: "🇩🇴" }
];

// Tax calculation rules per country - based on official 2025 rates per CAFTA Treaty
const TAX_RULES = {
  honduras: {
    north_american_origin: {
      duty: 0.0, // 0% duty for CAFTA North American vehicles (often waived under CAFTA-DR)
      selectiveTaxBrackets: { // Selective Consumption Tax (ISC) with brackets
        0: 0.10, // 10% for vehicles up to $7,000
        7000: 0.15, // 15% for vehicles $7,000-10,000
        10000: 0.20, // 20% for vehicles $10,000-20,000
        20000: 0.30, // 30% for vehicles $20,000-50,000
        50000: 0.45, // 45% for vehicles $50,000-100,000
        100000: 0.60, // 60% for vehicles over $100,000
      },
      ecoTaxBrackets: { // One-time "Ecotasa" environmental tax in local currency (converted to USD)
        0: 200, // L.5,000 (~$200) for vehicles up to $15,000
        15000: 280, // L.7,000 (~$280) for vehicles $15,001-25,000
        25000: 400, // L.10,000 (~$400) for vehicles over $25,000
      },
      salesTax: 0.15, // 15% Sales Tax - applied on (CIF + ISC)
      otherFees: 0.10 // ~10% for storage, customs broker, registration (~$530 total)
    },
    other_origin: {
      duty: 0.15, // 5-15% duty for non-CAFTA vehicles (using max rate)
      selectiveTaxBrackets: { // Selective Consumption Tax (ISC) with brackets
        0: 0.10, // 10% for vehicles up to $7,000
        7000: 0.15, // 15% for vehicles $7,000-10,000
        10000: 0.20, // 20% for vehicles $10,000-20,000
        20000: 0.30, // 30% for vehicles $20,000-50,000
        50000: 0.45, // 45% for vehicles $50,000-100,000
        100000: 0.60, // 60% for vehicles over $100,000
      },
      ecoTaxBrackets: { // One-time "Ecotasa" environmental tax in local currency (converted to USD)
        0: 205, // L.5,000 (~$205) for vehicles up to $15,000
        15000: 280, // L.7,000 (~$280) for vehicles $15,001-25,000
        25000: 410, // L.10,000 (~$410) for vehicles over $25,000
      },
      salesTax: 0.15, // 15% Sales Tax - applied on (CIF + ISC)
      otherFees: 0.03 // ~3% for customs processing, registration fees
    }
  },
  guatemala: {
    north_american_origin: {
      duty: 0.0, // 0% duty for CAFTA North American vehicles
      salesTax: 0.12, // 12% IVA (VAT)
      firstRegistrationTaxBrackets: { // IPRIMA tax with brackets
        0: 0.05, // 5% minimum
        standard: 0.10, // 10% for standard vehicles
        luxury: 0.20 // 20% for luxury/high-end models
      },
      otherFees: 0.07 // ~7% for handling, inspections, registration (~$400)
    },
    other_origin: {
      duty: 0.15, // 0-15% duty for non-CAFTA vehicles (using max rate from CET)
      salesTax: 0.12, // 12% IVA (VAT)
      firstRegistrationTaxBrackets: { // IPRIMA tax with brackets
        0: 0.05, // 5% minimum for low-value vehicles
        standard: 0.10, // 10% for standard vehicles
        luxury: 0.20 // 20% for luxury vehicles (>$40,000)
      },
      otherFees: 0.035 // ~3.5% for customs processing, registration fees
    }
  },
  el_salvador: {
    north_american_origin: {
      duty: 0.0, // 0% duty for CAFTA North American vehicles
      salesTax: 0.13, // 13% IVA applied on (CIF + duties)
      firstRegistrationFee: 71, // Fixed fee of $70.91
      otherFees: 0.05 // ~5% for port fees, broker, registration, etc. (~$300-400)
    },
    other_origin: {
      dutyByEngineSize: {
        under2000cc: 0.25, // 25% for cars with engines under 2000cc
        over2000cc: 0.30, // 30% for cars with engines over 2000cc
        pickupTruck: 0.25, // 25% for pickup trucks
        heavyTruck: 0.15 // 15% for heavy trucks/commercial vehicles
      },
      salesTax: 0.13, // 13% IVA applied on (CIF + duties)
      firstRegistrationFee: 350, // Fixed registration fee
      otherFees: 0.025 // ~2.5% for customs processing, registration fees
    }
  },
  nicaragua: {
    north_american_origin: {
      duty: 0.0, // 0% duty for CAFTA vehicles
      selectiveTax: 0.10, // 10% Selective Consumption Tax (ISC)
      salesTax: 0.15, // 15% IVA (applied on CIF + Duty + ISC)
      otherFees: 0.05 // ~5% for port, broker, registration (~$350 total)
    },
    other_origin: {
      duty: 0.10, // 10% duty for non-CAFTA vehicles
      selectiveTax: 0.15, // 15% Selective Consumption Tax (ISC)
      salesTax: 0.15, // 15% IVA (applied on CIF + Duty + ISC)
      otherFees: 0.03 // ~3% for customs processing, registration fees
    }
  },
  costa_rica: {
    north_american_origin: {
      duty: 0.0, // 0% for CAFTA
      salesTax: 0.13, // 13% VAT (IVA)
      ageBrackets: { // Total tax brackets based on vehicle age (includes all compounded taxes)
        new: 0.53, // 53% total effective tax for cars 0-3 years old
        recent: 0.64, // 64% total effective tax for cars 4-5 years old
        older: 0.79, // 79% total effective tax for cars over 6 years old
      },
      electricVehicle: 0.01, // 1% low tax for electric vehicles (plus 13% VAT)
      otherFees: 0.05 // ~5% for registration, inspection, ports (~$350)
    },
    other_origin: {
      duty: 0.30, // 30% base import duty for non-CAFTA vehicles
      salesTax: 0.13, // 13% VAT (IVA)
      selectiveTax: 0.48, // 48% selective consumption tax
      ageBrackets: { // Additional age-based tax brackets
        new: 0.0, // No additional age tax for new vehicles
        recent: 0.10, // +10% for vehicles 4-5 years old
        older: 0.20, // +20% for vehicles 6+ years old
      },
      electricVehicle: 0.01, // 1% low tax for electric vehicles (plus 13% VAT)
      otherFees: 0.03 // ~3% for registration, inspection fees
    }
  },
  panama: {
    north_american_origin: {
      duty: 0.0, // 0% for CAFTA
      salesTax: 0.07, // 7% ITBMS (sales tax)
      flatTaxLowValue: 1500, // $1,500 flat import tax for vehicles up to $8,000
      otherFees: 0.05 // ~5% for customs, registration, etc. (~$300)
    },
    other_origin: {
      dutyByEngineSize: {
        under3000cc: 0.18, // 18% for vehicles under 3000cc
        over3000cc: 0.23, // 23% for vehicles over 3000cc
      },
      selectiveTax: 0.15, // 15% ISC (selective consumption tax)
      salesTax: 0.07, // 7% ITBMS
      flatTaxLowValue: 1500, // $1,500 flat tax for vehicles up to $8,000
      otherFees: 0.03 // ~3% for customs processing, registration fees
    }
  },
  belize: {
    north_american_origin: {
      duty: 0.0, // 0% for CAFTA
      environmentalTax: 0.05, // 5% Environmental Tax
      gst: 0.125, // 12.5% GST
      otherFees: 0.04 // ~4% for customs, registration (~$150-200)
    },
    other_origin: {
      dutyByEngineSize: {
        under2000cc: 0.45, // 45% for vehicles under 2000cc
        over2000cc: 0.60, // 60% for vehicles over 2000cc
      },
      environmentalTax: 0.05, // 5% Environmental Tax
      gst: 0.125, // 12.5% GST
      otherFees: 0.025 // ~2.5% for customs processing, registration fees
    }
  },
  dominican_republic: {
    north_american_origin: {
      duty: 0.0, // 0% duty for CAFTA-DR vehicles (VIN starts with 1, 4, 5)
      luxuryTax: 0.15, // 15% Selective Consumption Tax (Impuesto Selectivo al Consumo)
      salesTax: 0.18, // 18% ITBIS (VAT)
      otherFees: 0.03 // ~3% for customs processing, registration fees
    },
    other_origin: {
      duty: 0.30, // 30% import tariff for non-CAFTA vehicles
      luxuryTax: 0.25, // 25% Selective Consumption Tax (Impuesto Selectivo al Consumo)
      salesTax: 0.18, // 18% ITBIS (VAT)
      otherFees: 0.03 // ~3% for customs processing, registration fees
    }
  }
};

export default function ImportCalculator() {
  const [selectedCountry, setSelectedCountry] = useState<string>("honduras");
  const [vehiclePrice, setVehiclePrice] = useState<number>(0);
  const [freight, setFreight] = useState<number>(1500);
  const [insurance, setInsurance] = useState<number>(300);
  const [isUsed, setIsUsed] = useState<boolean>(true);
  const [engineSize, setEngineSize] = useState<number>(2000);
  const [calculationDetails, setCalculationDetails] = useState<any>(null);
  const [isCaftaEligible, setIsCaftaEligible] = useState<boolean>(false);
  const [dataAutoPopulated, setDataAutoPopulated] = useState<boolean>(false);
  const [useAdvancedOptions, setUseAdvancedOptions] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<string>("basic");
  const [calculatorMode, setCalculatorMode] = useState<string>("new");
  const [vinNumber, setVinNumber] = useState<string>("");
  
  // Advanced shipping cost breakdowns
  const [portFees, setPortFees] = useState<number>(200);
  const [customsHandling, setCustomsHandling] = useState<number>(150);
  const [inlandTransport, setInlandTransport] = useState<number>(300);
  const [storageAndDemurrage, setStorageAndDemurrage] = useState<number>(100);
  const [inspectionFees, setInspectionFees] = useState<number>(75);
  const [bodyDamage, setBodyDamage] = useState<string>("none");
  const [mechanicalCondition, setMechanicalCondition] = useState<string>("good");
  const [bodyStyle, setBodyStyle] = useState<string>("sedan");
  const [fuelType, setFuelType] = useState<string>("gasoline");
  const [includeCompetitiveAnalysis, setIncludeCompetitiveAnalysis] = useState<boolean>(false);
  const [includeBreakevenAnalysis, setIncludeBreakevenAnalysis] = useState<boolean>(false);
  const [includeProfitScenarios, setIncludeProfitScenarios] = useState<boolean>(false);
  
  const { toast } = useToast();

  // Check CAFTA eligibility based on VIN
  const isNorthAmericanOrigin = (vin: string): boolean => {
    if (!vin || vin.length !== 17) return false;
    const firstChar = vin.charAt(0).toUpperCase();
    return ['1', '4', '5'].includes(firstChar); // US manufactured VINs only
  };

  // Auto-populate values from vehicle data
  const autoPopulateFromVehicle = () => {
    if (!vehicle) return;
    
    // Use vehicle's current bid, starting bid, or retail value as base
    const baseValue = vehicle.currentBid || vehicle.startingBid || vehicle.retailValue || 5000;
    setVehiclePrice(baseValue);
    
    // Set engine size if available, with fallback to reasonable defaults based on vehicle type
    if (vehicle.engineSize) {
      setEngineSize(vehicle.engineSize);
    } else if (vehicle.vehicleType === 'SUV' || vehicle.vehicleType === 'Truck') {
      setEngineSize(3500); // Default for larger vehicles
    } else if (vehicle.vehicleType === 'Van' || vehicle.vehicleType === 'Crossover') {
      setEngineSize(2500); // Default for medium vehicles
    } else {
      setEngineSize(2000); // Default for cars
    }
    
    // Set vehicle age
    if (vehicle.year) {
      const currentYear = new Date().getFullYear();
      setIsUsed(currentYear > vehicle.year);
    }
    
    // Check CAFTA eligibility
    if (vehicle.vin) {
      const eligible = isNorthAmericanOrigin(vehicle.vin);
      setIsCaftaEligible(eligible);
      setVinNumber(vehicle.vin);
    }
    
    // Set freight based on vehicle type
    if (vehicle.vehicleType === 'SUV' || vehicle.vehicleType === 'Truck') {
      setFreight(1800);
      setPortFees(250);
      setCustomsHandling(175);
      setInlandTransport(350);
    } else if (vehicle.vehicleType === 'Van') {
      setFreight(1700);
      setPortFees(225);
      setCustomsHandling(160);
      setInlandTransport(325);
    } else {
      setFreight(1500);
      setPortFees(200);
      setCustomsHandling(150);
      setInlandTransport(300);
    }
    
    setDataAutoPopulated(true);
    toast({
      title: "Vehicle Data Populated",
      description: "Calculator populated with vehicle-specific values and CAFTA eligibility check completed.",
    });
  };

  // Calculate taxes based on comprehensive rules
  const calculateTaxes = () => {
    if (!vehiclePrice) return null;
    
    const isNorthAmerican = vinNumber ? isNorthAmericanOrigin(vinNumber) : isCaftaEligible;
    const originType = isNorthAmerican ? 'north_american_origin' : 'other_origin';
    
    // Get country tax rules
    const countryRules = TAX_RULES[selectedCountry as keyof typeof TAX_RULES];
    const rules = countryRules[originType as keyof typeof countryRules] as any;
    
    // Calculate CIF (Cost, Insurance, Freight)
    const cifValue = vehiclePrice + freight + insurance;
    
    let accumulatedValue = cifValue;
    let dutyTax = 0;
    let selectiveTax = 0;
    let salesTax = 0;
    let environmentalTax = 0;
    let registrationFee = 0;
    let otherFees = 0;
    
    // Calculate duty tax based on country rules
    if (rules.duty !== undefined) {
      dutyTax = cifValue * rules.duty;
      accumulatedValue += dutyTax;
    }
    
    // Engine size-based duty (El Salvador, Panama, Belize)
    if (rules.dutyByEngineSize) {
      let dutyRate = 0;
      if (engineSize <= 2000 && rules.dutyByEngineSize.under2000cc) {
        dutyRate = rules.dutyByEngineSize.under2000cc;
      } else if (engineSize > 2000 && engineSize <= 3000) {
        dutyRate = rules.dutyByEngineSize.over2000cc || rules.dutyByEngineSize.under3000cc;
      } else if (engineSize > 3000 && rules.dutyByEngineSize.over3000cc) {
        dutyRate = rules.dutyByEngineSize.over3000cc;
      } else if (rules.dutyByEngineSize.over2000cc) {
        dutyRate = rules.dutyByEngineSize.over2000cc;
      }
      dutyTax = cifValue * dutyRate;
      accumulatedValue += dutyTax;
    }
    
    // Selective consumption tax with brackets (Honduras) - applied to accumulated value
    if (rules.selectiveTaxBrackets) {
      const applyBracketTax = (value: number, brackets: Record<number, number>): number => {
        const thresholds = Object.keys(brackets).map(Number).sort((a, b) => b - a);
        for (const threshold of thresholds) {
          if (value >= threshold) {
            return brackets[threshold];
          }
        }
        return 0;
      };
      
      const applicableRate = applyBracketTax(accumulatedValue, rules.selectiveTaxBrackets);
      selectiveTax = accumulatedValue * applicableRate;
      accumulatedValue += selectiveTax;
    }
    
    // Environmental/eco tax brackets
    if (rules.ecoTaxBrackets) {
      const thresholds = Object.keys(rules.ecoTaxBrackets).map(Number).sort((a, b) => b - a);
      for (const threshold of thresholds) {
        if (cifValue >= threshold) {
          environmentalTax = rules.ecoTaxBrackets[threshold];
          break;
        }
      }
      accumulatedValue += environmentalTax;
    }
    
    // Fixed environmental tax
    if (rules.environmentalTax) {
      environmentalTax = cifValue * rules.environmentalTax;
      accumulatedValue += environmentalTax;
    }
    
    // Simple selective tax (Nicaragua) - applied to accumulated value
    if (rules.selectiveTax) {
      selectiveTax = accumulatedValue * rules.selectiveTax;
      accumulatedValue += selectiveTax;
    }
    
    // Registration tax brackets (Guatemala IPRIMA)
    if (rules.firstRegistrationTaxBrackets) {
      let rate = rules.firstRegistrationTaxBrackets.standard || 0.10;
      if (cifValue > 40000) {
        rate = rules.firstRegistrationTaxBrackets.luxury || 0.20;
      } else if (cifValue < 15000) {
        rate = rules.firstRegistrationTaxBrackets[0] || 0.05;
      }
      registrationFee = cifValue * rate;
      accumulatedValue += registrationFee;
    }
    
    // Fixed registration fee
    if (rules.firstRegistrationFee) {
      registrationFee = rules.firstRegistrationFee;
      accumulatedValue += registrationFee;
    }
    
    // Age-based tax (Costa Rica)
    if (rules.ageBrackets) {
      const currentYear = new Date().getFullYear();
      const vehicleYear = currentYear - 5; // Default to 5 years old
      const age = currentYear - vehicleYear;
      
      let ageRate = rules.ageBrackets.older || 0.79;
      if (age <= 3) {
        ageRate = rules.ageBrackets.new || 0.53;
      } else if (age <= 5) {
        ageRate = rules.ageBrackets.recent || 0.64;
      }
      
      const ageTax = cifValue * ageRate;
      selectiveTax += ageTax;
      accumulatedValue += ageTax;
    }
    
    // Luxury tax (Dominican Republic)
    if (rules.luxuryTax) {
      const luxuryTax = cifValue * rules.luxuryTax;
      selectiveTax += luxuryTax;
      accumulatedValue += luxuryTax;
    }
    
    // Sales tax (applied to accumulated value)
    if (rules.salesTax) {
      salesTax = accumulatedValue * rules.salesTax;
      accumulatedValue += salesTax;
    }
    
    // GST (for Belize)
    if (rules.gst) {
      salesTax = accumulatedValue * rules.gst;
      accumulatedValue += salesTax;
    }
    
    // Flat tax for low value vehicles (Panama)
    if (rules.flatTaxLowValue && cifValue <= 8000) {
      const flatTax = rules.flatTaxLowValue;
      selectiveTax += flatTax;
      accumulatedValue += flatTax;
    }
    
    // Other fees
    if (rules.otherFees) {
      otherFees = cifValue * rules.otherFees;
      accumulatedValue += otherFees;
    }
    
    return {
      cifValue,
      dutyTax,
      selectiveTax,
      salesTax,
      environmentalTax,
      registrationFee,
      otherFees,
      totalTaxAmount: accumulatedValue - cifValue,
      totalImportCost: accumulatedValue,
      taxPercentage: ((accumulatedValue - cifValue) / cifValue * 100).toFixed(1),
      caftaEligible: isNorthAmerican,
      caftaSavings: isNorthAmerican ? (cifValue * (countryRules.other_origin.duty || 0.15)) : 0
    };
  };

  useEffect(() => {
    const calculation = calculateTaxes();
    setCalculationDetails(calculation);
  }, [vehiclePrice, freight, insurance, selectedCountry, engineSize, isCaftaEligible, vinNumber]);

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
                CAFTA Import Duty Calculator
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Professional import cost calculator for Central American markets with 2025 CAFTA-DR treaty rates
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
                            <span className="text-sm">US manufactured - duty exemption applies</span>
                          </>
                        ) : (
                          <>
                            <Badge className="bg-orange-100 text-orange-800">Non-CAFTA</Badge>
                            <span className="text-sm">Foreign origin - standard duties apply</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination Country */}
                <div>
                  <Label htmlFor="country">Destination Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      {CENTRAL_AMERICAN_COUNTRIES.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Price */}
                <div>
                  <Label htmlFor="price">Vehicle Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="15000"
                    value={vehiclePrice || ''}
                    onChange={(e) => setVehiclePrice(Number(e.target.value))}
                  />
                </div>

                {/* Engine Size */}
                <div>
                  <Label htmlFor="engine">Engine Size (cc)</Label>
                  <Input
                    id="engine"
                    type="number"
                    placeholder="2000"
                    value={engineSize || ''}
                    onChange={(e) => setEngineSize(Number(e.target.value))}
                  />
                </div>

                {/* Freight Cost */}
                <div>
                  <Label htmlFor="freight">Freight Cost (USD)</Label>
                  <Input
                    id="freight"
                    type="number"
                    placeholder="1500"
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
                    placeholder="300"
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
                      Import Cost Summary - {CENTRAL_AMERICAN_COUNTRIES.find(c => c.id === selectedCountry)?.name}
                    </CardTitle>
                    <CardDescription>
                      Complete breakdown of import duties, taxes, and fees
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
                          <span className="text-sm text-slate-600">Total Taxes:</span>
                          <span className="font-medium text-red-600">${calculationDetails.totalTaxAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Tax Percentage:</span>
                          <span className="font-medium text-orange-600">{calculationDetails.taxPercentage}%</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Import Cost:</span>
                          <span className="text-blue-600">${calculationDetails.totalImportCost.toLocaleString()}</span>
                        </div>
                        {calculationDetails.caftaEligible && (
                          <div className="flex justify-between">
                            <span className="text-sm text-emerald-600">CAFTA Savings:</span>
                            <span className="font-medium text-emerald-600">${calculationDetails.caftaSavings.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tax Breakdown Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tax Component</TableHead>
                          <TableHead className="text-right">Amount (USD)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>CIF Value (Vehicle + Freight + Insurance)</TableCell>
                          <TableCell className="text-right">${calculationDetails.cifValue.toLocaleString()}</TableCell>
                        </TableRow>
                        {calculationDetails.dutyTax > 0 && (
                          <TableRow>
                            <TableCell>Import Duty</TableCell>
                            <TableCell className="text-right">${calculationDetails.dutyTax.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                        {calculationDetails.selectiveTax > 0 && (
                          <TableRow>
                            <TableCell>Selective Consumption Tax</TableCell>
                            <TableCell className="text-right">${calculationDetails.selectiveTax.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                        {calculationDetails.salesTax > 0 && (
                          <TableRow>
                            <TableCell>Sales Tax / VAT</TableCell>
                            <TableCell className="text-right">${calculationDetails.salesTax.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                        {calculationDetails.environmentalTax > 0 && (
                          <TableRow>
                            <TableCell>Environmental Tax</TableCell>
                            <TableCell className="text-right">${calculationDetails.environmentalTax.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                        {calculationDetails.registrationFee > 0 && (
                          <TableRow>
                            <TableCell>Registration Fee</TableCell>
                            <TableCell className="text-right">${calculationDetails.registrationFee.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                        {calculationDetails.otherFees > 0 && (
                          <TableRow>
                            <TableCell>Other Fees</TableCell>
                            <TableCell className="text-right">${calculationDetails.otherFees.toLocaleString()}</TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-bold border-t-2">
                          <TableCell>Total Import Cost</TableCell>
                          <TableCell className="text-right">${calculationDetails.totalImportCost.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {/* CAFTA Status */}
                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        CAFTA-DR Status
                      </h4>
                      {calculationDetails.caftaEligible ? (
                        <div className="space-y-1">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            ✅ This vehicle qualifies for CAFTA-DR benefits as a US-manufactured vehicle.
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💰 Estimated duty savings: ${calculationDetails.caftaSavings.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          ⚠️ This vehicle does not qualify for CAFTA-DR benefits. Standard import duties apply.
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
                    Enter vehicle information and select a destination country to see detailed import cost breakdown with CAFTA-DR treaty benefits.
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