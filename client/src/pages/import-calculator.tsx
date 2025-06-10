import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calculator, ArrowRight, DollarSign, AlertTriangle, Info, Clipboard, 
  RefreshCw, Share2, Download, BarChart4, FileText, Truck, Ship, 
  Moon, Sun, Menu, X, Save, History, Zap, TrendingUp, Globe,
  CheckCircle, Shield, Star, Target, PieChart
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ImportCalculator({ vehicle }: DutyTaxCalculatorTabProps) {
  // Core calculation state
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
  
  // Premium UX state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [activeInputField, setActiveInputField] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
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

  // Check CAFTA-DR eligibility based on VIN
  const isNorthAmericanOrigin = (vin: string): boolean => {
    if (!vin || vin.length !== 17) return false;
    const firstChar = vin.charAt(0).toUpperCase();
    // CAFTA-DR eligible: ONLY USA (VIN 1,4,5)
    // Canada (VIN 2) and Mexico (VIN 3) are NOT CAFTA-DR eligible
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
    
    let dutyTax = 0;
    let selectiveTax = 0;
    let salesTax = 0;
    let environmentalTax = 0;
    let registrationFee = 0;
    let otherFees = 0;
    
    // Honduras uses accumulative tax calculation
    if (selectedCountry === 'honduras') {
      let accumulatedValue = cifValue;
      
      // Calculate duty tax
      if (rules.duty !== undefined) {
        dutyTax = cifValue * rules.duty;
        accumulatedValue += dutyTax;
      }
      
      // Selective consumption tax with brackets (applied to CIF)
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
        
        const applicableRate = applyBracketTax(cifValue, rules.selectiveTaxBrackets);
        selectiveTax = cifValue * applicableRate;
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
      
      // Sales tax (applied to accumulated value including CIF + duty + selective tax)
      if (rules.salesTax) {
        salesTax = accumulatedValue * rules.salesTax;
        accumulatedValue += salesTax;
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
    }
    
    // All other countries use standard tax calculation (taxes applied to base CIF value)
    else {
      // Calculate duty tax based on country rules
      if (rules.duty !== undefined) {
        dutyTax = cifValue * rules.duty;
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
      }
      
      // Fixed environmental tax
      if (rules.environmentalTax) {
        environmentalTax = cifValue * rules.environmentalTax;
      }
      
      // Simple selective tax (Nicaragua)
      if (rules.selectiveTax) {
        selectiveTax = cifValue * rules.selectiveTax;
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
      }
      
      // Fixed registration fee
      if (rules.firstRegistrationFee) {
        registrationFee = rules.firstRegistrationFee;
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
      }
      
      // Luxury tax (Dominican Republic)
      if (rules.luxuryTax) {
        const luxuryTax = cifValue * rules.luxuryTax;
        selectiveTax += luxuryTax;
      }
      
      // Sales tax (applied to CIF + duties for standard calculation)
      if (rules.salesTax) {
        const taxableBase = cifValue + dutyTax + selectiveTax;
        salesTax = taxableBase * rules.salesTax;
      }
      
      // GST (for Belize)
      if (rules.gst) {
        const taxableBase = cifValue + dutyTax + selectiveTax + environmentalTax;
        salesTax = taxableBase * rules.gst;
      }
      
      // Flat tax for low value vehicles (Panama)
      if (rules.flatTaxLowValue && cifValue <= 8000) {
        const flatTax = rules.flatTaxLowValue;
        selectiveTax += flatTax;
      }
      
      // Other fees
      if (rules.otherFees) {
        otherFees = cifValue * rules.otherFees;
      }
      
      const totalTaxes = dutyTax + selectiveTax + salesTax + environmentalTax + registrationFee + otherFees;
      
      return {
        cifValue,
        dutyTax,
        selectiveTax,
        salesTax,
        environmentalTax,
        registrationFee,
        otherFees,
        totalTaxAmount: totalTaxes,
        totalImportCost: cifValue + totalTaxes,
        taxPercentage: ((totalTaxes) / cifValue * 100).toFixed(1),
        caftaEligible: isNorthAmerican,
        caftaSavings: isNorthAmerican ? (cifValue * (countryRules.other_origin.duty || 0.15)) : 0
      };
    }
  };

  useEffect(() => {
    const calculation = calculateTaxes();
    setCalculationDetails(calculation);
  }, [vehiclePrice, freight, insurance, selectedCountry, engineSize, isCaftaEligible, vinNumber]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      {/* Premium Header with Gradient */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <motion.div 
              className="flex items-center gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Calculator className="h-9 w-9 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  CAFTA Import Calculator
                </h1>
                <p className="text-blue-100 text-lg max-w-md">
                  Professional duty calculation for Central American markets with real-time CAFTA-DR benefits
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    <Shield className="h-3 w-3 mr-1" />
                    2025 Treaty Rates
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    <Globe className="h-3 w-3 mr-1" />
                    8 Countries
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Right: Actions */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-white hover:bg-white/10 transition-colors"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="text-white hover:bg-white/10 transition-colors"
              >
                <PieChart className="h-4 w-4 mr-2" />
                Compare
              </Button>
              
              <Separator orientation="vertical" className="h-6 bg-white/20" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-white hover:bg-white/10 transition-colors"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-white hover:bg-white/10 transition-colors lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
          
          {/* Auto-save indicator */}
          <AnimatePresence>
            {autoSaveEnabled && lastSaved && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 right-6 flex items-center gap-2 text-sm text-blue-200"
              >
                <CheckCircle className="h-4 w-4" />
                Auto-saved {lastSaved.toLocaleTimeString()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-slate-800/30 min-h-screen pt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Premium Input Section */}
            <motion.div 
              className="xl:col-span-5 space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* VIN Input Card */}
              <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      Vehicle Identification
                    </CardTitle>
                    {vehicle && !dataAutoPopulated && (
                      <Button 
                        onClick={autoPopulateFromVehicle}
                        variant="outline" 
                        size="sm"
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Auto-fill
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
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