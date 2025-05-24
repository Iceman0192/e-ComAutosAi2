import { useMemo } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import PermissionGate from '../auth/PermissionGate';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, TrendingUp, Target, Percent, Star } from 'lucide-react';

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

interface TieredDamageAnalysisProps {
  salesHistory: Array<{
    vehicle_damage?: string;
    purchase_price?: number;
    sale_status?: string;
  }>;
}

export default function TieredDamageAnalysis({ salesHistory }: TieredDamageAnalysisProps) {
  const { user } = useAuth();

  // Calculate enhanced damage analysis data
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
      
      // Calculate success rate (sold vs not sold)
      const soldCount = sales.filter(sale => 
        sale.sale_status && !sale.sale_status.toLowerCase().includes('not sold')
      ).length;
      const successRate = (soldCount / sales.length) * 100;
      
      // Create price range string
      const priceRange = `${formatCurrency(prices[0])} - ${formatCurrency(prices[prices.length - 1])}`;
      
      // Calculate market position (ranking by average price)
      const marketPosition = 0; // Will be calculated after all damages are processed
      
      // Calculate opportunity score based on success rate and price volatility
      const priceVolatility = (prices[prices.length - 1] - prices[0]) / average;
      const opportunityScore = Math.round((successRate * 0.6) + ((1 - priceVolatility) * 40));
      
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
        marketPosition,
        opportunityScore
        color: colors[colorIndex++ % colors.length]
      };
    });

    // Sort by average price (highest first)
    return result.sort((a, b) => b.average - a.average);
  }, [salesHistory]);

  // Free tier: Show top 3 damage types only
  const freeTierData = damageAnalysis.slice(0, 3);
  const hiddenCount = Math.max(0, damageAnalysis.length - 3);

  return (
    <div className="space-y-4">
      {/* Free Tier: Limited Damage Analysis */}
      <PermissionGate 
        permission="MULTIPLE_DAMAGE_TYPES" 
        fallback={
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Damage Analysis</CardTitle>
                <Badge variant="outline" className="text-xs">
                  FREE TIER
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {freeTierData.map((data, index) => (
                  <div key={data.damage} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: data.color }}
                      />
                      <div>
                        <div className="font-medium">{data.damage}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {data.count} vehicles
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(data.average)}</div>
                      <div className="text-xs text-gray-500">
                        avg
                      </div>
                    </div>
                  </div>
                ))}
                
                {hiddenCount > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        {hiddenCount} More Damage Types Available
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Upgrade to Gold to see complete damage analysis with pricing insights, ranges, and detailed statistics.
                    </p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                      Upgrade to Gold
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        }
      >
        {/* Gold+ Tier: Full Damage Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Complete Damage Analysis</CardTitle>
              <Badge className="bg-yellow-100 text-yellow-800">
                {user?.role.toUpperCase()} TIER
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Damage Type</th>
                    <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Count</th>
                    <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Average</th>
                    <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Range</th>
                    <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Median</th>
                  </tr>
                </thead>
                <tbody>
                  {damageAnalysis.map((data, index) => (
                    <tr key={data.damage} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          <span className="font-medium">{data.damage}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 text-gray-600 dark:text-gray-400">
                        {data.count}
                      </td>
                      <td className="text-right py-3 font-semibold">
                        {formatCurrency(data.average)}
                      </td>
                      <td className="text-right py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(data.min)} - {formatCurrency(data.max)}
                      </td>
                      <td className="text-right py-3 font-medium">
                        {formatCurrency(data.median)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}