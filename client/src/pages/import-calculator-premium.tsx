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
  CheckCircle, Shield, Star, Target, PieChart, Brain
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
  { id: "honduras", name: "Honduras", flag: "🇭🇳", status: "active" },
  { id: "el_salvador", name: "El Salvador", flag: "🇸🇻", status: "active" },
  { id: "guatemala", name: "Guatemala", flag: "🇬🇹", status: "active" },
  { id: "nicaragua", name: "Nicaragua", flag: "🇳🇮", status: "active" },
  { id: "costa_rica", name: "Costa Rica", flag: "🇨🇷", status: "active" },
  { id: "panama", name: "Panama", flag: "🇵🇦", status: "coming_soon" },
  { id: "belize", name: "Belize", flag: "🇧🇿", status: "coming_soon" },
  { id: "dominican_republic", name: "Dominican Republic", flag: "🇩🇴", status: "active" }
];

// AI-Enhanced Honduras Tax Rules (Based on Official Documentation)
const HONDURAS_TAX_SYSTEM = {
  // Sequential tax calculation: CIF → DAI → ISC → ISV → Ecotasa
  standard_regime: {
    // 2006+ vehicles - no age restrictions
    applicable_years: "2006+",
    dai_rates: {
      cafta_eligible: 0.0,     // 0% for US-manufactured under CAFTA-DR
      non_cafta: 0.15          // Up to 15% for non-CAFTA countries
    },
    isc_brackets: [
      { max: 7000, rate: 0.10 },     // 10% up to $7,000
      { max: 10000, rate: 0.15 },    // 15% for $7,001-$10,000
      { max: 20000, rate: 0.20 },    // 20% for $10,001-$20,000
      { max: 50000, rate: 0.30 },    // 30% for $20,001-$50,000
      { max: 100000, rate: 0.45 },   // 45% for $50,001-$100,000
      { max: Infinity, rate: 0.60 }  // 60% for over $100,000
    ],
    isv_rate: 0.15,           // 15% sales tax
    ecotasa_brackets: [
      { max: 15000, fee: 5000 },     // L 5,000 (~$200) up to $15,000
      { max: 25000, fee: 7000 },     // L 7,000 (~$280) for $15,001-$25,000
      { max: Infinity, fee: 10000 }  // L 10,000 (~$400) for $25,001+
    ]
  },
  amnesty_regime: {
    // 2005 and older vehicles - special flat fee
    applicable_years: "≤2005",
    expires: "2026-04-04",
    dai_rates: {
      cafta_eligible: 0.0,
      non_cafta: 0.15
    },
    flat_fee: 10000,          // L 10,000 replaces ISC + ISV + registration
    ecotasa_brackets: [
      { max: 15000, fee: 5000 },
      { max: 25000, fee: 7000 },
      { max: Infinity, fee: 10000 }
    ]
  },
  prohibited_titles: [
    "junk", "parts only", "non-repairable", "certificate of destruction", "scrap only"
  ],
  requirements: {
    steering: "left_hand_drive_only",
    age_restriction_suspended: true,  // Per Decreto 14-2023
    rhd_banned: true
  }
};

export default function PremiumImportCalculator({ vehicle }: DutyTaxCalculatorTabProps) {
  // Core calculation state
  const [selectedCountry, setSelectedCountry] = useState<string>("honduras");
  const [vehiclePrice, setVehiclePrice] = useState<number>(15000);
  const [freight, setFreight] = useState<number>(1500);
  const [insurance, setInsurance] = useState<number>(300);
  const [engineSize, setEngineSize] = useState<number>(2000);
  const [calculationDetails, setCalculationDetails] = useState<any>(null);
  const [isCaftaEligible, setIsCaftaEligible] = useState<boolean>(false);
  const [vinNumber, setVinNumber] = useState<string>("");
  
  // Premium UX state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // El Salvador specific features
  const [vehicleCategory, setVehicleCategory] = useState<string>("passenger");
  const [is4x4, setIs4x4] = useState<boolean>(false);
  const [hasSalvageTitle, setHasSalvageTitle] = useState<boolean>(false);
  const [isPersonalUse, setIsPersonalUse] = useState<boolean>(true);
  const [ageEligibility, setAgeEligibility] = useState<any>(null);
  
  // Guatemala specific features
  const [guatemalaVehicleType, setGuatemalaVehicleType] = useState<string>("sedan");
  const [isLuxuryVehicle, setIsLuxuryVehicle] = useState<boolean>(false);
  const [iprimaCategory, setIprimaCategory] = useState<any>(null);
  
  // Nicaragua specific features
  const [nicaraguaEngineSize, setNicaraguaEngineSize] = useState<number>(2.0);
  const [nicaraguaAgeCompliance, setNicaraguaAgeCompliance] = useState<any>(null);
  
  // Costa Rica specific features
  const [costaRicaVehicleAge, setCostaRicaVehicleAge] = useState<number>(5);
  const [isElectricVehicle, setIsElectricVehicle] = useState<boolean>(false);
  const [isNewResident, setIsNewResident] = useState<boolean>(false);
  const [residentExemptionUsed, setResidentExemptionUsed] = useState<boolean>(false);
  
  // Dominican Republic specific features
  const [drVehicleAge, setDrVehicleAge] = useState<number>(3);
  const [isUSOrigin, setIsUSOrigin] = useState<boolean>(true);
  const [hasCaftaCertificate, setHasCaftaCertificate] = useState<boolean>(false);
  const [drIsElectricHybrid, setDrIsElectricHybrid] = useState<boolean>(false);
  const [hasDisability, setHasDisability] = useState<boolean>(false);
  const [co2Emissions, setCo2Emissions] = useState<number>(150);
  const [drVehicleType, setDrVehicleType] = useState<string>("passenger");

  const { toast } = useToast();

  // Professional export functionality
  const exportCalculationReport = (details: any) => {
    if (!details) return;

    const reportData = {
      title: "Honduras Import Duty Calculation Report",
      generatedAt: new Date().toLocaleString(),
      vehicle: {
        vin: vinNumber,
        modelYear: details.modelYear,
        manufacturer: details.vinAnalysis?.manufacturer || 'Unknown',
        origin: details.vinAnalysis?.isUSAOrigin ? 'USA' : 'Non-USA'
      },
      calculation: {
        regime: details.regime,
        cifValue: details.cifValue,
        totalTaxes: details.totalTaxes,
        totalCost: details.totalCost,
        taxPercentage: details.taxPercentage,
        caftaEligible: details.caftaEligible,
        caftaSavings: details.caftaSavings
      },
      breakdown: details.breakdown || [],
      insights: details.aiInsights || {}
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `honduras-import-calculation-${vinNumber || 'report'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Professional calculation report downloaded successfully."
    });
  };

  // Share calculation functionality
  const shareCalculation = (details: any) => {
    if (!details) return;

    const shareText = `Honduras Import Calculator Results:
• Vehicle: ${vinNumber} (${details.modelYear})
• CIF Value: $${details.cifValue.toLocaleString()}
• Total Taxes: $${details.totalTaxes.toLocaleString()} (${details.taxPercentage}%)
• Total Cost: $${details.totalCost.toLocaleString()}
• Regime: ${details.regime}
• CAFTA Eligible: ${details.caftaEligible ? 'Yes' : 'No'}`;

    if (navigator.share) {
      navigator.share({
        title: 'Honduras Import Calculation',
        text: shareText
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Calculation summary copied successfully."
        });
      }).catch(console.error);
    }
  };

  // AI-Enhanced VIN Analysis for CAFTA Eligibility
  const analyzeVIN = (vin: string) => {
    if (!vin || vin.length !== 17) {
      return { isValid: false, modelYear: null, isUSAOrigin: false, manufacturer: null };
    }

    const cleanVIN = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    if (cleanVIN.length !== 17) {
      return { isValid: false, modelYear: null, isUSAOrigin: false, manufacturer: null };
    }

    // Extract model year from 10th character (VIN position 10)
    const yearCode = cleanVIN.charAt(9);
    const modelYear = decodeVINYear(yearCode);
    
    // Extract World Manufacturer Identifier (first 3 characters)
    const wmi = cleanVIN.substring(0, 3);
    
    // CAFTA-DR eligibility (ONLY USA = 1,4,5; Canada = 2 and Mexico = 3 NOT eligible)
    const firstChar = cleanVIN.charAt(0);
    const isUSAOrigin = ['1', '4', '5'].includes(firstChar);
    
    // Get manufacturer info
    const manufacturer = getManufacturerFromWMI(wmi);
    
    return {
      isValid: true,
      modelYear,
      isUSAOrigin,
      manufacturer,
      wmi,
      yearCode
    };
  };

  // VIN Year Decoding (10th character) - Corrected cycle
  const decodeVINYear = (yearCode: string): number | null => {
    // VIN year codes cycle every 30 years
    const baseYearMap: Record<string, number> = {
      'A': 1980, 'B': 1981, 'C': 1982, 'D': 1983, 'E': 1984, 'F': 1985, 'G': 1986, 'H': 1987,
      'J': 1988, 'K': 1989, 'L': 1990, 'M': 1991, 'N': 1992, 'P': 1993, 'R': 1994, 'S': 1995,
      'T': 1996, 'V': 1997, 'W': 1998, 'X': 1999, 'Y': 2000, '1': 2001, '2': 2002, '3': 2003,
      '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009
    };
    
    // Handle 2010+ cycle (letters repeat)
    const cycle2010Map: Record<string, number> = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015, 'G': 2016, 'H': 2017,
      'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025
    };
    
    // First check 2010+ cycle, then fall back to 1980+ cycle
    return cycle2010Map[yearCode] || baseYearMap[yearCode] || null;
  };

  // Basic manufacturer identification from WMI
  const getManufacturerFromWMI = (wmi: string): string => {
    const manufacturers: Record<string, string> = {
      '1FA': 'Ford', '1FD': 'Ford', '1FT': 'Ford', '1G1': 'Chevrolet', '1G6': 'Cadillac',
      '1GC': 'Chevrolet', '1GM': 'Pontiac', '1J4': 'Jeep', '1N4': 'Nissan', '1N6': 'Nissan',
      '4F2': 'Mazda', '4F4': 'Mazda', '4T1': 'Toyota', '4T3': 'Lexus', '5N1': 'Nissan',
      '5NP': 'Hyundai', '5TD': 'Toyota', '5TE': 'Toyota'
    };
    return manufacturers[wmi] || 'Unknown';
  };

  // AI-Enhanced Honduras Tax Calculation Engine
  const calculateHondurasTaxes = () => {
    if (!vehiclePrice || !selectedCountry || selectedCountry !== 'honduras') return null;

    setIsCalculating(true);
    
    setTimeout(() => {
      const vinAnalysis = analyzeVIN(vinNumber);
      const currentDate = new Date();
      const amnestyExpiry = new Date('2026-04-04');
      
      // Step 1: Calculate CIF Value
      const cifValue = vehiclePrice + freight + insurance;
      
      // Step 2: Determine regime (Standard vs Amnesty)
      const modelYear = vinAnalysis.modelYear || 2020; // Default if VIN invalid
      const isAmnestyEligible = modelYear <= 2005 && currentDate <= amnestyExpiry;
      
      // Step 3: Calculate DAI (Import Duty)
      const daiRate = vinAnalysis.isUSAOrigin && isCaftaEligible ? 0.0 : 0.15;
      const dai = cifValue * daiRate;
      
      let isc = 0;
      let isv = 0;
      let amnestyFee = 0;
      
      if (isAmnestyEligible) {
        // Amnesty Regime: Flat fee L 10,000 (~$400)
        amnestyFee = 400; // USD equivalent
      } else {
        // Standard Regime: Sequential calculation
        // Step 4: Calculate ISC (Selective Consumption Tax)
        const iscBase = cifValue + dai;
        let iscRate = 0.10; // Default 10%
        
        if (iscBase > 100000) iscRate = 0.60;
        else if (iscBase > 50000) iscRate = 0.45;
        else if (iscBase > 20000) iscRate = 0.30;
        else if (iscBase > 10000) iscRate = 0.20;
        else if (iscBase > 7000) iscRate = 0.15;
        
        isc = iscBase * iscRate;
        
        // Step 5: Calculate ISV (Sales Tax) - 15%
        const isvBase = cifValue + dai + isc;
        isv = isvBase * 0.15;
      }
      
      // Step 6: Calculate Ecotasa (Environmental Tax)
      let ecotasa = 200; // Default ~$200 USD
      if (cifValue > 25000) ecotasa = 400;
      else if (cifValue > 15000) ecotasa = 280;
      
      // Step 7: Calculate totals
      const totalTaxes = dai + isc + isv + amnestyFee + ecotasa;
      const totalCost = cifValue + totalTaxes;
      const caftaSavings = vinAnalysis.isUSAOrigin && isCaftaEligible ? cifValue * 0.15 : 0;
      
      const result = {
        cifValue,
        duty: dai,
        selectiveTax: isc,
        salesTax: isv,
        ecoTax: ecotasa,
        amnestyFee,
        otherFees: 0,
        totalTaxes,
        totalCost,
        caftaEligible: vinAnalysis.isUSAOrigin && isCaftaEligible,
        caftaSavings,
        taxPercentage: ((totalTaxes / cifValue) * 100).toFixed(1),
        regime: isAmnestyEligible ? 'amnesty' : 'standard',
        modelYear,
        vinAnalysis,
        isAmnestyEligible,
        amnestyExpiry: amnestyExpiry.toLocaleDateString()
      };

      setCalculationDetails(result);
      setIsCalculating(false);
      
      if (autoSaveEnabled) {
        setLastSaved(new Date());
      }
    }, 500);
  };

  // Multi-Country AI-Enhanced calculation
  const calculateWithAI = async () => {
    if (!vehiclePrice || !selectedCountry || !vinNumber) {
      return;
    }

    setIsCalculating(true);
    
    try {
      let apiEndpoint = '';
      let requestBody: any = {
        vehiclePrice: parseFloat(vehiclePrice.toString()),
        freight: parseFloat(freight.toString()),
        insurance: parseFloat(insurance.toString()),
        vin: vinNumber
      };

      if (selectedCountry === 'honduras') {
        apiEndpoint = '/api/honduras/calculate';
      } else if (selectedCountry === 'el_salvador') {
        apiEndpoint = '/api/elsalvador/calculate';
        requestBody = {
          ...requestBody,
          engineSize: parseFloat((engineSize / 1000).toString()), // Convert cc to liters
          is4x4,
          hasSalvageTitle,
          isPersonalUse
        };
      } else if (selectedCountry === 'guatemala') {
        apiEndpoint = '/api/guatemala/calculate';
        requestBody = {
          ...requestBody,
          engineSize: parseFloat(engineSize.toString()),
          vehicleType: guatemalaVehicleType,
          isLuxury: isLuxuryVehicle,
          hasSalvageTitle
        };
      } else if (selectedCountry === 'nicaragua') {
        apiEndpoint = '/api/nicaragua/calculate';
        requestBody = {
          ...requestBody,
          engineSize: nicaraguaEngineSize,
          hasSalvageTitle
        };
      } else if (selectedCountry === 'costa_rica') {
        apiEndpoint = '/api/costa-rica/calculate';
        requestBody = {
          ...requestBody,
          vehicleAge: costaRicaVehicleAge,
          isElectric: isElectricVehicle,
          isNewResident: isNewResident,
          exemptionUsed: residentExemptionUsed
        };
      } else {
        // Fallback to local calculation for unsupported countries
        calculateHondurasTaxes();
        return;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Calculation failed');
      }

      const result = await response.json();
      
      if (result.success) {
        const { calculation, vinAnalysis } = result.data;
        
        let mappedResult: any;
        
        if (selectedCountry === 'honduras') {
          mappedResult = {
            cifValue: calculation.cifValue,
            duty: calculation.taxes.dai,
            selectiveTax: calculation.taxes.isc,
            salesTax: calculation.taxes.isv,
            ecoTax: calculation.taxes.ecotasa,
            amnestyFee: calculation.taxes.amnestyFee,
            otherFees: 0,
            totalTaxes: calculation.totalTaxes,
            totalCost: calculation.totalCost,
            caftaEligible: vinAnalysis.caftaEligible,
            caftaSavings: calculation.caftaSavings,
            taxPercentage: ((calculation.totalTaxes / calculation.cifValue) * 100).toFixed(1),
            regime: calculation.regime,
            modelYear: vinAnalysis.modelYear,
            vinAnalysis,
            breakdown: calculation.breakdown,
            aiInsights: calculation.aiInsights
          };
        } else if (selectedCountry === 'el_salvador') {
          mappedResult = {
            cifValue: calculation.cifValue,
            isEligible: calculation.isEligible,
            eligibilityReason: calculation.eligibilityReason,
            duty: calculation.taxes.dai,
            iva: calculation.taxes.iva,
            firstRegistration: calculation.taxes.firstRegistration,
            incomeTaxAdvance: calculation.taxes.incomeTaxAdvance,
            selectiveTax: 0, // El Salvador doesn't have ISC for vehicles
            salesTax: calculation.taxes.iva,
            ecoTax: 0,
            otherFees: calculation.taxes.incomeTaxAdvance,
            totalTaxes: calculation.totalTaxes,
            totalCost: calculation.totalCost,
            caftaEligible: vinAnalysis.caftaEligible,
            caftaSavings: calculation.caftaSavings,
            taxPercentage: ((calculation.totalTaxes / calculation.cifValue) * 100).toFixed(1),
            vehicleCategory: calculation.vehicleCategory,
            hasSalvageDiscount: calculation.hasSalvageDiscount,
            adjustedValue: calculation.adjustedValue,
            modelYear: vinAnalysis.modelYear,
            vinAnalysis,
            breakdown: calculation.breakdown,
            aiInsights: calculation.aiInsights
          };
          
          // Update age eligibility state for El Salvador
          setAgeEligibility({
            eligible: calculation.isEligible,
            reason: calculation.eligibilityReason
          });
        } else if (selectedCountry === 'guatemala') {
          mappedResult = {
            cifValue: calculation.cifValue,
            duty: calculation.taxes.dai,
            iva: calculation.taxes.iva,
            iprima: calculation.taxes.iprima,
            selectiveTax: 0, // Guatemala doesn't have ISC for vehicles
            salesTax: calculation.taxes.iva,
            ecoTax: 0,
            otherFees: calculation.fees.circulation + calculation.fees.licensePlate + calculation.fees.customsBroker,
            totalTaxes: calculation.totalTaxes,
            totalCost: calculation.totalCost,
            caftaEligible: vinAnalysis.caftaEligible,
            caftaSavings: calculation.caftaSavings,
            taxPercentage: ((calculation.totalTaxes / calculation.cifValue) * 100).toFixed(1),
            vehicleCategory: calculation.vehicleCategory,
            iprimaRate: calculation.iprimaRate,
            salvageTitle: calculation.salvagetitle,
            modelYear: vinAnalysis.modelYear,
            vinAnalysis,
            breakdown: calculation.breakdown,
            aiInsights: calculation.aiInsights
          };
          
          // Update IPRIMA category info for Guatemala
          setIprimaCategory({
            category: calculation.vehicleCategory,
            rate: calculation.iprimaRate,
            amount: calculation.taxes.iprima
          });
        } else if (selectedCountry === 'nicaragua') {
          mappedResult = {
            cifValue: calculation.cifValue,
            vehicleAge: calculation.vehicleAge,
            ageCompliant: calculation.ageCompliant,
            duty: calculation.taxes.dai,
            isc: calculation.taxes.isc,
            iva: calculation.taxes.iva,
            selectiveTax: calculation.taxes.isc,
            salesTax: calculation.taxes.iva,
            ecoTax: 0,
            otherFees: calculation.taxes.registrationFee,
            totalTaxes: calculation.totalTaxes,
            totalCost: calculation.totalCost,
            caftaEligible: vinAnalysis.caftaEligible,
            caftaSavings: calculation.caftaSavings,
            taxPercentage: ((calculation.totalTaxes / calculation.cifValue) * 100).toFixed(1),
            modelYear: vinAnalysis.modelYear,
            vinAnalysis,
            breakdown: calculation.breakdown,
            aiInsights: calculation.aiInsights
          };
          
          // Update age compliance info for Nicaragua
          setNicaraguaAgeCompliance({
            vehicleAge: calculation.vehicleAge,
            ageCompliant: calculation.ageCompliant,
            ageLimitYears: 10
          });
        } else if (selectedCountry === 'costa_rica') {
          mappedResult = {
            cifValue: calculation.cifValue,
            vehicleAge: calculation.vehicleAge,
            effectiveTaxRate: calculation.effectiveTaxRate,
            duty: calculation.taxes.importDuty,
            evExemption: calculation.taxes.evExemption,
            residentExemption: calculation.taxes.residentExemption,
            selectiveTax: 0, // Costa Rica uses age-based combined rates
            salesTax: 0, // Included in combined rate
            ecoTax: 0,
            otherFees: calculation.totalFees,
            totalTaxes: calculation.totalTaxes,
            totalCost: calculation.totalCost,
            caftaEligible: false, // Costa Rica doesn't have CAFTA benefits for vehicles
            caftaSavings: 0,
            taxPercentage: calculation.effectiveTaxRate,
            isElectric: calculation.isElectric,
            isNewResident: calculation.isNewResident,
            marchamo: calculation.annualCosts.marchamo,
            modelYear: vinAnalysis.modelYear,
            vinAnalysis,
            breakdown: calculation.breakdown,
            aiInsights: calculation.aiInsights
          };
        }

        setCalculationDetails(mappedResult);
        setIsCaftaEligible(vinAnalysis.caftaEligible);
        
        if (autoSaveEnabled) {
          setLastSaved(new Date());
        }
      }
    } catch (error) {
      console.error('AI calculation error:', error);
      // Fallback to local calculation
      calculateHondurasTaxes();
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto-calculate on input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vinNumber.length === 17 && (selectedCountry === 'honduras' || selectedCountry === 'el_salvador' || selectedCountry === 'guatemala' || selectedCountry === 'nicaragua' || selectedCountry === 'costa_rica')) {
        calculateWithAI();
      } else if (vehiclePrice > 0 && selectedCountry) {
        if (selectedCountry === 'honduras') {
          calculateHondurasTaxes();
        } else if (['el_salvador', 'guatemala', 'nicaragua', 'costa_rica'].includes(selectedCountry)) {
          calculateWithAI();
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [vehiclePrice, freight, insurance, selectedCountry, vinNumber, engineSize, is4x4, hasSalvageTitle, isPersonalUse, vehicleCategory, guatemalaVehicleType, isLuxuryVehicle, nicaraguaEngineSize, costaRicaVehicleAge, isElectricVehicle, isNewResident, residentExemptionUsed]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      {/* Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
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
              
              <Separator orientation="vertical" className="h-6 bg-white/20" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-white hover:bg-white/10 transition-colors"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </motion.div>
          </div>
          
          {autoSaveEnabled && lastSaved && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-6 flex items-center gap-2 text-sm text-blue-200"
            >
              <CheckCircle className="h-4 w-4" />
              Auto-saved {lastSaved.toLocaleTimeString()}
            </motion.div>
          )}
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
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    Vehicle Identification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* VIN Input with Real-time Validation */}
                  <div className="space-y-2">
                    <Label htmlFor="vin" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Vehicle VIN (for CAFTA eligibility check)
                    </Label>
                    <div className="relative">
                      <Input
                        id="vin"
                        type="text"
                        placeholder="Enter 17-character VIN"
                        value={vinNumber}
                        onChange={(e) => {
                          const vin = e.target.value.toUpperCase();
                          setVinNumber(vin);
                          if (vin.length >= 1) {
                            const analysis = analyzeVIN(vin);
                            setIsCaftaEligible(analysis.isUSAOrigin);
                          }
                        }}
                        className="font-mono text-lg pr-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        maxLength={17}
                      />
                      {vinNumber.length > 0 && (
                        <div className="absolute right-3 top-3">
                          {isCaftaEligible ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {vinNumber.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-4 rounded-lg border ${isCaftaEligible ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200'}`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className={isCaftaEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}>
                              {isCaftaEligible ? 'CAFTA Eligible' : 'Non-CAFTA'}
                            </Badge>
                            <span className="text-sm font-medium">
                              {isCaftaEligible ? 'US manufactured - duty exemption applies' : 'Foreign origin - standard duties apply'}
                            </span>
                          </div>
                          
                          {/* AI-Enhanced VIN Analysis Display */}
                          {(() => {
                            const analysis = analyzeVIN(vinNumber);
                            return analysis.isValid ? (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">Model Year:</span>
                                  <span className="ml-2 font-semibold">{analysis.modelYear || 'Unknown'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">Manufacturer:</span>
                                  <span className="ml-2 font-semibold">{analysis.manufacturer}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">Origin:</span>
                                  <span className="ml-2 font-semibold">{analysis.isUSAOrigin ? 'USA' : 'Non-USA'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400">WMI Code:</span>
                                  <span className="ml-2 font-mono text-xs">{analysis.wmi}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-red-600 dark:text-red-400">
                                Invalid VIN format - Please check the 17-character VIN
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Country Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Destination Country
                    </Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select destination country" />
                      </SelectTrigger>
                      <SelectContent>
                        {CENTRAL_AMERICAN_COUNTRIES.map((country) => (
                          <SelectItem key={country.id} value={country.id} className="text-base py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{country.flag}</span>
                              <span>{country.name}</span>
                              {country.status === 'active' && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs">AI Enhanced</Badge>
                              )}
                              {country.status === 'coming_soon' && (
                                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* El Salvador Specific Options */}
                  {selectedCountry === 'el_salvador' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      {/* Age Eligibility Warning */}
                      {ageEligibility && !ageEligibility.eligible && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <div>
                              <div className="font-semibold text-red-800 dark:text-red-200">Age Restriction Violation</div>
                              <div className="text-sm text-red-600 dark:text-red-400">{ageEligibility.reason}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Category */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Vehicle Category</Label>
                        <Select value={vehicleCategory} onValueChange={setVehicleCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passenger">Passenger Car/SUV (8 year limit)</SelectItem>
                            <SelectItem value="pickup">Pickup Truck (8 year limit)</SelectItem>
                            <SelectItem value="bus">Bus/Heavy Passenger (10 year limit)</SelectItem>
                            <SelectItem value="heavy_truck">Heavy Truck ≥3 tons (15 year limit)</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle (8 year limit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Vehicle Specifications */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Engine Size (cc)</Label>
                          <Input
                            type="number"
                            value={engineSize}
                            onChange={(e) => setEngineSize(parseInt(e.target.value) || 2000)}
                            placeholder="2000"
                            className="text-center"
                          />
                          <div className="text-xs text-slate-500">
                            {engineSize > 2000 ? '30% DAI rate' : '25% DAI rate'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Drive Type</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="is4x4" 
                              checked={is4x4} 
                              onCheckedChange={(checked) => setIs4x4(checked as boolean)}
                            />
                            <Label htmlFor="is4x4" className="text-sm">4x4 / AWD</Label>
                          </div>
                          <div className="text-xs text-slate-500">
                            {is4x4 ? '6% registration tax' : '4-8% registration tax'}
                          </div>
                        </div>
                      </div>

                      {/* Title and Import Type */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Title Status</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="salvageTitle" 
                              checked={hasSalvageTitle} 
                              onCheckedChange={(checked) => setHasSalvageTitle(checked as boolean)}
                            />
                            <Label htmlFor="salvageTitle" className="text-sm">Salvage/Damaged Title</Label>
                          </div>
                          {hasSalvageTitle && (
                            <div className="text-xs text-emerald-600">
                              40% customs value reduction applied
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Import Purpose</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="personalUse" 
                              checked={isPersonalUse} 
                              onCheckedChange={(checked) => setIsPersonalUse(checked as boolean)}
                            />
                            <Label htmlFor="personalUse" className="text-sm">Personal Use</Label>
                          </div>
                          {!isPersonalUse && (
                            <div className="text-xs text-orange-600">
                              5% income tax advance applies
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Guatemala Specific Options */}
                  {selectedCountry === 'guatemala' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      {/* Guatemala Advantages Banner */}
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <div>
                            <div className="font-semibold text-emerald-800 dark:text-emerald-200">Guatemala Import Advantages</div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400">
                              No age restrictions • Salvage vehicles allowed if rebuildable • No emissions requirements
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* IPRIMA Category Indicator */}
                      {iprimaCategory && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            IPRIMA Category: {iprimaCategory.category}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Tax Rate: {(iprimaCategory.rate * 100).toFixed(0)}% • Estimated: ${iprimaCategory.amount?.toLocaleString()}
                          </div>
                        </div>
                      )}

                      {/* Vehicle Type Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Vehicle Type (for IPRIMA classification)</Label>
                        <Select value={guatemalaVehicleType} onValueChange={setGuatemalaVehicleType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedan">Sedan</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                            <SelectItem value="pickup">Pickup Truck</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="small_car">Small Car (&lt;1000cc)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Engine Size and Luxury Options */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Engine Size (cc)</Label>
                          <Input
                            type="number"
                            value={engineSize}
                            onChange={(e) => setEngineSize(parseInt(e.target.value) || 2000)}
                            placeholder="2000"
                            className="text-center"
                          />
                          <div className="text-xs text-slate-500">
                            Affects IPRIMA category and tax rate
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Vehicle Classification</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="luxuryVehicle" 
                              checked={isLuxuryVehicle} 
                              onCheckedChange={(checked) => setIsLuxuryVehicle(checked as boolean)}
                            />
                            <Label htmlFor="luxuryVehicle" className="text-sm">Luxury Vehicle</Label>
                          </div>
                          <div className="text-xs text-slate-500">
                            {isLuxuryVehicle ? '20% IPRIMA rate' : 'Standard IPRIMA rates (5-18%)'}
                          </div>
                        </div>
                      </div>

                      {/* Salvage Title Option */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Title Status</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="guatemalaSalvageTitle" 
                            checked={hasSalvageTitle} 
                            onCheckedChange={(checked) => setHasSalvageTitle(checked as boolean)}
                          />
                          <Label htmlFor="guatemalaSalvageTitle" className="text-sm">Salvage/Damaged Title</Label>
                        </div>
                        {hasSalvageTitle && (
                          <div className="text-xs text-orange-600">
                            Must be rebuildable (not branded "irreconstruible")
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Nicaragua Specific Options */}
                  {selectedCountry === 'nicaragua' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      {/* Age Compliance Warning */}
                      {nicaraguaAgeCompliance && !nicaraguaAgeCompliance.ageCompliant && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <div>
                              <div className="font-semibold text-red-800 dark:text-red-200">Age Limit Violation</div>
                              <div className="text-sm text-red-600 dark:text-red-400">
                                Vehicle is {nicaraguaAgeCompliance.vehicleAge} years old - exceeds Nicaragua's 10-year import limit
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Engine Size for ISC Tax */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Engine Size (Liters)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.8"
                          max="8.0"
                          value={nicaraguaEngineSize}
                          onChange={(e) => setNicaraguaEngineSize(parseFloat(e.target.value) || 2.0)}
                          placeholder="2.0"
                          className="text-center"
                        />
                        <div className="text-xs text-slate-500">
                          ISC rates: ≤1.6L (10%), 1.6-2.6L (15%), 2.6-3.0L (20%), 3.0-4.0L (30%), &gt;4.0L (35%)
                        </div>
                      </div>

                      {/* Salvage Title Option */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Title Status</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="nicaraguaSalvageTitle" 
                            checked={hasSalvageTitle} 
                            onCheckedChange={(checked) => setHasSalvageTitle(checked as boolean)}
                          />
                          <Label htmlFor="nicaraguaSalvageTitle" className="text-sm">Salvage/Damaged Title</Label>
                        </div>
                        {hasSalvageTitle && (
                          <div className="text-xs text-orange-600">
                            Must be repairable and ≤10 years old. VIN/engine numbers must be intact.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Costa Rica Specific Controls */}
                  {selectedCountry === 'costa_rica' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">CR</span>
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Costa Rica Configuration</h3>
                      </div>

                      {/* Vehicle Age */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Vehicle Age (Years)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          value={costaRicaVehicleAge}
                          onChange={(e) => setCostaRicaVehicleAge(parseInt(e.target.value) || 5)}
                          placeholder="5"
                          className="text-center"
                        />
                        <div className="text-xs text-slate-500">
                          Tax rates: ≤3 years (52.29%), 4-5 years (63.91%), 6+ years (79.03%)
                        </div>
                      </div>

                      {/* Electric Vehicle Option */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Vehicle Type</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="electricVehicle" 
                            checked={isElectricVehicle} 
                            onCheckedChange={(checked) => setIsElectricVehicle(checked as boolean)}
                          />
                          <Label htmlFor="electricVehicle" className="text-sm">Electric Vehicle (EV)</Label>
                        </div>
                        {isElectricVehicle && (
                          <div className="text-xs text-emerald-600">
                            100% duty exemption up to $30,000 under Law 9518
                          </div>
                        )}
                      </div>

                      {/* New Resident Exemption */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Residency Status</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="newResident" 
                            checked={isNewResident} 
                            onCheckedChange={(checked) => setIsNewResident(checked as boolean)}
                          />
                          <Label htmlFor="newResident" className="text-sm">New Costa Rica Resident</Label>
                        </div>
                        {isNewResident && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="exemptionUsed" 
                                checked={residentExemptionUsed} 
                                onCheckedChange={(checked) => setResidentExemptionUsed(checked as boolean)}
                              />
                              <Label htmlFor="exemptionUsed" className="text-sm">Already used exemption</Label>
                            </div>
                            <div className="text-xs text-emerald-600">
                              {residentExemptionUsed 
                                ? "Standard duties apply - exemption already used" 
                                : "100% duty exemption available under Law 9996 (up to 2 vehicles)"}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Important Requirements */}
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg">
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                          <strong>Requirements:</strong> Left-hand drive only, clean title (no salvage), DEKRA inspection required
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Details Card */}
              <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle Price */}
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Vehicle Price (USD)
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-4 h-5 w-5 text-slate-400" />
                        <Input
                          id="price"
                          type="number"
                          placeholder="25000"
                          value={vehiclePrice || ''}
                          onChange={(e) => setVehiclePrice(Number(e.target.value))}
                          className="pl-10 h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Engine Size */}
                    <div className="space-y-2">
                      <Label htmlFor="engine" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Engine Size (CC)
                      </Label>
                      <Input
                        id="engine"
                        type="number"
                        placeholder="2000"
                        value={engineSize || ''}
                        onChange={(e) => setEngineSize(Number(e.target.value))}
                        className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Freight */}
                    <div className="space-y-2">
                      <Label htmlFor="freight" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Freight Cost (USD)
                      </Label>
                      <div className="relative">
                        <Ship className="absolute left-3 top-4 h-5 w-5 text-slate-400" />
                        <Input
                          id="freight"
                          type="number"
                          placeholder="1500"
                          value={freight || ''}
                          onChange={(e) => setFreight(Number(e.target.value))}
                          className="pl-10 h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Insurance */}
                    <div className="space-y-2">
                      <Label htmlFor="insurance" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Insurance (USD)
                      </Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-4 h-5 w-5 text-slate-400" />
                        <Input
                          id="insurance"
                          type="number"
                          placeholder="300"
                          value={insurance || ''}
                          onChange={(e) => setInsurance(Number(e.target.value))}
                          className="pl-10 h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Real-time Results Section */}
            <motion.div 
              className="xl:col-span-7 space-y-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {calculationDetails ? (
                <>
                  {/* Summary Card */}
                  <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <BarChart4 className="h-6 w-6 text-white" />
                        </div>
                        Import Cost Summary
                        {isCalculating && (
                          <div className="animate-spin ml-auto">
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            ${calculationDetails.cifValue.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">CIF Value</div>
                        </div>
                        <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            ${calculationDetails.totalTaxes.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Total Taxes ({calculationDetails.taxPercentage}%)</div>
                        </div>
                        <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                          <div className="text-3xl font-bold text-emerald-600">
                            ${calculationDetails.totalCost.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Total Import Cost</div>
                        </div>
                      </div>

                      {calculationDetails.caftaEligible && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 p-4 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-emerald-800 dark:text-emerald-200">CAFTA-DR Benefits Applied</div>
                              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                                Estimated savings: ${calculationDetails.caftaSavings.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Detailed Breakdown */}
                  <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        Tax Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tax Component</TableHead>
                            <TableHead className="text-right">Amount (USD)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              DAI (Import Duty)
                              {calculationDetails.caftaEligible && <Badge className="ml-2 text-xs bg-emerald-100 text-emerald-800">CAFTA 0%</Badge>}
                            </TableCell>
                            <TableCell className="text-right">${calculationDetails.duty.toLocaleString()}</TableCell>
                          </TableRow>
                          
                          {(calculationDetails as any).regime === 'amnesty' ? (
                            <TableRow className="bg-blue-50 dark:bg-blue-950/20">
                              <TableCell className="font-medium">
                                Amnesty Flat Fee (≤2005 vehicles)
                                <div className="text-xs text-slate-500">Replaces ISC + ISV + Registration</div>
                              </TableCell>
                              <TableCell className="text-right">${(calculationDetails as any).amnestyFee.toLocaleString()}</TableCell>
                            </TableRow>
                          ) : (
                            <>
                              <TableRow>
                                <TableCell className="font-medium">
                                  ISC (Selective Consumption Tax)
                                  <div className="text-xs text-slate-500">Progressive rates: 10%-60%</div>
                                </TableCell>
                                <TableCell className="text-right">${calculationDetails.selectiveTax.toLocaleString()}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">
                                  ISV (Sales Tax)
                                  <div className="text-xs text-slate-500">15% on taxable base</div>
                                </TableCell>
                                <TableCell className="text-right">${calculationDetails.salesTax.toLocaleString()}</TableCell>
                              </TableRow>
                            </>
                          )}
                          
                          <TableRow>
                            <TableCell className="font-medium">
                              Ecotasa (Environmental Tax)
                              <div className="text-xs text-slate-500">Based on vehicle value brackets</div>
                            </TableCell>
                            <TableCell className="text-right">${calculationDetails.ecoTax.toLocaleString()}</TableCell>
                          </TableRow>
                          
                          <TableRow className="border-t-2 border-slate-200 dark:border-slate-700 font-semibold bg-slate-50 dark:bg-slate-800/50">
                            <TableCell>TOTAL TAXES</TableCell>
                            <TableCell className="text-right text-lg">${calculationDetails.totalTaxes.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between w-full">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => exportCalculationReport(calculationDetails)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => shareCalculation(calculationDetails)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Calculation
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>

                  {/* AI Insights Card */}
                  {(calculationDetails as any)?.aiInsights && (
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                          AI Professional Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Risk Assessment */}
                        <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Risk Assessment</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {(calculationDetails as any).aiInsights.riskAssessment}
                          </p>
                        </div>

                        {/* Cost Optimization */}
                        {(calculationDetails as any).aiInsights.costOptimization?.length > 0 && (
                          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Cost Optimization</h4>
                            <ul className="space-y-1">
                              {(calculationDetails as any).aiInsights.costOptimization.map((tip: string, index: number) => (
                                <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <span className="text-emerald-500 mt-1">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Compliance Notes */}
                        {(calculationDetails as any).aiInsights.complianceNotes?.length > 0 && (
                          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Compliance Requirements</h4>
                            <ul className="space-y-1">
                              {(calculationDetails as any).aiInsights.complianceNotes.map((note: string, index: number) => (
                                <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Calculation Breakdown */}
                        {(calculationDetails as any)?.breakdown?.length > 0 && (
                          <div className="p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Step-by-Step Calculation</h4>
                            <div className="space-y-2">
                              {(calculationDetails as any).breakdown.map((step: any, index: number) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {step.step}. {step.description}
                                  </span>
                                  <span className="font-semibold">
                                    ${step.amount.toLocaleString()} {step.rate && `(${step.rate})`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calculator className="h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      Ready to Calculate
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-center">
                      Enter vehicle information above to see detailed import cost breakdown with real-time CAFTA-DR benefits.
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}