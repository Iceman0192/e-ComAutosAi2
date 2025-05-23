import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceDot, ComposedChart, Bar, BarChart,
  Legend, Brush, Area
} from 'recharts';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

interface SalesTimelineProps {
  salesHistory: Array<{
    id: string;
    vin: string;
    sale_date: string;
    purchase_price?: number;
    sale_status: string;
    buyer_state?: string;
    buyer_country?: string;
    base_site: string;
    vehicle_damage?: string;
    vehicle_title?: string;
    odometer?: number;
    auction_location?: string;
  }>;
  priceTrend: Array<{ month: string; avgPrice: number }>;
}

export default function SalesTimeline({ salesHistory, priceTrend }: SalesTimelineProps) {
  const [showDetailsFor, setShowDetailsFor] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("all");
  const [damageFilter, setDamageFilter] = useState<string>("all");
  const [titleFilter, setTitleFilter] = useState<string>("all");
  const [chartType, setChartType] = useState<string>("price");
  
  // Sort sales by date
  const sortedSales = useMemo(() => 
    [...salesHistory].sort((a, b) => 
      new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
    ), [salesHistory]
  );

  // Apply filters
  const filteredSales = useMemo(() => {
    let filtered = [...sortedSales];
    
    // Apply time range filter
    if (timeRange !== "all") {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (timeRange) {
        case "1m":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "3m":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "6m":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "1y":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(sale => 
        new Date(sale.sale_date) >= cutoffDate
      );
    }
    
    // Apply damage filter
    if (damageFilter !== "all") {
      filtered = filtered.filter(sale => 
        damageFilter === "unknown" 
          ? !sale.vehicle_damage
          : sale.vehicle_damage?.toLowerCase().includes(damageFilter.toLowerCase())
      );
    }
    
    // Apply title filter
    if (titleFilter !== "all") {
      filtered = filtered.filter(sale => 
        titleFilter === "unknown"
          ? !sale.vehicle_title 
          : sale.vehicle_title?.toLowerCase().includes(titleFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [sortedSales, timeRange, damageFilter, titleFilter]);

  // Filter sales with valid purchase prices
  const salesWithPrices = useMemo(() => 
    filteredSales.filter(sale => sale.purchase_price !== undefined), 
    [filteredSales]
  );

  // Get unique damage types and title statuses for filters
  const damageTypes = useMemo(() => {
    const types = new Set<string>();
    salesHistory.forEach(sale => {
      if (sale.vehicle_damage) {
        types.add(sale.vehicle_damage);
      }
    });
    return Array.from(types);
  }, [salesHistory]);

  const titleTypes = useMemo(() => {
    const types = new Set<string>();
    salesHistory.forEach(sale => {
      if (sale.vehicle_title) {
        types.add(sale.vehicle_title);
      }
    });
    return Array.from(types);
  }, [salesHistory]);

  // Generate monthly aggregated data
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, {
      month: string,
      count: number,
      totalPrice: number,
      avgPrice: number,
      cleanTitleCount: number,
      salvageTitleCount: number,
      minorDamageCount: number,
      majorDamageCount: number
    }> = {};

    for (const sale of salesWithPrices) {
      const date = new Date(sale.sale_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthDisplay = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthDisplay,
          count: 0,
          totalPrice: 0,
          avgPrice: 0,
          cleanTitleCount: 0,
          salvageTitleCount: 0,
          minorDamageCount: 0,
          majorDamageCount: 0
        };
      }
      
      const monthData = monthMap[monthKey];
      monthData.count += 1;
      
      if (sale.purchase_price) {
        // Convert string price to number if needed
        const price = typeof sale.purchase_price === 'string' 
          ? parseFloat(sale.purchase_price) 
          : sale.purchase_price;
        if (!isNaN(price) && isFinite(price)) {
          monthData.totalPrice += price;
        }
      }
      
      if (sale.vehicle_title?.toLowerCase().includes('clean')) {
        monthData.cleanTitleCount += 1;
      } else if (sale.vehicle_title?.toLowerCase().includes('salvage')) {
        monthData.salvageTitleCount += 1;
      }
      
      if (sale.vehicle_damage?.toLowerCase().includes('minor')) {
        monthData.minorDamageCount += 1;
      } else if (sale.vehicle_damage) {
        monthData.majorDamageCount += 1;
      }
    }
    
    // Calculate average prices
    Object.values(monthMap).forEach(data => {
      data.avgPrice = data.count > 0 ? data.totalPrice / data.count : 0;
    });
    
    // Convert to array and sort chronologically
    return Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [salesWithPrices]);

  // Prepare detailed data for the chart
  const chartData = useMemo(() => 
    salesWithPrices.map(sale => ({
      id: sale.id,
      date: sale.sale_date,
      price: sale.purchase_price,
      formattedDate: formatDate(sale.sale_date),
      formattedPrice: formatCurrency(sale.purchase_price),
      state: sale.buyer_state || 'Unknown',
      site: sale.base_site,
      damage: sale.vehicle_damage || 'Unknown',
      title: sale.vehicle_title || 'Unknown',
      location: sale.auction_location || 'Unknown',
      odometer: sale.odometer || 0
    })), 
    [salesWithPrices]
  );

  // Calculate statistics - ensure numeric values
  const prices = salesWithPrices.map(sale => {
    // Convert string price to number if needed
    return typeof sale.purchase_price === 'string' 
      ? parseFloat(sale.purchase_price) 
      : (sale.purchase_price || 0);
  });
  
  // Filter out any NaN values
  const validPrices = prices.filter(price => !isNaN(price) && isFinite(price));
  
  const lowestPrice = validPrices.length ? Math.min(...validPrices) : 0;
  const highestPrice = validPrices.length ? Math.max(...validPrices) : 0;
  const medianPrice = validPrices.length ? 
    [...validPrices].sort((a, b) => a - b)[Math.floor(validPrices.length / 2)] : 0;
  const avgPrice = validPrices.length ? 
    validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length : 0;

  // Get dates for lowest and highest prices - with type safety
  const lowestPriceSale = salesWithPrices.find(sale => {
    const salePrice = typeof sale.purchase_price === 'string' 
      ? parseFloat(sale.purchase_price) 
      : (sale.purchase_price || 0);
    return salePrice === lowestPrice;
  });
  
  const highestPriceSale = salesWithPrices.find(sale => {
    const salePrice = typeof sale.purchase_price === 'string' 
      ? parseFloat(sale.purchase_price) 
      : (sale.purchase_price || 0);
    return salePrice === highestPrice;
  });

  // Calculate price trend percentage with string/number type safety
  let trendPercentage = 0;
  if (salesWithPrices.length >= 2) {
    const firstPriceVal = typeof salesWithPrices[0].purchase_price === 'string' 
      ? parseFloat(salesWithPrices[0].purchase_price) 
      : (salesWithPrices[0].purchase_price || 0);
    
    const lastPriceVal = typeof salesWithPrices[salesWithPrices.length - 1].purchase_price === 'string'
      ? parseFloat(salesWithPrices[salesWithPrices.length - 1].purchase_price)
      : (salesWithPrices[salesWithPrices.length - 1].purchase_price || 0);
    
    if (firstPriceVal > 0) {
      trendPercentage = ((lastPriceVal - firstPriceVal) / firstPriceVal) * 100;
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-neutral-200 rounded shadow-sm text-xs">
          <p className="font-medium">{payload[0].payload.formattedDate}</p>
          <p className="text-primary">{payload[0].payload.formattedPrice}</p>
          <p className="text-neutral-500">{payload[0].payload.site} - {payload[0].payload.state}</p>
        </div>
      );
    }
    return null;
  };

  const MonthlyAggregateTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md text-sm">
          <p className="font-semibold">{data.month}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
            <p className="text-gray-600 dark:text-gray-300">Avg Price:</p>
            <p className="font-medium text-right">{formatCurrency(data.avgPrice)}</p>
            
            <p className="text-gray-600 dark:text-gray-300">Sales:</p>
            <p className="font-medium text-right">{data.count}</p>
            
            {data.cleanTitleCount > 0 && (
              <>
                <p className="text-gray-600 dark:text-gray-300">Clean Title:</p>
                <p className="font-medium text-right">{data.cleanTitleCount}</p>
              </>
            )}
            
            {data.salvageTitleCount > 0 && (
              <>
                <p className="text-gray-600 dark:text-gray-300">Salvage Title:</p>
                <p className="font-medium text-right">{data.salvageTitleCount}</p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="chart-animation">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Price History</h3>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
                <TabsList className="grid grid-cols-5 w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="1m">1M</TabsTrigger>
                  <TabsTrigger value="3m">3M</TabsTrigger>
                  <TabsTrigger value="6m">6M</TabsTrigger>
                  <TabsTrigger value="1y">1Y</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="Chart Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price Trend</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="combined">Price & Volume</SelectItem>
                  <SelectItem value="comparison">Title Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={damageFilter} onValueChange={setDamageFilter}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="Damage Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Damage Types</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
                {damageTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={titleFilter} onValueChange={setTitleFilter}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="Title Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Title Types</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
                {titleTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-sm ml-auto text-gray-500 dark:text-gray-400">
              {salesWithPrices.length} sales • Average: {formatCurrency(avgPrice)}
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="relative h-80 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Price Trend Chart */}
          {chartType === 'price' && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.2)" />
                <XAxis 
                  dataKey="formattedDate" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                  tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Brush 
                  dataKey="formattedDate"
                  height={30}
                  stroke="#8884d8"
                  fill="rgba(136, 132, 216, 0.1)"
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  name="Sale Price"
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 2, fill: "#3b82f6" }} 
                  activeDot={{ r: 6, fill: "#3b82f6", stroke: "white", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : chartType === 'volume' && monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.2)" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toString()}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<MonthlyAggregateTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="Sales Volume"
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : chartType === 'combined' && monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.2)" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `$${Math.round(value).toLocaleString()}`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => value.toString()}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<MonthlyAggregateTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  yAxisId="right"
                  dataKey="count" 
                  name="Sales Volume"
                  fill="rgba(59, 130, 246, 0.6)" 
                  radius={[4, 4, 0, 0]}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgPrice" 
                  name="Avg. Price"
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "#10b981", stroke: "white", strokeWidth: 1 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : chartType === 'comparison' && monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.2)" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toString()}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<MonthlyAggregateTooltip />} />
                <Legend verticalAlign="top" height={36} />
                <Area 
                  type="monotone"
                  dataKey="cleanTitleCount" 
                  stackId="1"
                  name="Clean Title"
                  fill="#10b981" 
                  stroke="#10b981"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone"
                  dataKey="salvageTitleCount" 
                  stackId="1"
                  name="Salvage Title"
                  fill="#ef4444" 
                  stroke="#ef4444"
                  fillOpacity={0.6}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No price data available for the selected filters
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">Lowest Price</div>
            <div className="text-xl font-semibold mt-1 text-gray-900 dark:text-white">{formatCurrency(lowestPrice)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lowestPriceSale ? formatDate(lowestPriceSale.sale_date) : 'N/A'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">Highest Price</div>
            <div className="text-xl font-semibold mt-1 text-gray-900 dark:text-white">{formatCurrency(highestPrice)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {highestPriceSale ? formatDate(highestPriceSale.sale_date) : 'N/A'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">Average Price</div>
            <div className="text-xl font-semibold mt-1 text-gray-900 dark:text-white">{formatCurrency(avgPrice)}</div>
            {trendPercentage !== 0 && (
              <div className={`flex items-center text-xs mt-1 ${trendPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="mr-1">{trendPercentage >= 0 ? '↑' : '↓'}</span>
                <span>{formatPercentage(Math.abs(trendPercentage))}</span>
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Sales</div>
            <div className="text-xl font-semibold mt-1 text-gray-900 dark:text-white">{salesWithPrices.length}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Date Range:</span>
              <span className="text-xs font-medium">
                {timeRange === 'all' ? 'All Time' : 
                 timeRange === '1m' ? '1 Month' : 
                 timeRange === '3m' ? '3 Months' : 
                 timeRange === '6m' ? '6 Months' : '1 Year'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
