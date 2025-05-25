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
      const price = typeof sale.purchase_price === 'string' ? parseFloat(sale.purchase_price) : sale.purchase_price;
      const mileage = sale.odometer || sale.vehicle_mileage;
      return price && !isNaN(price) && price > 0 && mileage && !isNaN(mileage) && mileage > 0;
    }),
    [salesHistory]
  );

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (validSales.length === 0) return { avg: 0, min: 0, max: 0, total: 0 };
    
    const prices = validSales.map(sale => sale.purchase_price).filter(price => price != null) as number[];
    const sum = prices.reduce((acc, price) => acc + price, 0);
    
    return {
      avg: sum / prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      total: validSales.length
    };
  }, [validSales]);

  // Price distribution data
  const priceDistribution = useMemo(() => {
    if (validSales.length === 0) return [];
    
    const ranges = [
      { label: 'Under $5K', min: 0, max: 5000, color: '#ef4444' },
      { label: '$5K-$10K', min: 5000, max: 10000, color: '#f97316' },
      { label: '$10K-$15K', min: 10000, max: 15000, color: '#eab308' },
      { label: '$15K-$20K', min: 15000, max: 20000, color: '#22c55e' },
      { label: '$20K-$30K', min: 20000, max: 30000, color: '#3b82f6' },
      { label: '$30K+', min: 30000, max: Infinity, color: '#8b5cf6' }
    ];
    
    return ranges.map(range => ({
      ...range,
      count: validSales.filter(sale => 
        sale.purchase_price! >= range.min && sale.purchase_price! < range.max
      ).length
    })).filter(range => range.count > 0);
  }, [validSales]);

  // Mileage vs Price correlation data
  const mileageVsPrice = useMemo(() => {
    return validSales.map(sale => ({
      mileage: sale.odometer || sale.vehicle_mileage || 0,
      price: sale.purchase_price!,
      vin: sale.vin.slice(-6), // Last 6 chars for tooltip
      year: sale.year,
      make: sale.make,
      model: sale.model
    }));
  }, [validSales]);

  // Damage type analysis data
  const damageTypeAnalysis = useMemo(() => {
    if (validSales.length === 0) return [];
    
    const damageMap = new Map<string, number[]>();
    const colors = ['#ff6b6b', '#66bb6a', '#42a5f5', '#ffa726', '#ab47bc', '#78909c'];
    
    validSales.forEach(sale => {
      const damage = sale.vehicle_damage || 'Unknown';
      const price = Number(sale.purchase_price!);
      
      if (!damageMap.has(damage)) {
        damageMap.set(damage, []);
      }
      damageMap.get(damage)!.push(price);
    });

    let colorIndex = 0;
    const result = Array.from(damageMap.entries()).map(([damage, prices]) => {
      prices.sort((a, b) => a - b);
      const sum = prices.reduce((acc, price) => acc + price, 0);
      const average = sum / prices.length;
      const median = prices[Math.floor(prices.length / 2)];
      
      return {
        damage,
        average: Math.round(average),
        min: Math.min(...prices),
        max: Math.max(...prices),
        median: Math.round(median),
        count: prices.length,
        color: colors[colorIndex++ % colors.length]
      };
    });

    return result.sort((a, b) => b.average - a.average);
  }, [validSales]);

  // Current month name for display
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (salesHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Sales Data Available</h3>
        <p className="text-gray-500 dark:text-gray-400">
          No vehicle sales history to analyze. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  if (validSales.length === 0) {
    return (
      <div className="text-center py-8">
        <Gauge className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Insufficient Data for Analysis</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Found {salesHistory.length} sales records, but they lack complete price and mileage data needed for analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Sales</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Average Price</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(stats.avg)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Lowest Price</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(stats.min)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Highest Price</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats.max)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      {validSales.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-indigo-500" />
              Market Insights for {currentMonth}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Price range spans <strong>{formatCurrency(stats.max - stats.min)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>{validSales.length}</strong> vehicles analyzed with complete data
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Tabs */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Price Distribution</TabsTrigger>
          <TabsTrigger value="scatter">Price vs Mileage</TabsTrigger>
          <TabsTrigger value="damage">Damage Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Distribution Analysis</CardTitle>
              <CardDescription>
                Clear breakdown of vehicle prices across different ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceDistribution.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={priceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        formatter={(value) => [value, 'Vehicles']}
                        labelFormatter={(label) => `Price Range: ${label}`}
                        contentStyle={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {priceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Distribution Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {priceDistribution.map((range, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: range.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                            {range.label}
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {range.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No price distribution data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scatter" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Price vs Mileage Analysis</CardTitle>
              <CardDescription>
                Interactive chart showing pricing patterns - hover points for vehicle details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mileageVsPrice.length > 0 ? (
                <div className="space-y-6">
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
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                  <div className="space-y-2">
                                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                                      {data.year} {data.make} {data.model}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      VIN: ...{data.vin}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                          {formatCurrency(data.price)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                          {data.mileage.toLocaleString()} mi
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter fill="#3b82f6" fillOpacity={0.7} stroke="#1e40af" strokeWidth={1} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Price per mile insights */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Low Mileage Gems</h5>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {mileageVsPrice.filter(item => item.mileage < 50000).length} vehicles under 50k miles
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                      <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">🎯 Sweet Spot</h5>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {mileageVsPrice.filter(item => item.mileage >= 50000 && item.mileage <= 100000).length} vehicles in 50k-100k range
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                      <h5 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">⚡ High Mileage</h5>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {mileageVsPrice.filter(item => item.mileage > 100000).length} vehicles over 100k miles
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No mileage vs price data available
                </div>
              )}
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
                    <table className="w-full min-w-[600px] border-collapse border border-gray-300 dark:border-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-3 text-left font-semibold text-sm">
                            Damage Type
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right font-semibold text-sm">
                            Count
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right font-semibold text-sm">
                            Average Price
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right font-semibold text-sm hidden sm:table-cell">
                            Price Range
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right font-semibold text-sm">
                            Median
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {damageTypeAnalysis.map((damage, index) => (
                          <tr key={damage.damage} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: damage.color }}
                                />
                                <span className="font-medium text-sm">{damage.damage}</span>
                              </div>
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right text-gray-600 dark:text-gray-400 text-sm">
                              {damage.count}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right font-semibold text-sm">
                              {formatCurrency(damage.average)}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                              {formatCurrency(damage.min)} - {formatCurrency(damage.max)}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 sm:px-4 py-3 text-right font-medium text-sm">
                              {formatCurrency(damage.median)}
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