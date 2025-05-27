import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleData {
  platform: string;
  lotId: string;
  vin: string;
  year: string;
  make: string;
  model: string;
  series?: string;
  mileage: string;
  damage: string;
  color?: string;
  location?: string;
  currentBid?: number;
  images: string[];
}

interface AIAnalysisResults {
  damageAssessment: {
    severity: 'Minor' | 'Moderate' | 'Severe';
    repairCost: { min: number; max: number };
    description: string;
  };
  marketAnalysis: {
    marketValue: number;
    priceComparison: string;
    exportSuitability: number; // 1-10 scale
  };
  recommendation: {
    decision: 'BUY' | 'PASS' | 'CAUTION';
    confidence: number; // 1-10 scale
    reasoning: string;
    estimatedProfit: number;
  };
}

interface AIAnalysisWidgetProps {
  vehicleData: VehicleData;
}

export default function AIAnalysisWidget({ vehicleData }: AIAnalysisWidgetProps) {
  const { hasPermission } = useAuth();
  const [analysisStage, setAnalysisStage] = useState<'ready' | 'analyzing' | 'complete' | 'error'>('ready');
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResults | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnalyze = async () => {
    setAnalysisStage('analyzing');
    setIsExpanded(true);

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const results = await response.json();
      setAnalysisResults(results);
      setAnalysisStage('complete');
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setAnalysisStage('error');
    }
  };

  if (!hasPermission('AI_ANALYSIS')) {
    return null;
  }

  const getRecommendationColor = (decision: string) => {
    switch (decision) {
      case 'BUY': return 'text-green-600 bg-green-50';
      case 'PASS': return 'text-red-600 bg-red-50';
      case 'CAUTION': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationIcon = (decision: string) => {
    switch (decision) {
      case 'BUY': return CheckCircle;
      case 'PASS': return XCircle;
      case 'CAUTION': return AlertTriangle;
      default: return Brain;
    }
  };

  return (
    <Card className="border-purple-200 shadow-lg mt-6">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <Brain className="h-5 w-5" />
            AI Vehicle Analysis
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Platinum
            </Badge>
          </CardTitle>
          
          {analysisStage === 'ready' && (
            <Button 
              onClick={handleAnalyze}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              Analyze Vehicle
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-6">
          {analysisStage === 'analyzing' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Analyzing vehicle data and images...</p>
            </div>
          )}

          {analysisStage === 'error' && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Analysis failed. Please try again.</p>
              <Button onClick={handleAnalyze} variant="outline">
                Retry Analysis
              </Button>
            </div>
          )}

          {analysisStage === 'complete' && analysisResults && (
            <div className="space-y-6">
              {/* Recommendation Summary */}
              <div className="text-center">
                {(() => {
                  const Icon = getRecommendationIcon(analysisResults.recommendation.decision);
                  return (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getRecommendationColor(analysisResults.recommendation.decision)}`}>
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold text-lg">{analysisResults.recommendation.decision}</span>
                      <Badge variant="outline" className="ml-2">
                        {analysisResults.recommendation.confidence}/10 Confidence
                      </Badge>
                    </div>
                  );
                })()}
              </div>

              <Separator />

              {/* Analysis Details */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Damage Assessment */}
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Damage Assessment
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Severity:</span>
                      <Badge variant={analysisResults.damageAssessment.severity === 'Minor' ? 'default' : 
                        analysisResults.damageAssessment.severity === 'Moderate' ? 'secondary' : 'destructive'}>
                        {analysisResults.damageAssessment.severity}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Repair Cost:</span>
                      <span className="text-sm font-medium">
                        ${analysisResults.damageAssessment.repairCost.min.toLocaleString()} - 
                        ${analysisResults.damageAssessment.repairCost.max.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {analysisResults.damageAssessment.description}
                    </p>
                  </div>
                </div>

                {/* Market Analysis */}
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Market Analysis
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Market Value:</span>
                      <span className="text-sm font-medium">
                        ${analysisResults.marketAnalysis.marketValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Export Rating:</span>
                      <Badge variant="outline">
                        {analysisResults.marketAnalysis.exportSuitability}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {analysisResults.marketAnalysis.priceComparison}
                    </p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Financial Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Bid:</span>
                      <span className="text-sm font-medium">
                        ${vehicleData.currentBid?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Est. Profit:</span>
                      <span className={`text-sm font-medium ${analysisResults.recommendation.estimatedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${analysisResults.recommendation.estimatedProfit.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {analysisResults.recommendation.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}