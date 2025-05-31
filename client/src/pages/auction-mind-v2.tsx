import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  MapPin,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  Brain,
  BarChart3,
  Camera
} from 'lucide-react';

interface AnalysisResult {
  lotInfo: any;
  vinHistory: any[];
  aiAnalysis: any;
  similarActiveLots: any[];
  marketIntelligence: any;
}

export default function AuctionMindV2() {
  const { user } = useAuth();
  const [lotId, setLotId] = useState('');
  const [site, setSite] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!lotId.trim() || !site) {
      setError('Please enter a Lot ID and select auction site');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/auction-mind-v2/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lotId: lotId.trim(),
          site: parseInt(site)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setLotId('');
    setSite('');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                AuctionMind
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-Powered Live Lot Analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {!result ? (
          /* Analysis Input */
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Start Live Lot Analysis
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400">
                  Get comprehensive AI insights with current auction images and market intelligence
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Lot ID
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="58323535"
                        value={lotId}
                        onChange={(e) => setLotId(e.target.value)}
                        className="pl-10 h-12 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Auction Site
                    </label>
                    <Select value={site} onValueChange={setSite}>
                      <SelectTrigger className="h-12 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select auction site" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Copart</SelectItem>
                        <SelectItem value="2">IAAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleAnalyze}
                  disabled={!lotId.trim() || !site || isAnalyzing}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Lot
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            {/* Header with Reset */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Analysis Results
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Lot {result.lotInfo.lotId} • {result.lotInfo.site}
                </p>
              </div>
              <Button onClick={resetAnalysis} variant="outline">
                New Analysis
              </Button>
            </div>

            {/* Vehicle Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {result.lotInfo.vehicle}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Vehicle</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {result.lotInfo.mileage?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Miles</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      ${result.lotInfo.currentBid?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Current Bid</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {result.lotInfo.damage}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Damage</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Vision Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  AI Vision Analysis
                  {result.aiVision.hasImages && (
                    <Badge variant="secondary" className="ml-2">
                      <Camera className="h-3 w-3 mr-1" />
                      {result.aiVision.imageCount} Images
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.aiVision.hasImages ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Damage Assessment</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                          {result.aiVision.damageAssessment}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Repair Estimate</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                          {result.aiVision.repairEstimate}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-medium">Overall Condition</span>
                        <Badge variant={
                          result.aiVision.overallCondition === 'excellent' ? 'default' :
                          result.aiVision.overallCondition === 'good' ? 'secondary' :
                          result.aiVision.overallCondition === 'fair' ? 'outline' : 'destructive'
                        }>
                          {result.aiVision.overallCondition}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-medium">AI Confidence</span>
                        <Badge variant="outline">{result.aiVision.confidenceLevel}</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No images available for AI vision analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Market Intelligence
                  <Badge 
                    variant={
                      result.marketIntelligence.recommendation === 'BUY' ? 'default' :
                      result.marketIntelligence.recommendation === 'ANALYZE' ? 'secondary' : 'destructive'
                    }
                    className="ml-2"
                  >
                    {result.marketIntelligence.recommendation}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      ${result.marketIntelligence.marketData.historicalAvgPrice?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Historical Avg</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      ${result.marketIntelligence.marketData.comparableAvgPrice?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Comparable Avg</div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {result.marketIntelligence.confidence}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Confidence</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {result.marketIntelligence.marketData.similarLotsCount}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">Similar Live Lots</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {result.marketIntelligence.marketData.historicalRecords}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">Historical Records</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {result.marketIntelligence.marketData.comparableRecords}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">Comparable Sales</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Lots & Historical Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Similar Lots */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Live Lots</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.similarLots.length > 0 ? (
                    <div className="space-y-3">
                      {result.similarLots.map((lot, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{lot.vehicle}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Lot {lot.lotId} • {lot.damage}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">${lot.currentBid?.toLocaleString() || '0'}</div>
                            {lot.hasImages && (
                              <Badge variant="outline" className="text-xs">
                                <Camera className="h-2 w-2 mr-1" />
                                Images
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
                      No similar lots found
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Historical Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Sales History</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.historicalData.length > 0 ? (
                    <div className="space-y-3">
                      {result.historicalData.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">${record.price?.toLocaleString()}</div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {record.saleDate} • {record.platform}
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {record.damage}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
                      No historical data found
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}