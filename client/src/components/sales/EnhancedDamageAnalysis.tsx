import { useMemo } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import PermissionGate from '../auth/PermissionGate';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, TrendingUp, Target, Percent, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DamageData {
  damage: string;
  average: number;
  min: number;
  max: number;
  median: number;
  count: number;
  color: string;
  successRate: number;
  priceRange: string;
  marketPosition: number;
  opportunityScore: number;
}

interface EnhancedDamageAnalysisProps {
  salesHistory: Array<{
    vehicle_damage?: string;
    purchase_price?: number;
    sale_status?: string;
  }>;
}

export default function EnhancedDamageAnalysis({ salesHistory }: EnhancedDamageAnalysisProps) {
  const { user } = useAuth();

  const damageAnalysis = useMemo(() => {
    const damageMap = new Map<string, { prices: number[], sales: any[] }>();
    
    salesHistory.forEach(sale => {
      const damage = sale.vehicle_damage || 'Unknown';
      const price = typeof sale.purchase_price === 'string' 
        ? parseFloat(sale.purchase_price) 
        : sale.purchase_price;
        
      if (price && !isNaN(price) && price > 0) {
        if (!damageMap.has(damage)) {
          damageMap.set(damage, { prices: [], sales: [] });
        }
        const damageData = damageMap.get(damage)!;
        damageData.prices.push(price);
        damageData.sales.push(sale);
      }
    });

    const colors = ['#ff6b6b', '#66bb6a', '#42a5f5', '#ffa726', '#ab47bc', '#78909c'];
    let colorIndex = 0;

    const result: DamageData[] = Array.from(damageMap.entries()).map(([damage, { prices, sales }]) => {
      prices.sort((a, b) => a - b);
      const sum = prices.reduce((acc, price) => acc + price, 0);
      const average = sum / prices.length;
      const median = prices[Math.floor(prices.length / 2)];
      
      const soldCount = sales.filter(sale => 
        sale.sale_status && !sale.sale_status.toLowerCase().includes('not sold')
      ).length;
      const successRate = (soldCount / sales.length) * 100;
      
      const priceRange = `${formatCurrency(prices[0])} - ${formatCurrency(prices[prices.length - 1])}`;
      
      // VALUE-FOCUSED SCORING: Find best deals for business buyers
      const lowPriceCount = prices.filter(p => p < average * 0.75).length; // Deals 25% below average
      const valueOpportunity = (lowPriceCount / prices.length) * 100;
      const marketLiquidity = Math.min(100, (successRate / 70) * 100); // Normalize to 70% as good
      const opportunityScore = Math.round((valueOpportunity * 0.5) + (marketLiquidity * 0.5));

      return {
        damage,
        average: Math.round(average),
        min: prices[0],
        max: prices[prices.length - 1],
        median: Math.round(median),
        count: prices.length,
        color: colors[colorIndex++ % colors.length],
        successRate: Math.round(successRate),
        priceRange,
        marketPosition: 0,
        opportunityScore,
      };
    });

    const sortedResult = result.sort((a, b) => b.average - a.average);
    sortedResult.forEach((item, index) => {
      item.marketPosition = index + 1;
    });
    
    return sortedResult;
  }, [salesHistory]);

  const freeTierData = damageAnalysis.slice(0, 3);
  const hiddenCount = Math.max(0, damageAnalysis.length - 3);

  return (
    <div className="space-y-4">
      <PermissionGate 
        permission="MULTIPLE_DAMAGE_TYPES" 
        fallback={
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Damage Analysis</CardTitle>
                <Badge variant="outline" className="text-xs">FREE TIER</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {freeTierData.map((data) => (
                  <div key={data.damage} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.color }} />
                      <div>
                        <div className="font-medium">{data.damage}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{data.count} vehicles</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(data.average)}</div>
                      <div className="text-xs text-gray-500">avg</div>
                    </div>
                  </div>
                ))}
                
                {hiddenCount > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {hiddenCount} More Damage Types Available
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                      Unlock detailed analysis including success rates, price ranges, and investment opportunities
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Enhanced Damage Analysis</CardTitle>
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
                  Damage Type Price Distribution
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={damageAnalysis.sort((a, b) => b.average - a.average)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="damage" 
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
                        name === 'average' ? formatCurrency(value as number) : value,
                        name === 'average' ? 'Average Price' : 'Sample Size'
                      ]}
                      labelFormatter={(label) => `Damage Type: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="average" 
                      fill="#ff6b6b" 
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
                    <TableHead className="w-[140px]">Damage Type</TableHead>

                    <TableHead className="text-center">Avg Price</TableHead>
                    <TableHead className="text-center">Price Range</TableHead>

                    <TableHead className="text-center">Sample Size</TableHead>

                  </TableRow>
                </TableHeader>
                <TableBody>
                  {damageAnalysis.map((data) => (
                    <TableRow key={data.damage} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                          {data.damage}
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-semibold">
                        {formatCurrency(data.average)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div>
                          <div className="font-medium">{data.priceRange}</div>
                          <div className="text-xs text-gray-500">Median: {formatCurrency(data.median)}</div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">{data.count} vehicles</Badge>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">Best Value Retention</span>
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {damageAnalysis[0]?.damage || 'N/A'}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {formatCurrency(damageAnalysis[0]?.average || 0)} avg price
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">Highest Success Rate</span>
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {damageAnalysis.sort((a, b) => b.successRate - a.successRate)[0]?.damage || 'N/A'}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {damageAnalysis.sort((a, b) => b.successRate - a.successRate)[0]?.successRate || 0}% success rate
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800 dark:text-purple-200">Best Value Opportunity</span>
                </div>
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {damageAnalysis.sort((a, b) => b.opportunityScore - a.opportunityScore)[0]?.damage || 'N/A'}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Value Score: {damageAnalysis.sort((a, b) => b.opportunityScore - a.opportunityScore)[0]?.opportunityScore || 0}/100
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}