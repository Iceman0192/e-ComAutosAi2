import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Eye, DollarSign, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface LiveLot {
  id: string;
  lot_id: number;
  site: number;
  base_site: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  series?: string;
  odometer: number;
  current_bid: number;
  reserve_price: number;
  auction_date: string;
  damage_pr: string;
  damage_sec: string;
  color: string;
  location: string;
  title: string;
  document: string;
  keys: string;
  status: string;
  fuel: string;
  transmission: string;
  drive: string;
  engine: string;
  seller?: string;
  link: string;
  link_img_hd: string[];
  link_img_small: string[];
}

interface AIAnalysisProps {
  lotData: LiveLot;
  platform: 'copart' | 'iaai';
}

interface AIAnalysis {
  damageAssessment: string;
  exportSuitability: number;
  investmentRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  repairEstimate: string;
  recommendation: 'BUY' | 'CONSIDER' | 'PASS';
  keyInsights: string[];
}

interface CrossPlatformData {
  copart: {
    count: number;
    averagePrice: number;
    recentSales: any[];
  };
  iaai: {
    count: number;
    averagePrice: number;
    recentSales: any[];
  };
  priceDifferential: string | null;
  totalComparables: number;
}

export default function AILotAnalysis({ lotData, platform }: AIAnalysisProps) {
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  const { data: analysisData, isLoading, error } = useQuery({
    queryKey: ['ai-lot-analysis', lotData.vin],
    queryFn: async () => {
      const response = await fetch('/api/ai-lot-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotData, platform })
      });
      return response.json();
    },
    enabled: analysisTriggered,
  });

  const handleAnalyze = () => {
    setAnalysisTriggered(true);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'HIGH': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CONSIDER': return <Eye className="h-5 w-5 text-yellow-600" />;
      case 'PASS': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200';
      case 'CONSIDER': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200';
      case 'PASS': return 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20 border-gray-200';
    }
  };

  if (!analysisTriggered) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50">
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
              <Brain className="h-6 w-6" />
              AI Cross-Platform Analysis
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Get intelligent insights, damage assessment, and cross-platform price comparison for this vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  {lotData.year} {lotData.make} {lotData.model}
                </h3>
                <p className="text-purple-700 dark:text-purple-300 mb-4">
                  Ready for comprehensive AI analysis including damage assessment, export suitability, and cross-platform price intelligence
                </p>
                <Button 
                  onClick={handleAnalyze}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                  size="lg"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Start AI Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <h3 className="text-lg font-semibold">AI Analysis in Progress...</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing vehicle data, searching cross-platform comparisons, and generating insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              <span>Error performing AI analysis. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aiAnalysis = analysisData?.data?.aiAnalysis as AIAnalysis;
  const crossPlatformData = analysisData?.data?.crossPlatformData as CrossPlatformData;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* AI Recommendation Banner */}
      {aiAnalysis && (
        <Card className={`border-2 ${getRecommendationColor(aiAnalysis.recommendation)}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getRecommendationIcon(aiAnalysis.recommendation)}
              AI Recommendation: {aiAnalysis.recommendation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Export Suitability</p>
                <p className="text-2xl font-bold">{aiAnalysis.exportSuitability}/10</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Investment Risk</p>
                <Badge className={getRiskColor(aiAnalysis.investmentRisk)}>
                  {aiAnalysis.investmentRisk}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Repair Estimate</p>
                <p className="text-lg font-semibold">{aiAnalysis.repairEstimate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Analysis */}
        {aiAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Vehicle Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Damage Assessment</h4>
                <p className="text-gray-700 dark:text-gray-300">{aiAnalysis.damageAssessment}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Key Insights</h4>
                <ul className="space-y-2">
                  {aiAnalysis.keyInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cross-Platform Comparison */}
        {crossPlatformData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cross-Platform Price Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Copart Average</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ${crossPlatformData.copart.averagePrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {crossPlatformData.copart.count} sales
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">IAAI Average</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    ${crossPlatformData.iaai.averagePrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {crossPlatformData.iaai.count} sales
                  </p>
                </div>
              </div>

              {crossPlatformData.priceDifferential && (
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price Differential</p>
                  <div className="flex items-center justify-center gap-2">
                    {parseFloat(crossPlatformData.priceDifferential) > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-xl font-bold">
                      {crossPlatformData.priceDifferential}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    IAAI vs Copart pricing
                  </p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analysis based on {crossPlatformData.totalComparables} comparable vehicles
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Sales Comparison */}
      {crossPlatformData && (crossPlatformData.copart.recentSales.length > 0 || crossPlatformData.iaai.recentSales.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Comparable Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Copart Sales */}
              {crossPlatformData.copart.recentSales.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3">Recent Copart Sales</h4>
                  <div className="space-y-2">
                    {crossPlatformData.copart.recentSales.slice(0, 5).map((sale, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <div>
                          <p className="font-medium">{sale.year} {sale.make} {sale.model}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {sale.odometer ? `${sale.odometer.toLocaleString()} mi` : 'Unknown miles'} • {sale.damage_pr || 'Clean'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${parseFloat(sale.purchase_price).toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IAAI Sales */}
              {crossPlatformData.iaai.recentSales.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Recent IAAI Sales</h4>
                  <div className="space-y-2">
                    {crossPlatformData.iaai.recentSales.slice(0, 5).map((sale, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                        <div>
                          <p className="font-medium">{sale.year} {sale.make} {sale.model}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {sale.odometer ? `${sale.odometer.toLocaleString()} mi` : 'Unknown miles'} • {sale.damage_pr || 'Clean'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${parseFloat(sale.purchase_price).toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(sale.sale_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}