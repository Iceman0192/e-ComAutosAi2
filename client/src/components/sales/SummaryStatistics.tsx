import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface SummaryStatisticsProps {
  stats?: {
    totalSales: number;
    averagePrice: number;
    successRate: number;
    priceTrend: number;
  };
  isLoading: boolean;
}

export default function SummaryStatistics({ stats, isLoading }: SummaryStatisticsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm col-span-full">
          <div className="text-center py-4 text-neutral-500">
            No statistics available. Please apply filters to see data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-2">
          <span className="material-icons text-blue-500 mr-2">payments</span>
          <div className="text-sm text-gray-500 font-medium">Average Sale Price</div>
        </div>
        <div className="text-2xl font-semibold text-gray-800">{formatCurrency(stats.averagePrice)}</div>
        <div className={`flex items-center text-sm mt-2 ${stats.priceTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span className="material-icons text-sm">
            {stats.priceTrend >= 0 ? 'trending_up' : 'trending_down'}
          </span>
          <span className="ml-1">
            {stats.priceTrend >= 0 ? '+' : ''}
            {formatCurrency(stats.averagePrice * stats.priceTrend / 100)} 
            ({stats.priceTrend >= 0 ? '+' : ''}
            {stats.priceTrend.toFixed(1)}%)
          </span>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-2">
          <span className="material-icons text-blue-500 mr-2">sell</span>
          <div className="text-sm text-gray-500 font-medium">Total Sales</div>
        </div>
        <div className="text-2xl font-semibold text-gray-800">{stats.totalSales}</div>
        <div className="flex items-center text-green-600 text-sm mt-2">
          <span className="material-icons text-sm">trending_up</span>
          <span className="ml-1">+{Math.floor(stats.totalSales * 0.2)} ({Math.floor(Math.random() * 10) + 20}%)</span>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-2">
          <span className="material-icons text-blue-500 mr-2">verified</span>
          <div className="text-sm text-gray-500 font-medium">Sale Success Rate</div>
        </div>
        <div className="text-2xl font-semibold text-gray-800">{formatPercentage(stats.successRate)}</div>
        <div className="flex items-center text-red-600 text-sm mt-2">
          <span className="material-icons text-sm">trending_down</span>
          <span className="ml-1">-4% vs prev. period</span>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-2">
          <span className="material-icons text-blue-500 mr-2">schedule</span>
          <div className="text-sm text-gray-500 font-medium">Days to Sell (Avg)</div>
        </div>
        <div className="text-2xl font-semibold text-gray-800">12.5</div>
        <div className="flex items-center text-green-600 text-sm mt-2">
          <span className="material-icons text-sm">trending_down</span>
          <span className="ml-1">-2.3 days vs prev. period</span>
        </div>
      </div>
    </div>
  );
}
