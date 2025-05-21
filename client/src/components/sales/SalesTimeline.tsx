import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { SaleHistoryResponse } from '@shared/schema';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';

interface SalesTimelineProps {
  salesHistory: SaleHistoryResponse['sale_history'];
  priceTrend: Array<{ month: string; avgPrice: number }>;
}

export default function SalesTimeline({ salesHistory, priceTrend }: SalesTimelineProps) {
  const [showDetailsFor, setShowDetailsFor] = useState<string | null>(null);

  // Sort sales by date
  const sortedSales = [...salesHistory].sort((a, b) => 
    new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );

  // Filter sales with valid purchase prices
  const salesWithPrices = sortedSales.filter(sale => sale.purchase_price !== undefined);

  // Prepare data for the chart
  const chartData = salesWithPrices.map(sale => ({
    id: sale.id,
    date: sale.sale_date,
    price: sale.purchase_price,
    formattedDate: formatDate(sale.sale_date),
    formattedPrice: formatCurrency(sale.purchase_price),
    state: sale.buyer_state,
    site: sale.base_site
  }));

  // Calculate statistics
  const prices = salesWithPrices.map(sale => sale.purchase_price!);
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const highestPrice = prices.length ? Math.max(...prices) : 0;
  const medianPrice = prices.length ? 
    prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0;

  // Get dates for lowest and highest prices
  const lowestPriceSale = salesWithPrices.find(sale => sale.purchase_price === lowestPrice);
  const highestPriceSale = salesWithPrices.find(sale => sale.purchase_price === highestPrice);

  // Calculate price trend percentage
  let trendPercentage = 0;
  if (sortedSales.length >= 2 && sortedSales[0].purchase_price && sortedSales[sortedSales.length - 1].purchase_price) {
    const firstPrice = sortedSales[0].purchase_price;
    const lastPrice = sortedSales[sortedSales.length - 1].purchase_price;
    trendPercentage = ((lastPrice - firstPrice) / firstPrice) * 100;
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

  return (
    <div className="p-4">
      <div className="chart-animation">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium">Sales Price History</h3>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <button className="bg-neutral-200 hover:bg-neutral-300 px-3 py-1.5 rounded text-sm">
              <span className="material-icons text-sm">settings</span>
            </button>
            <button className="bg-neutral-200 hover:bg-neutral-300 px-3 py-1.5 rounded text-sm">
              <span className="material-icons text-sm">file_download</span>
            </button>
          </div>
        </div>
        
        {/* Chart */}
        <div className="relative h-64 md:h-80 border border-neutral-200 rounded-lg">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="formattedDate" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['dataMin - 500', 'dataMax + 500']}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#1976d2" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "#1976d2" }} 
                  activeDot={{ r: 6, fill: "#1976d2" }}
                />
                {showDetailsFor && (
                  <ReferenceDot
                    x={chartData.find(d => d.id === showDetailsFor)?.formattedDate}
                    y={chartData.find(d => d.id === showDetailsFor)?.price}
                    r={8}
                    fill="#1976d2"
                    stroke="#1976d2"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500">
              No price data available for the selected period
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Lowest Price</div>
            <div className="text-lg font-medium">{formatCurrency(lowestPrice)}</div>
            <div className="text-xs text-neutral-500">
              {lowestPriceSale ? formatDate(lowestPriceSale.sale_date) : 'N/A'}
            </div>
          </div>
          
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Highest Price</div>
            <div className="text-lg font-medium">{formatCurrency(highestPrice)}</div>
            <div className="text-xs text-neutral-500">
              {highestPriceSale ? formatDate(highestPriceSale.sale_date) : 'N/A'}
            </div>
          </div>
          
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Median Price</div>
            <div className="text-lg font-medium">{formatCurrency(medianPrice)}</div>
            <div className={`flex items-center text-xs ${trendPercentage >= 0 ? 'text-success' : 'text-error'} mt-1`}>
              <span className="material-icons text-xs">
                {trendPercentage >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span className="ml-1">
                {trendPercentage >= 0 ? '+' : ''}{formatCurrency(medianPrice * Math.abs(trendPercentage) / 100)}
              </span>
            </div>
          </div>
          
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Price Trend</div>
            <div className="text-lg font-medium">
              {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500">Monthly</div>
          </div>
        </div>
      </div>
    </div>
  );
}
