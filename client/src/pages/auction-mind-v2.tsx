import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Car,
  Brain,
  Eye,
  BarChart3,
  Camera,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Zap,
  Clock,
  Target
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
            Please log in to access AuctionMind V2.
          </p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                AuctionMind V2 Analysis
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Lot → VIN → AI → Similar Active Lots
              </p>
            </div>
            <Button 
              onClick={resetAnalysis}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              New Analysis
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lot Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Lot Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle</p>
                      <p className="font-semibold">{result.lotInfo.vehicle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">VIN</p>
                      <p className="font-mono text-sm">{result.lotInfo.vin || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-semibold">{result.lotInfo.mileage?.toLocaleString() || 'N/A'} miles</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Bid</p>
                      <p className="font-semibold text-green-600">${result.lotInfo.currentBid?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Damage</p>
                      <p className="font-semibold">{result.lotInfo.damage || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{result.lotInfo.location || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Analysis */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    AI Analysis
                    {result.aiAnalysis?.hasImages && (
                      <Badge variant="secondary" className="ml-2">
                        <Camera className="h-3 w-3 mr-1" />
                        {result.aiAnalysis.imageCount} Images
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.aiAnalysis?.hasImages ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Damage Assessment</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          {result.aiAnalysis.summary || 'Comprehensive AI analysis of vehicle condition based on auction photos'}
                        </p>
                        
                        {result.aiAnalysis.damageAreas && result.aiAnalysis.damageAreas.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2">Identified Damage Areas:</h5>
                            <div className="flex flex-wrap gap-2">
                              {result.aiAnalysis.damageAreas.map((area: string, index: number) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {result.aiAnalysis.condition && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2">Overall Condition:</h5>
                            <p className="text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded">
                              {result.aiAnalysis.condition}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {result.aiAnalysis.estimatedRepairCost && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Estimated Repair Cost</h4>
                          <p className="text-2xl font-bold text-blue-600">
                            {result.aiAnalysis.estimatedRepairCost}
                          </p>
                          {result.aiAnalysis.repairNotes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {result.aiAnalysis.repairNotes}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {result.aiAnalysis.marketability && (
                        <div>
                          <h4 className="font-semibold mb-2">Marketability Assessment</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.aiAnalysis.marketability}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {result.aiAnalysis?.error || 'No images available for AI analysis'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Market Intelligence */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Market Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-sm text-muted-foreground">AI Recommendation</p>
                      <p className="text-xl font-bold">
                        {result.marketIntelligence?.recommendation || 'ANALYZE'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.marketIntelligence?.confidence || 0}% confidence
                      </p>
                    </div>
                    
                    {result.marketIntelligence?.marketData && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                            <span className="text-sm font-medium">Current Bid</span>
                            <span className="font-bold text-green-600">
                              ${result.marketIntelligence.marketData.currentBid?.toLocaleString() || 'No bids'}
                            </span>
                          </div>
                          
                          {result.marketIntelligence.marketData.estimatedValue > 0 && (
                            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <span className="text-sm font-medium">Estimated Value</span>
                              <span className="font-bold text-blue-600">
                                ${result.marketIntelligence.marketData.estimatedValue?.toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded">
                            <span className="text-sm font-medium">Similar Active Lots</span>
                            <span className="font-bold">
                              {result.marketIntelligence.marketData.similarLotsCount || 0}
                            </span>
                          </div>
                          
                          {result.marketIntelligence.marketData.historicalRecords > 0 && (
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded">
                              <span className="text-sm font-medium">Historical Records</span>
                              <span className="font-bold">
                                {result.marketIntelligence.marketData.historicalRecords}
                              </span>
                            </div>
                          )}
                          
                          {result.marketIntelligence.marketData.historicalAvgPrice > 0 && (
                            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                              <span className="text-sm font-medium">Historical Avg Price</span>
                              <span className="font-bold text-orange-600">
                                ${result.marketIntelligence.marketData.historicalAvgPrice?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {result.marketIntelligence.marketData.currentBid > 0 && result.marketIntelligence.marketData.estimatedValue > 0 && (
                          <div className="pt-3 border-t">
                            <div className="text-sm text-muted-foreground mb-2">Bid to Value Ratio</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (result.marketIntelligence.marketData.currentBid / result.marketIntelligence.marketData.estimatedValue) * 100)}%`
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {Math.round((result.marketIntelligence.marketData.currentBid / result.marketIntelligence.marketData.estimatedValue) * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* VIN History */}
          {result.vinHistory && result.vinHistory.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  VIN History ({result.vinHistory.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.vinHistory.slice(0, 5).map((record: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <div>
                        <p className="font-semibold">{record.platform}</p>
                        <p className="text-sm text-muted-foreground">{record.damage}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${record.price?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{record.saleDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Active Lots */}
          {result.similarActiveLots && result.similarActiveLots.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Similar Active Lots ({result.similarActiveLots.length} found)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Vehicle</th>
                        <th className="text-left p-2">Damage</th>
                        <th className="text-left p-2">Current Bid</th>
                        <th className="text-left p-2">Location</th>
                        <th className="text-left p-2">Auction Date</th>
                        <th className="text-left p-2">Lot ID</th>
                        <th className="text-left p-2">Images</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.similarActiveLots.map((lot: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="p-2">
                            <div>
                              <p className="font-semibold text-sm">{lot.vehicle}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">{lot.damage || 'N/A'}</span>
                          </td>
                          <td className="p-2">
                            <span className="font-bold text-green-600">
                              ${lot.currentBid?.toLocaleString() || 'No bid'}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">{lot.location || 'N/A'}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm">{lot.auctionDate || 'N/A'}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm font-mono">{lot.lotId}</span>
                          </td>
                          <td className="p-2">
                            {lot.hasImages ? (
                              <Camera className="h-4 w-4 text-blue-500" />
                            ) : (
                              <span className="text-xs text-muted-foreground">No images</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`https://copart.com/lot/${lot.lotId}`, '_blank')}
                              >
                                View on Copart
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setLotId(lot.lotId.toString());
                                  setSite('1');
                                  setResult(null);
                                }}
                              >
                                Analyze
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              AuctionMind V2
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
              Advanced Lot Analysis with AI Vision
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Lot Lookup → VIN History → AI Analysis → Similar Active Lots
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Start Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Lot ID
                </label>
                <Input
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                  placeholder="Enter lot ID (e.g., 58411805)"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Auction Site
                </label>
                <Select value={site} onValueChange={setSite}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select auction site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Copart</SelectItem>
                    <SelectItem value="2">IAAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !lotId.trim() || !site}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Lot
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}