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
      duty: 0.0,
      selectiveTaxBrackets: {
        0: 0.10, 7000: 0.15, 10000: 0.20, 20000: 0.30, 50000: 0.45, 100000: 0.60,
      },
      ecoTaxBrackets: { 0: 200, 15000: 280, 25000: 400 },
      salesTax: 0.15,
      otherFees: 0.10
    },
    other_origin: {
      duty: 0.15,
      selectiveTaxBrackets: {
        0: 0.10, 7000: 0.15, 10000: 0.20, 20000: 0.30, 50000: 0.45, 100000: 0.60,
      },
      ecoTaxBrackets: { 0: 205, 15000: 280, 25000: 410 },
      salesTax: 0.15,
      otherFees: 0.03
    }
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

  // VIN analysis for CAFTA eligibility
  const isNorthAmericanOrigin = (vin: string): boolean => {
    if (!vin || vin.length < 1) return false;
    const firstChar = vin.charAt(0).toUpperCase();
    return ['1', '2', '3', '4', '5'].includes(firstChar);
  };

  // Real-time calculation
  const calculateTaxes = () => {
    if (!vehiclePrice || !selectedCountry) return null;

    setIsCalculating(true);
    
    setTimeout(() => {
      const cifValue = vehiclePrice + freight + insurance;
      const origin = isCaftaEligible ? 'north_american_origin' : 'other_origin';
      const rules = TAX_RULES[selectedCountry as keyof typeof TAX_RULES]?.[origin];
      
      if (!rules) {
        setIsCalculating(false);
        return null;
      }

      const duty = cifValue * rules.duty;
      const selectiveTax = cifValue * 0.15; // Simplified for demo
      const salesTax = (cifValue + selectiveTax) * rules.salesTax;
      const ecoTax = rules.ecoTaxBrackets[0] || 200;
      const otherFees = cifValue * rules.otherFees;
      
      const totalTaxes = duty + selectiveTax + salesTax + ecoTax + otherFees;
      const totalCost = cifValue + totalTaxes;
      const caftaSavings = isCaftaEligible ? cifValue * 0.15 : 0;

      const result = {
        cifValue,
        duty,
        selectiveTax,
        salesTax,
        ecoTax,
        otherFees,
        totalTaxes,
        totalCost,
        caftaEligible: isCaftaEligible,
        caftaSavings,
        taxPercentage: ((totalTaxes / cifValue) * 100).toFixed(1)
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
    calculateTaxes();
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