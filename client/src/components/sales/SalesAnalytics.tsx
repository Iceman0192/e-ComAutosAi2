import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart, Pie
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Gauge, AlertTriangle, CheckCircle } from 'lucide-react';

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
        </TabsContent>

        <TabsContent value="scatter" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mileage vs Price Analysis</CardTitle>
              <CardDescription>
                Relationship between vehicle mileage and sale price
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={mileageVsPrice}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mileage" 
                    name="Mileage"
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <YAxis 
                    dataKey="price" 
                    name="Price"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'price' ? formatCurrency(value) : `${value.toLocaleString()} miles`,
                      name === 'price' ? 'Sale Price' : 'Mileage'
                    ]}
                    labelFormatter={() => ''}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow">
                            <p className="font-semibold">{data.model}</p>
                            <p>Price: {formatCurrency(data.price)}</p>
                            <p>Mileage: {data.mileage.toLocaleString()} miles</p>
                            <p>Damage: {data.damage}</p>
                            <p>Title: {data.title}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter dataKey="price" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="damage" className="mt-6">
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
                        {damageTypeAnalysis.map((item, index) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}