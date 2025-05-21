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
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-neutral-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button 
                onClick={() => setActiveTab(TabType.TIMELINE)} 
                className={`flex-1 sm:flex-none whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                  activeTab === TabType.TIMELINE 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-1">timeline</span>
                  Price Timeline
                </span>
              </button>
              <button 
                onClick={() => setActiveTab(TabType.MAP)} 
                className={`flex-1 sm:flex-none whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                  activeTab === TabType.MAP 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-1">map</span>
                  Geographic
                </span>
              </button>
              <button 
                onClick={() => setActiveTab(TabType.TABLE)} 
                className={`flex-1 sm:flex-none whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm ${
                  activeTab === TabType.TABLE 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-1">view_list</span>
                  Sale Records
                </span>
              </button>
            </nav>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              <div className="mt-4 text-neutral-600">Loading sales history data...</div>
            </div>
          )}
          
          {/* Content based on active tab */}
          {!isLoading && data && (
            <>
              {activeTab === TabType.TIMELINE && (
                <SalesTimeline 
                  salesHistory={data.salesHistory}
                  priceTrend={data.priceTrend}
                />
              )}
              
              {activeTab === TabType.MAP && (
                <SalesGeographic 
                  geographicData={data.geographicData}
                />
              )}
              
              {activeTab === TabType.TABLE && (
                <SalesTable 
                  salesHistory={data.salesHistory}
                  selectedSaleId={selectedSaleId}
                  onSelectSale={setSelectedSaleId}
                />
              )}
            </>
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
