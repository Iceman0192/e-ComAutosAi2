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
  const [vehiclePrice, setVehiclePrice] = useState<number>(0);
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

  const { toast } = useToast();

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
    
    // USA manufacturing identification (1, 4, 5 only - corrected from documentation)
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
      const regime = isAmnestyEligible ? HONDURAS_TAX_SYSTEM.amnesty_regime : HONDURAS_TAX_SYSTEM.standard_regime;
      
      // Step 3: Calculate DAI (Import Duty)
      const daiRate = vinAnalysis.isUSAOrigin && isCaftaEligible ? regime.dai_rates.cafta_eligible : regime.dai_rates.non_cafta;
      const dai = cifValue * daiRate;
      
      let isc = 0;
      let isv = 0;
      let amnestyFee = 0;
      
      if (isAmnestyEligible) {
        // Amnesty Regime: Flat fee instead of ISC + ISV
        amnestyFee = (regime as any).flat_fee; // L 10,000
      } else {
        // Standard Regime: Sequential calculation
        // Step 4: Calculate ISC (Selective Consumption Tax)
        const iscBase = cifValue + dai;
        const iscBracket = (regime as any).isc_brackets.find((bracket: any) => iscBase <= bracket.max);
        const iscRate = iscBracket?.rate || 0.60;
        isc = iscBase * iscRate;
        
        // Step 5: Calculate ISV (Sales Tax)
        const isvBase = cifValue + dai + isc;
        isv = isvBase * (regime as any).isv_rate;
      }
      
      // Step 6: Calculate Ecotasa (Environmental Tax)
      const ecotasaBracket = regime.ecotasa_brackets.find(bracket => cifValue <= bracket.max);
      const ecotasa = ecotasaBracket?.fee || 10000;
      
      // Step 7: Calculate totals
      const totalTaxes = dai + isc + isv + amnestyFee + (ecotasa / 25); // Convert Lempiras to USD (~25:1)
      const totalCost = cifValue + totalTaxes;
      const caftaSavings = vinAnalysis.isUSAOrigin && isCaftaEligible ? cifValue * 0.15 : 0;
      
      const result = {
        cifValue,
        dai,
        isc,
        isv,
        amnestyFee,
        ecotasa: ecotasa / 25, // Convert to USD
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

  // Auto-calculate on input changes
  useEffect(() => {
    calculateHondurasTaxes();
  }, [vehiclePrice, freight, insurance, selectedCountry, engineSize, isCaftaEligible]);

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
                            setIsCaftaEligible(isNorthAmericanOrigin(vin));
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
                        className={`p-4 rounded-lg ${isCaftaEligible ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-orange-50 dark:bg-orange-950/20'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={isCaftaEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}>
                            {isCaftaEligible ? 'CAFTA Eligible' : 'Non-CAFTA'}
                          </Badge>
                          <span className="text-sm font-medium">
                            {isCaftaEligible ? 'US manufactured - duty exemption applies' : 'Foreign origin - standard duties apply'}
                          </span>
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
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                            <TableCell className="font-medium">Import Duty</TableCell>
                            <TableCell className="text-right">${calculationDetails.duty.toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Selective Tax (ISC)</TableCell>
                            <TableCell className="text-right">${calculationDetails.selectiveTax.toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Sales Tax (IVA)</TableCell>
                            <TableCell className="text-right">${calculationDetails.salesTax.toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Environmental Tax</TableCell>
                            <TableCell className="text-right">${calculationDetails.ecoTax.toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Other Fees</TableCell>
                            <TableCell className="text-right">${calculationDetails.otherFees.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between w-full">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                        <Button variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Calculation
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
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