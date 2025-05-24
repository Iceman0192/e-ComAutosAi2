import { useMemo } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import PermissionGate from '../auth/PermissionGate';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, TrendingDown, Target, Percent, Star, Gauge } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MileageBracket {
  range: string;
  minMiles: number;
  maxMiles: number;
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  successRate: number;
  sampleSize: number;
  depreciationPerMile: number;
  marketDemand: string;
  investmentScore: number;
  color: string;
}

interface TieredMileageAnalysisProps {
  salesHistory: Array<{
    vehicle_mileage?: number;
    purchase_price?: number;
    sale_status?: string;
  }>;
}

export default function TieredMileageAnalysis({ salesHistory }: TieredMileageAnalysisProps) {
  const { user } = useAuth();

  // Calculate mileage bracket analysis
  const mileageAnalysis = useMemo(() => {
    const brackets = [
      { range: '0-25k', minMiles: 0, maxMiles: 25000, color: '#22c55e' },
      { range: '25k-50k', minMiles: 25001, maxMiles: 50000, color: '#3b82f6' },
      { range: '50k-75k', minMiles: 50001, maxMiles: 75000, color: '#f59e0b' },
      { range: '75k-100k', minMiles: 75001, maxMiles: 100000, color: '#ef4444' },
      { range: '100k+', minMiles: 100001, maxMiles: Infinity, color: '#8b5cf6' }
    ];

    const bracketData = brackets.map(bracket => {
      const vehiclesInBracket = salesHistory.filter(sale => {
        const mileage = sale.vehicle_mileage;
        return mileage && mileage >= bracket.minMiles && mileage <= bracket.maxMiles;
      });

      if (vehiclesInBracket.length === 0) {
        return {
          ...bracket,
          averagePrice: 0,
          medianPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          successRate: 0,
          sampleSize: 0,
          depreciationPerMile: 0,
          marketDemand: 'No Data',
          investmentScore: 0
        };
      }

      const prices = vehiclesInBracket
        .map(sale => {
          const price = typeof sale.purchase_price === 'string' 
            ? parseFloat(sale.purchase_price) 
            : sale.purchase_price;
          return price || 0;
        })
        .filter(price => price > 0)
        .sort((a, b) => a - b);

      if (prices.length === 0) {
        return {
          ...bracket,
          averagePrice: 0,
          medianPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          successRate: 0,
          sampleSize: vehiclesInBracket.length,
          depreciationPerMile: 0,
          marketDemand: 'No Data',
          investmentScore: 0
        };
      }

      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      // Calculate success rate
      const soldVehicles = vehiclesInBracket.filter(sale => 
        sale.sale_status && !sale.sale_status.toLowerCase().includes('not sold')
      );
      const successRate = (soldVehicles.length / vehiclesInBracket.length) * 100;

      // Calculate depreciation per mile (compared to lowest mileage bracket)
      const basePriceReference = 30000; // Approximate baseline for calculation
      const midMileage = (bracket.minMiles + Math.min(bracket.maxMiles, 150000)) / 2;
      const depreciationPerMile = midMileage > 0 ? Math.max(0, (basePriceReference - averagePrice) / midMileage) : 0;

      // Determine market demand
      let marketDemand = 'Low';
      if (successRate >= 70 && vehiclesInBracket.length >= 3) marketDemand = 'High';
      else if (successRate >= 50 || vehiclesInBracket.length >= 2) marketDemand = 'Medium';

      // VALUE-FOCUSED SCORING: Find best deals for business buyers
      const belowMarketCount = prices.filter(p => p < averagePrice * 0.8).length;
      const valueOpportunity = (belowMarketCount / prices.length) * 100;
      const sampleConfidence = Math.min(100, (vehiclesInBracket.length / 5) * 100); // More samples = more confidence
      const priceConsistency = 1 - ((prices[prices.length - 1] - prices[0]) / averagePrice);
      const investmentScore = Math.round((valueOpportunity * 0.6) + (sampleConfidence * 0.3) + (Math.max(0, priceConsistency) * 10));

      return {
        ...bracket,
        averagePrice: Math.round(averagePrice),
        medianPrice: Math.round(medianPrice),
        minPrice: prices[0],
        maxPrice: prices[prices.length - 1],
        successRate: Math.round(successRate),
        sampleSize: vehiclesInBracket.length,
        depreciationPerMile: Number(depreciationPerMile.toFixed(3)),
        marketDemand,
        investmentScore
      };
    });

    return bracketData.filter(bracket => bracket.sampleSize > 0);
  }, [salesHistory]);

  // Free tier: Show only first 3 brackets
  const freeTierData = mileageAnalysis.slice(0, 2);
  const hiddenCount = Math.max(0, mileageAnalysis.length - 2);

  return (
    <div className="space-y-4">
      {/* Free Tier: Limited Mileage Analysis */}
      <PermissionGate 
        permission="FULL_ANALYTICS" 
        fallback={
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mileage vs Price Analysis</CardTitle>
                <Badge variant="outline" className="text-xs">
                  FREE TIER
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {freeTierData.map((bracket) => (
                  <div key={bracket.range} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: bracket.color }}
                      />
                      <div>
                        <div className="font-medium">{bracket.range} miles</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {bracket.sampleSize} vehicles
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(bracket.averagePrice)}</div>
                      <div className="text-xs text-gray-500">
                        avg price
                      </div>
                    </div>
                  </div>
                ))}
                
                {hiddenCount > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {hiddenCount} More Mileage Brackets Available
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                      Unlock detailed depreciation analysis, success rates, and investment scoring
                    </p>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      Upgrade to Gold
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        }
      >
        {/* Gold/Platinum Tier: Complete Enhanced Mileage Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Enhanced Mileage vs Price Analysis</CardTitle>
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                {user?.role === UserRole.PLATINUM ? 'PLATINUM' : 'GOLD'} TIER
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Visual Chart Overview */}
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Mileage vs Price Distribution
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mileageAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="range" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'averagePrice' ? formatCurrency(value as number) : value,
                        name === 'averagePrice' ? 'Average Price' : 'Sample Size'
                      ]}
                      labelFormatter={(label) => `Mileage Range: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="averagePrice" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                      name="Average Price"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Enhanced Data Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Mileage Range</TableHead>
                    <TableHead className="text-center">Avg Price</TableHead>

                    <TableHead className="text-center">Depreciation/Mile</TableHead>

                    <TableHead className="text-center">Value Score</TableHead>
                    <TableHead className="text-center">Sample Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mileageAnalysis.map((bracket) => (
                    <TableRow key={bracket.range} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: bracket.color }}
                          />
                          <span className="font-semibold">{bracket.range}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <div className="font-semibold">{formatCurrency(bracket.averagePrice)}</div>
                          <div className="text-xs text-gray-500">
                            Median: {formatCurrency(bracket.medianPrice)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingDown className="h-3 w-3 text-gray-500" />
                          <span className="font-mono text-sm">
                            ${bracket.depreciationPerMile}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            bracket.marketDemand === 'High' ? 'border-green-500 text-green-700' :
                            bracket.marketDemand === 'Medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-red-500 text-red-700'
                          }`}
                        >
                          {bracket.marketDemand}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className={`h-3 w-3 ${
                            bracket.investmentScore >= 80 ? 'text-green-500' :
                            bracket.investmentScore >= 60 ? 'text-yellow-500' : 'text-gray-400'
                          }`} />
                          <span className={`font-semibold text-sm ${
                            bracket.investmentScore >= 80 ? 'text-green-600' :
                            bracket.investmentScore >= 60 ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {bracket.investmentScore}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {bracket.sampleSize} vehicles
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Sweet Spot Analysis */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Sweet Spot Range</span>
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {mileageAnalysis.sort((a, b) => b.investmentScore - a.investmentScore)[0]?.range || 'N/A'} miles
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Best investment opportunity
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Lowest Depreciation</span>
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {mileageAnalysis.sort((a, b) => a.depreciationPerMile - b.depreciationPerMile)[0]?.range || 'N/A'} miles
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  ${mileageAnalysis.sort((a, b) => a.depreciationPerMile - b.depreciationPerMile)[0]?.depreciationPerMile || 0}/mile
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">Highest Success Rate</span>
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {mileageAnalysis.sort((a, b) => b.successRate - a.successRate)[0]?.range || 'N/A'} miles
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  {mileageAnalysis.sort((a, b) => b.successRate - a.successRate)[0]?.successRate || 0}% success rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}