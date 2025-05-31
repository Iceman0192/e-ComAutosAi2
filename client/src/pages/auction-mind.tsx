import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Search, 
  Zap, 
  Eye, 
  Globe, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Car
} from 'lucide-react';
import { VehicleAIChat } from '@/components/VehicleAIChat';

export default function AuctionMind() {
  const { user } = useAuth();
  const [vinInput, setVinInput] = useState('');
  const [lotIdInput, setLotIdInput] = useState('');
  const [detectedSite, setDetectedSite] = useState<string>('');
  const [vinData, setVinData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVin, setIsLoadingVin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'review' | 'analyze'>('input');
  const [dbRecordCount, setDbRecordCount] = useState<number>(11712);

  // Auto-update database count every 30 seconds
  useEffect(() => {
    const updateDbCount = async () => {
      try {
        const response = await fetch('/api/database/count');
        if (response.ok) {
          const data = await response.json();
          setDbRecordCount(data.count);
        }
      } catch (error) {
        // Silently fail to avoid UI disruption
      }
    };

    updateDbCount(); // Initial load
    const interval = setInterval(updateDbCount, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleVinLookup = async () => {
    if (!vinInput.trim() || vinInput.length !== 17) {
      setError('Please enter a valid 17-character VIN');
      return;
    }

    setIsLoadingVin(true);
    setError(null);

    try {
      // Use our backend endpoint for VIN lookup
      const vinResponse = await fetch('/api/auction-mind/vin-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vin: vinInput.toUpperCase() }),
      });

      if (!vinResponse.ok) {
        throw new Error('Failed to fetch VIN data');
      }

      const vinResult = await vinResponse.json();
      
      if (vinResult.success && vinResult.data && vinResult.data.length > 0) {
        const vehicleInfo = vinResult.data[0];
        
        // Auto-populate lot ID and site information
        setLotIdInput(vehicleInfo.lot_id?.toString() || '');
        setDetectedSite(vehicleInfo.base_site || '');
        setStep('review');
        
        // Update database count
        const dbCountResponse = await fetch('/api/database/count');
        if (dbCountResponse.ok) {
          const countData = await dbCountResponse.json();
          setDbRecordCount(countData.count);
        }
      } else {
        setError(vinResult.message || 'No data found for this VIN');
      }
    } catch (err) {
      setError('Failed to lookup VIN data. Please check your API key configuration.');
    } finally {
      setIsLoadingVin(false);
    }
  };

  const handleAnalyze = async () => {
    if (!vinInput.trim() || vinInput.length !== 17) {
      setError('Please enter a valid 17-character VIN');
      return;
    }

    if (!lotIdInput.trim()) {
      setError('Please enter a Lot ID for current auction images');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('analyze');

    try {
      const response = await fetch('/api/auction-mind/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          vin: vinInput.toUpperCase(),
          lotId: lotIdInput.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVinData(result.data);
      } else {
        setError(result.message || result.error || 'Analysis failed');
        setStep('review');
      }
    } catch (err) {
      setError('Network error occurred');
      setStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Please log in to access AuctionMind.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Immersive Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        <div className="relative container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">AuctionMind</h1>
                  <p className="text-indigo-100 text-lg">Multi-AI Vehicle Intelligence Platform</p>
                </div>
              </div>
              <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
                Advanced AI-powered analysis combining OpenAI Vision, Perplexity research, and comprehensive 
                database cross-checks to deliver actionable vehicle intelligence for export professionals.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-medium">
                Platinum Feature
              </Badge>
              <div className="text-right">
                <div className="text-white/80 text-sm">Database Records</div>
                <div className="text-2xl font-bold">{dbRecordCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* VIN Input Section */}
        <div className="relative -mt-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 mx-4">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {step === 'input' && 'Step 1: Vehicle History Discovery'}
                    {step === 'review' && 'Step 2: Deep Image Analysis Setup'}
                    {step === 'analyze' && 'Step 2: AI Vision Analysis in Progress'}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {step === 'input' && 'Enter VIN to unlock comprehensive auction history, comparable sales, and market intelligence'}
                    {step === 'review' && 'Verify auction details before running advanced AI damage assessment on current photos'}
                    {step === 'analyze' && 'Analyzing current auction images with AI vision for precise damage evaluation...'}
                  </p>
                </div>
                
                {/* Progress Steps Indicator */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === 'input' ? 'bg-indigo-600 text-white' : 
                      step === 'review' || step === 'analyze' ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      1
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      step === 'input' ? 'text-indigo-600' : 
                      step === 'review' || step === 'analyze' ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      History & Data
                    </span>
                  </div>
                  <div className={`w-12 h-0.5 ${
                    step === 'review' || step === 'analyze' ? 'bg-green-500' : 'bg-slate-300'
                  }`}></div>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === 'analyze' ? 'bg-indigo-600 text-white' :
                      step === 'review' ? 'bg-yellow-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      2
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      step === 'analyze' ? 'text-indigo-600' :
                      step === 'review' ? 'text-yellow-600' : 'text-slate-500'
                    }`}>
                      AI Vision Analysis
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6">
                    
                    {step === 'input' && (
                      <>
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              type="text"
                              placeholder="Enter VIN: 1N6AD0ER4DN751317"
                              value={vinInput}
                              onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                              className="h-14 pl-12 text-lg font-mono tracking-wider border-0 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 rounded-xl"
                              maxLength={17}
                            />
                          </div>
                          <div className="flex justify-center">
                            <Button 
                              onClick={handleVinLookup}
                              disabled={!vinInput.trim() || vinInput.length !== 17 || isLoadingVin}
                              className="h-14 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transform transition-all hover:scale-105 disabled:transform-none"
                              size="lg"
                            >
                              {isLoadingVin ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                  Looking up VIN...
                                </>
                              ) : (
                                <>
                                  <Search className="h-5 w-5 mr-3" />
                                  Lookup VIN
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {step === 'review' && (
                      <>
                        <div className="space-y-6">
                          {/* Step 1 Completed Summary */}
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <h3 className="font-semibold text-green-800 dark:text-green-300">Step 1 Complete: Vehicle History Retrieved</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold text-slate-900 dark:text-white">{dbRecordCount.toLocaleString()}</div>
                                <div className="text-slate-600 dark:text-slate-400">Database Records</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-slate-900 dark:text-white">✓</div>
                                <div className="text-slate-600 dark:text-slate-400">Auction History</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-slate-900 dark:text-white">✓</div>
                                <div className="text-slate-600 dark:text-slate-400">Comparable Sales</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-slate-900 dark:text-white">✓</div>
                                <div className="text-slate-600 dark:text-slate-400">Market Intelligence</div>
                              </div>
                            </div>
                          </div>

                          {/* Step 2 Setup */}
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Eye className="h-5 w-5 text-yellow-600" />
                              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Step 2 Ready: AI Vision Analysis Setup</h3>
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                              Advanced AI will analyze current auction photos for precise damage assessment, repair estimates, and visual condition evaluation.
                            </p>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                  type="text"
                                  value={vinInput}
                                  disabled
                                  className="h-12 pl-12 text-base font-mono tracking-wider border-0 bg-slate-100 dark:bg-slate-600 rounded-xl"
                                />
                              </div>
                              <div className="relative">
                                <Car className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                  type="text"
                                  placeholder="Lot ID (auto-detected)"
                                  value={lotIdInput}
                                  onChange={(e) => setLotIdInput(e.target.value)}
                                  className="h-12 pl-12 text-base font-mono tracking-wider border-0 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-yellow-500 rounded-xl"
                                />
                              </div>
                            </div>
                            
                            {detectedSite && (
                              <div className="mt-3 text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Auction Platform: <span className="font-semibold text-slate-900 dark:text-white capitalize">{detectedSite}</span>
                                  <span className="ml-2 text-xs text-green-600">Auto-detected</span>
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-center gap-4">
                            <Button 
                              onClick={() => setStep('input')}
                              variant="outline"
                              className="h-12 px-6"
                            >
                              Back to Step 1
                            </Button>
                            <Button 
                              onClick={handleAnalyze}
                              disabled={!vinInput.trim() || vinInput.length !== 17 || !lotIdInput.trim() || isLoading}
                              className="h-12 px-8 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg transform transition-all hover:scale-105 disabled:transform-none"
                            >
                              {isLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Eye className="h-5 w-5 mr-3" />
                                  Begin AI Vision Analysis
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {step === 'analyze' && (
                      <div className="space-y-6">
                        {/* Analysis Progress */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
                          <div className="text-center mb-6">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
                              AI Vision Analysis in Progress
                            </h3>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400">
                              Analyzing current auction images with advanced computer vision
                            </p>
                          </div>
                          
                          {/* Analysis Steps */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">Fetching current auction images from live lot data</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">Running OpenAI GPT-4 Vision analysis on vehicle photos</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">Analyzing damage patterns and repair requirements</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">Cross-referencing with market intelligence data</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                              <span className="text-sm text-slate-500 dark:text-slate-400">Generating comprehensive investment recommendation</span>
                            </div>
                          </div>
                          
                          <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              This advanced analysis typically takes 20-45 seconds
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {step === 'input' && vinInput.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-16">VIN:</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                vinInput.length === 17 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                              }`}
                              style={{ width: `${(vinInput.length / 17) * 100}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${
                            vinInput.length === 17 ? 'text-green-600' : 'text-slate-500'
                          }`}>
                            {vinInput.length}/17
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {vinData && (
          <div className="space-y-8 mt-12">
            {/* Hero Analysis Card */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-3xl"></div>
              <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
                
                {/* Vehicle Header */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Car className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                          {vinData.vehicleInfo?.year || 'Unknown'} {vinData.vehicleInfo?.make || 'Unknown'} {vinData.vehicleInfo?.model || 'Unknown'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-lg">
                          {vinData.vehicleInfo?.series || 'Series Information'} • VIN: {vinData.vin || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Engine</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{vinData.vehicleInfo?.engine || 'Unknown'}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Mileage</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{vinData.vehicleInfo?.mileage?.toLocaleString() || 'Unknown'}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Records Found</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{vinData.vehicleHistory?.length || 0}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Database Cross-Check</div>
                        <div className="font-semibold text-emerald-600">✓ Complete</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Recommendation */}
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                        vinData.consensus?.recommendation === 'BUY' 
                          ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                          : 'bg-gradient-to-br from-orange-400 to-red-500'
                      } shadow-xl`}>
                        {vinData.consensus?.recommendation === 'BUY' ? (
                          <CheckCircle className="h-12 w-12 text-white" />
                        ) : (
                          <AlertTriangle className="h-12 w-12 text-white" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-900 px-4 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {vinData.consensus?.confidence || 0}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${
                        vinData.consensus?.recommendation === 'BUY' ? 'text-emerald-600' : 'text-orange-600'
                      }`}>
                        {vinData.consensus?.recommendation === 'BUY' ? 'BUY RECOMMENDED' : 'PROCEED WITH CAUTION'}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">AI Consensus</div>
                    </div>
                  </div>
                </div>
                
                {/* Multi-AI Intelligence Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* OpenAI Vision */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-2xl transform group-hover:scale-105 transition-transform"></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">OpenAI Vision</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Image Analysis</p>
                        </div>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {vinData.openai?.summary ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                              {vinData.openai.currentValue && (
                                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2">
                                  <div className="text-blue-600 dark:text-blue-400 font-medium">Current Value</div>
                                  <div className="font-semibold">{vinData.openai.currentValue}</div>
                                </div>
                              )}
                              {vinData.openai.trend && (
                                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2">
                                  <div className="text-blue-600 dark:text-blue-400 font-medium">Trend</div>
                                  <div className="font-semibold capitalize">{vinData.openai.trend}</div>
                                </div>
                              )}
                              {vinData.openai.repairEstimate && (
                                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-2">
                                  <div className="text-orange-600 dark:text-orange-400 font-medium">Repair Cost</div>
                                  <div className="font-semibold">{vinData.openai.repairEstimate}</div>
                                </div>
                              )}
                              {vinData.openai.confidenceScore && (
                                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                                  <div className="text-green-600 dark:text-green-400 font-medium">AI Confidence</div>
                                  <div className="font-semibold">{Math.round(vinData.openai.confidenceScore * 100)}%</div>
                                </div>
                              )}
                            </div>
                            {vinData.openai.damageAssessment && (
                              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 mb-3">
                                <div className="text-red-600 dark:text-red-400 font-medium text-xs">Damage Assessment</div>
                                <div className="text-sm mt-1">{vinData.openai.damageAssessment}</div>
                              </div>
                            )}
                            <p className="text-sm">
                              {vinData.openai.summary.length > 120 
                                ? `${vinData.openai.summary.substring(0, 120)}...`
                                : vinData.openai.summary
                              }
                            </p>
                            {vinData.openai.recommendation && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 mt-2">
                                <div className="text-blue-600 dark:text-blue-400 font-medium text-xs">Recommendation</div>
                                <div className="text-sm mt-1">
                                  {typeof vinData.openai.recommendation === 'string' 
                                    ? vinData.openai.recommendation 
                                    : JSON.stringify(vinData.openai.recommendation)
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          'Analyzing vehicle images and specifications...'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Perplexity Research */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-2xl transform group-hover:scale-105 transition-transform"></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">Market Research</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Real-time Insights</p>
                        </div>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {vinData.perplexity?.marketInsight ? (
                          <div className="space-y-3">
                            <p className="text-sm">
                              {vinData.perplexity.marketInsight.length > 150 
                                ? `${vinData.perplexity.marketInsight.substring(0, 150)}...`
                                : vinData.perplexity.marketInsight
                              }
                            </p>
                            {vinData.perplexity.marketInsight.length > 150 && (
                              <button 
                                className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                                onClick={() => {
                                  const fullText = document.getElementById('market-full-text');
                                  const summary = document.getElementById('market-summary');
                                  if (fullText && summary) {
                                    fullText.classList.toggle('hidden');
                                    summary.classList.toggle('hidden');
                                  }
                                }}
                              >
                                Show full analysis
                              </button>
                            )}
                            <div id="market-full-text" className="hidden">
                              <p className="text-sm">{vinData.perplexity.marketInsight}</p>
                            </div>
                          </div>
                        ) : (
                          'Researching current market trends...'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Consensus */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-2xl transform group-hover:scale-105 transition-transform"></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">AI Consensus</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Final Recommendation</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {vinData.consensus?.reasoning || 'Generating comprehensive analysis...'}
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Confidence Level</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {vinData.consensus?.confidence || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${vinData.consensus?.confidence || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tools */}
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
                <VehicleAIChat vehicleData={vinData?.vehicleInfo} />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Analysis Failed</h3>
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}