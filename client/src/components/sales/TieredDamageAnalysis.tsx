import { useMemo } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import PermissionGate from '../auth/PermissionGate';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DamageData {
  damage: string;
  average: number;
  min: number;
  max: number;
  median: number;
  count: number;
  color: string;
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

  // Simple damage analysis data - back to basics
  const damageAnalysis = useMemo(() => {
    const damageMap = new Map<string, number[]>();
    
    salesHistory.forEach(sale => {
      const damage = sale.vehicle_damage || 'Unknown';
      const price = typeof sale.purchase_price === 'string' 
        ? parseFloat(sale.purchase_price) 
        : sale.purchase_price;
        
      if (price && !isNaN(price) && price > 0) {
        if (!damageMap.has(damage)) {
          damageMap.set(damage, []);
        }
        damageMap.get(damage)!.push(price);
      }
    });

    const damageColors: Record<string, string> = {
      'Front End': '#ff6b6b',
      'Rear End': '#ffa726',
      'Side': '#66bb6a',
      'Hail': '#42a5f5',
      'Water/Flood': '#26a69a',
      'Fire': '#ff7043',
      'Theft': '#ab47bc',
      'All Over': '#78909c',
      'Unknown': '#bdbdbd'
    };

    const analysis: DamageData[] = Array.from(damageMap.entries()).map(([damage, prices]) => {
      const sortedPrices = [...prices].sort((a, b) => a - b);
      
      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      
      return {
        damage,
        average,
        min,
        max,
        median,
        count: prices.length,
        color: damageColors[damage] || '#78909c'
      };
    }).sort((a, b) => b.average - a.average);

    return analysis;
  }, [salesHistory]);

  return (
    <div className="space-y-6">
      <PermissionGate 
        permission="FULL_ANALYTICS"
        fallback={
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Lock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">
                Damage Analysis - Gold Feature
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                Analyze vehicle damage patterns and their impact on pricing with detailed breakdowns.
              </p>
              <Badge variant="outline" className="border-yellow-400 text-yellow-700 dark:text-yellow-300">
                Upgrade to Gold to unlock
              </Badge>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Damage Type Price Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {damageAnalysis.length > 0 ? (
              <div className="space-y-6">
                {/* Visual Chart FIRST - like original */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Damage Type Price Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={damageAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="damage"
                        type="category"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis 
                        type="number"
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 'Average Price']}
                        labelFormatter={(label) => `${label} Damage`}
                      />
                      <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                        {damageAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Clean Data Table SECOND - like original */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                          Damage Type
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                          Avg Price
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                          Price Range
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                          Sample Size
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                          Value Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {damageAnalysis.map((data, index) => (
                        <tr key={data.damage} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: data.color }}
                              />
                              {data.damage}
                            </div>
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                            {formatCurrency(data.average)}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                            {formatCurrency(data.min)} - {formatCurrency(data.max)}
                            <div className="text-xs text-gray-500">Median: {formatCurrency(data.median)}</div>
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                            {data.count} vehicles
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                            <span className="text-yellow-600">⭐ {Math.round(((data.max - data.average) / data.max) * 100)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                No damage data available for analysis
              </div>
            )}
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}