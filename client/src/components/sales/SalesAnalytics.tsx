import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart, Pie
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Gauge, AlertTriangle, CheckCircle } from 'lucide-react';
import PermissionGate from '../auth/PermissionGate';

interface SalesAnalyticsProps {
  salesHistory: Array<{
    id: string;
    vin: string;
    sale_date: string;
    purchase_price?: number;
    sale_status: string;
    vehicle_damage?: string;
    vehicle_title?: string;
    odometer?: number;
    vehicle_mileage?: number;
    year?: number;
    make?: string;
    model?: string;
    series?: string;
  }>;
}

export default function SalesAnalytics({ salesHistory }: SalesAnalyticsProps) {
  // Clean and prepare data
  const validSales = useMemo(() => 
    salesHistory.filter(sale => {
      // Convert price to number, handling both string and number inputs
      const priceRaw = sale.purchase_price;
      const price = typeof priceRaw === 'string' ? parseFloat(priceRaw) : priceRaw;
      
      // Convert mileage to number
      const mileageRaw = sale.odometer || sale.vehicle_mileage;
      const mileage = typeof mileageRaw === 'string' ? parseFloat(mileageRaw) : mileageRaw;
      
      return price && !isNaN(price) && price > 0 && mileage && !isNaN(mileage) && mileage > 0;
    }).map(sale => ({
      ...sale,
      // Ensure all numeric fields are properly converted
      purchase_price: typeof sale.purchase_price === 'string' ? parseFloat(sale.purchase_price) : sale.purchase_price,
      odometer: sale.odometer ? (typeof sale.odometer === 'string' ? parseFloat(sale.odometer) : sale.odometer) : undefined,
      vehicle_mileage: sale.vehicle_mileage ? (typeof sale.vehicle_mileage === 'string' ? parseFloat(sale.vehicle_mileage) : sale.vehicle_mileage) : undefined
    })),
    [salesHistory]
  );

  // Price Distribution Data
  const priceDistribution = useMemo(() => {
    const ranges = [
      { range: '$0-5K', min: 0, max: 5000, count: 0, color: '#8884d8' },
      { range: '$5K-10K', min: 5000, max: 10000, count: 0, color: '#82ca9d' },
      { range: '$10K-15K', min: 10000, max: 15000, count: 0, color: '#ffc658' },
      { range: '$15K-20K', min: 15000, max: 20000, count: 0, color: '#ff7300' },
      { range: '$20K+', min: 20000, max: Infinity, count: 0, color: '#d084d0' }
    ];

    validSales.forEach(sale => {
      const price = sale.purchase_price || 0;
      const range = ranges.find(r => price >= r.min && price < r.max);
      if (range) range.count++;
    });

    return ranges.filter(r => r.count > 0);
  }, [validSales]);

  // Mileage vs Price Data - Organized and sorted for clear patterns
  const mileageVsPrice = useMemo(() => 
    validSales
      .map(sale => ({
        mileage: sale.odometer || sale.vehicle_mileage || 0,
        price: sale.purchase_price || 0,
        damage: sale.vehicle_damage || 'Unknown',
        title: sale.vehicle_title || 'Unknown',
        year: sale.year || 2020,
        model: `${sale.year} ${sale.make} ${sale.model} ${sale.series || ''}`.trim(),
        id: sale.id || sale.vin
      }))
      .sort((a, b) => a.mileage - b.mileage), // Sort by mileage for logical progression
    [validSales]
  );

  // Damage Type Analysis
  const damageTypeAnalysis = useMemo(() => {
    if (validSales.length === 0) return [];
    
    const damageMap = new Map();
    
    validSales.forEach(sale => {
      const damage = sale.vehicle_damage || 'Unknown';
      const price = Number(sale.purchase_price) || 0;
      
      if (price > 0) {
        if (!damageMap.has(damage)) {
          damageMap.set(damage, { prices: [], count: 0 });
        }
        
        damageMap.get(damage).prices.push(price);
        damageMap.get(damage).count++;
      }
    });

    const result = Array.from(damageMap.entries()).map(([damage, data]) => {
      const prices = data.prices.sort((a: number, b: number) => a - b);
      const avg = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
      const min = prices[0];
      const max = prices[prices.length - 1];
      const median = prices[Math.floor(prices.length / 2)];
      
      return {
        damage,
        average: Math.round(avg),
        min,
        max,
        median,
        count: data.count,
        color: getDamageColor(damage)
      };
    }).sort((a, b) => b.average - a.average);

    console.log('Damage analysis data:', result);
    return result;
  }, [validSales]);

  // Enhanced Summary Stats
  const summaryStats = useMemo(() => {
    if (validSales.length === 0) return null;

    const prices = validSales.map(s => s.purchase_price || 0);
    const mileages = validSales.map(s => s.odometer || s.vehicle_mileage || 0);
    const soldCount = validSales.filter(s => s.sale_status === 'Sold').length;
    
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgMileage = mileages.reduce((sum, m) => sum + m, 0) / mileages.length;
    
    const bestValue = validSales.reduce((best, current) => {
      const currentRatio = (current.purchase_price || 0) / ((current.odometer || current.vehicle_mileage || 1) / 1000);
      const bestRatio = (best.purchase_price || 0) / ((best.odometer || best.vehicle_mileage || 1) / 1000);
      return currentRatio < bestRatio ? current : best;
    });

    return {
      totalResults: validSales.length,
      soldRate: (soldCount / validSales.length) * 100,
      avgPrice,
      minPrice,
      maxPrice,
      avgMileage,
      bestValue,
      priceRange: maxPrice - minPrice
    };
  }, [validSales]);

  // Color helper for damage types
  function getDamageColor(damage: string): string {
    const colors = {
      'Front End': '#ff6b6b',
      'Rear End': '#ffa726',
      'Side': '#66bb6a',
      'Hail': '#42a5f5',
      'Water/Flood': '#26c6da',
      'Fire': '#ef5350',
      'Theft': '#ab47bc',
      'Unknown': '#78909c'
    };
    return colors[damage] || '#78909c';
  }

  if (validSales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>No valid sales data available for analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{formatCurrency(summaryStats.avgPrice)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Range: {formatCurrency(summaryStats.minPrice)} - {formatCurrency(summaryStats.maxPrice)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sale Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{summaryStats.soldRate.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {validSales.filter(s => s.sale_status === 'Sold').length} of {summaryStats.totalResults} sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Mileage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-orange-600" />
                <span className="text-2xl font-bold">{Math.round(summaryStats.avgMileage).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">miles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Best Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-lg font-bold">{formatCurrency(summaryStats.bestValue.purchase_price || 0)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((summaryStats.bestValue.odometer || summaryStats.bestValue.vehicle_mileage || 0) / 1000)}k miles
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Tabs */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Price Distribution</TabsTrigger>
          <TabsTrigger value="scatter">Mileage vs Price</TabsTrigger>
          <TabsTrigger value="damage">Damage Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="mt-6">
          <PermissionGate permission="FULL_ANALYTICS">
            <Card>
              <CardHeader>
                <CardTitle>Price Distribution</CardTitle>
                <CardDescription>
                  How prices are distributed across {validSales.length} vehicles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} vehicles`, 'Count']}
                      labelFormatter={(label) => `Price Range: ${label}`}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {priceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </PermissionGate>
        </TabsContent>

        <TabsContent value="scatter" className="mt-6">
          <PermissionGate permission="FULL_ANALYTICS">
            <Card>
              <CardHeader>
                <CardTitle>Mileage vs Price Analysis</CardTitle>
                <CardDescription>
                  Clear correlation between mileage and price - organized by mileage ranges for easy comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-6">
                {/* Beautiful Interactive Chart - Enhanced Design */}
                <div className="relative">
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        💎 Price vs Mileage Analysis
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Hover points for vehicle details</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Discover pricing patterns across {mileageVsPrice.filter(item => item.mileage > 0).length} vehicles
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart 
                        data={mileageVsPrice.filter(item => item.mileage > 0)}
                        margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#e5e7eb" 
                          strokeOpacity={0.6}
                        />
                        <XAxis 
                          dataKey="mileage" 
                          name="Mileage"
                          type="number"
                          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                          domain={['dataMin - 5000', 'dataMax + 5000']}
                          stroke="#6b7280"
                          fontSize={12}
                          tickLine={{ stroke: '#6b7280' }}
                          axisLine={{ stroke: '#6b7280' }}
                        />
                        <YAxis 
                          dataKey="price" 
                          name="Price"
                          type="number"
                          tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                          domain={['dataMin - 1000', 'dataMax + 1000']}
                          stroke="#6b7280"
                          fontSize={12}
                          tickLine={{ stroke: '#6b7280' }}
                          axisLine={{ stroke: '#6b7280' }}
                          width={60}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const pricePerMile = (data.price / data.mileage).toFixed(2);
                              return (
                                <div className="bg-white dark:bg-gray-900 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
                                  <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                                    {data.model}
                                  </p>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Price:</span>
                                      <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                        {formatCurrency(data.price)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                                      <span className="font-mono">{data.mileage.toLocaleString()} mi</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Per Mile:</span>
                                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                        ${pricePerMile}
                                      </span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Damage:</span>
                                        <span className="font-medium">{data.damage}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Title:</span>
                                        <span className="font-medium">{data.title}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter 
                          dataKey="price" 
                          fill="#3b82f6" 
                          fillOpacity={0.8}
                          stroke="#1d4ed8"
                          strokeWidth={1}
                          r={6}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Chart Legend & Quick Stats */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {mileageVsPrice.length > 0 && (
                      <>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Lowest Mileage</p>
                          <p className="font-bold text-green-800 dark:text-green-300">
                            {Math.min(...mileageVsPrice.filter(i => i.mileage > 0).map(i => i.mileage)).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Highest Price</p>
                          <p className="font-bold text-blue-800 dark:text-blue-300">
                            {formatCurrency(Math.max(...mileageVsPrice.map(i => i.price)))}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Best Value</p>
                          <p className="font-bold text-purple-800 dark:text-purple-300">
                            {(() => {
                              const bestValue = mileageVsPrice
                                .filter(i => i.mileage > 0)
                                .reduce((best, current) => 
                                  (current.price / current.mileage) < (best.price / best.mileage) ? current : best
                                );
                              return `$${(bestValue.price / bestValue.mileage).toFixed(2)}/mi`;
                            })()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Total Vehicles</p>
                          <p className="font-bold text-orange-800 dark:text-orange-300">
                            {mileageVsPrice.filter(i => i.mileage > 0).length}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Smart Value Teaser - Shows potential without giving it all away */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">🚀 Unlock Advanced Insights</h4>
                  <div className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
                    <p className="font-medium">Gold Members Get Access To:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Complete vehicle breakdown table</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Price-per-mile calculations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Damage type filtering</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Location-based comparisons</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-200 dark:border-purple-700">
                      <span className="text-xs">Currently viewing: {mileageVsPrice.filter(i => i.mileage > 0).length} vehicles</span>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Upgrade to Gold
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </PermissionGate>
        </TabsContent>

        <TabsContent value="damage" className="mt-6">
          <PermissionGate permission="FULL_ANALYTICS">
            <Card>
              <CardHeader>
                <CardTitle>Damage Type Price Analysis</CardTitle>
                <CardDescription>
                Clear pricing breakdown by damage type - organized for easy comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {damageTypeAnalysis.length > 0 ? (
                <div className="space-y-6">
                  {/* Clean Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-semibold">
                            Damage Type
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                            Count
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                            Average Price
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                            Price Range
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-semibold">
                            Median
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {damageTypeAnalysis.slice(0, 1).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="font-medium">{item.damage}</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                              <span className="font-mono">{item.count}</span>
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                              <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(item.average)}
                              </span>
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                              <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                {formatCurrency(item.min)} - {formatCurrency(item.max)}
                              </span>
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right">
                              <span className="font-mono">{formatCurrency(item.median)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Upgrade Teaser for additional damage types */}
                    {damageTypeAnalysis.length > 1 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-blue-800 dark:text-blue-200">
                              🔍 {damageTypeAnalysis.length - 1} more damage types to analyze!
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              See complete damage breakdown, title analysis, and geographic trends with Gold
                            </p>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                            Upgrade to Gold
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visual Chart */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4">Visual Comparison</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={damageTypeAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
                          {damageTypeAnalysis.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}