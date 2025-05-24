import { useMemo } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import PermissionGate from '../auth/PermissionGate';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        userRole={user?.role} 
        requiredRole={UserRole.GOLD}
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
        <div className="space-y-6">
          {/* Chart Section */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Damage Type Price Comparison
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={damageAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="damage" 
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrency(value as number),
                      'Average Price'
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
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    name="Average Price"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {damageAnalysis.length > 0 && (
                <>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Most Expensive</p>
                    <p className="font-bold text-green-800 dark:text-green-300">
                      {damageAnalysis[0]?.damage}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {formatCurrency(damageAnalysis[0]?.average || 0)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Most Common</p>
                    <p className="font-bold text-blue-800 dark:text-blue-300">
                      {damageAnalysis.reduce((max, current) => 
                        current.count > max.count ? current : max, damageAnalysis[0] || {count: 0, damage: 'N/A'}).damage}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {damageAnalysis.reduce((max, current) => 
                        current.count > max.count ? current : max, damageAnalysis[0] || {count: 0}).count} vehicles
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Best Value</p>
                    <p className="font-bold text-purple-800 dark:text-purple-300">
                      {damageAnalysis[damageAnalysis.length - 1]?.damage}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {formatCurrency(damageAnalysis[damageAnalysis.length - 1]?.average || 0)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Damage Types</p>
                    <p className="font-bold text-orange-800 dark:text-orange-300">
                      {damageAnalysis.length}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Total categories
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Damage Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Average Price</TableHead>
                  <TableHead>Min Price</TableHead>
                  <TableHead>Max Price</TableHead>
                  <TableHead>Median Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {damageAnalysis.map((data, index) => (
                  <TableRow key={data.damage}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: data.color }}
                        />
                        {data.damage}
                      </div>
                    </TableCell>
                    <TableCell>{data.count}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(data.average)}
                    </TableCell>
                    <TableCell className="text-green-600 dark:text-green-400">
                      {formatCurrency(data.min)}
                    </TableCell>
                    <TableCell className="text-red-600 dark:text-red-400">
                      {formatCurrency(data.max)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(data.median)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </PermissionGate>
    </div>
  );
}