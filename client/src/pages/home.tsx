import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import VehicleInfo from "@/components/sales/VehicleInfo";
import SummaryStatistics from "@/components/sales/SummaryStatistics";
import SalesTimeline from "@/components/sales/SalesTimeline";
import SalesGeographic from "@/components/sales/SalesGeographic";
import SalesTable from "@/components/sales/SalesTable";
import SaleDetail from "@/components/sales/SaleDetail";
import { useFilterState } from "@/hooks/useFilterState";
import { useSalesHistory } from "@/hooks/useSalesHistory";

enum TabType {
  TIMELINE = "timeline",
  MAP = "map",
  TABLE = "table"
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TIMELINE);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  
  const filterState = useFilterState();
  const { data, isLoading, refetch } = useSalesHistory(filterState);

  return (
    <AppLayout 
      filterState={filterState}
      onRefresh={() => refetch()}
    >
      <div className="space-y-6">
        {/* Vehicle Info */}
        <VehicleInfo 
          vehicle={data?.vehicle}
          salesCount={data?.salesHistory.length || 0}
          priceTrend={data?.stats?.priceTrend || 0}
          isLoading={isLoading}
        />
        
        {/* Summary Statistics */}
        <SummaryStatistics 
          stats={data?.stats}
          isLoading={isLoading}
        />
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex px-4 pt-4" aria-label="Tabs">
              <button 
                onClick={() => setActiveTab(TabType.TIMELINE)} 
                className={`relative flex items-center px-5 py-3 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === TabType.TIMELINE 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-2">show_chart</span>
                  Price Timeline
                </span>
                {activeTab === TabType.TIMELINE && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab(TabType.MAP)} 
                className={`relative flex items-center px-5 py-3 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === TabType.MAP 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-2">public</span>
                  Geographic
                </span>
                {activeTab === TabType.MAP && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab(TabType.TABLE)} 
                className={`relative flex items-center px-5 py-3 rounded-t-lg font-medium text-sm transition-colors ${
                  activeTab === TabType.TABLE 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-2">view_list</span>
                  Sale Records
                </span>
                {activeTab === TabType.TABLE && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                )}
              </button>
            </nav>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="p-12 flex flex-col items-center justify-center bg-gray-50 bg-opacity-50">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              <div className="mt-4 text-gray-600 font-medium">Loading sales history data...</div>
            </div>
          )}
          
          {/* Content based on active tab */}
          {!isLoading && data && (
            <div className="p-5">
              {activeTab === TabType.TIMELINE && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="material-icons text-blue-500 mr-2">trending_up</span>
                    Price Trend Analysis
                  </h3>
                  <SalesTimeline 
                    salesHistory={data.salesHistory}
                    priceTrend={data.priceTrend}
                  />
                </div>
              )}
              
              {activeTab === TabType.MAP && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="material-icons text-blue-500 mr-2">location_on</span>
                    Geographic Distribution
                  </h3>
                  <SalesGeographic 
                    geographicData={data.geographicData}
                  />
                </div>
              )}
              
              {activeTab === TabType.TABLE && (
                <div className="bg-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="material-icons text-blue-500 mr-2">receipt_long</span>
                    Sales Records
                  </h3>
                  <SalesTable 
                    salesHistory={data.salesHistory}
                    selectedSaleId={selectedSaleId}
                    onSelectSale={setSelectedSaleId}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Selected Sale Detail */}
        {selectedSaleId && !isLoading && data && (
          <SaleDetail 
            sale={data.salesHistory.find(sale => sale.id === selectedSaleId)}
            onClose={() => setSelectedSaleId(null)}
            averagePrice={data.stats?.averagePrice || 0}
          />
        )}
      </div>
    </AppLayout>
  );
}
