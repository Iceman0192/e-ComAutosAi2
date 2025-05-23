import { Dispatch, SetStateAction } from "react";
import { FilterState } from "@/hooks/useFilterState";

interface MobileFiltersProps {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  filterState: FilterState;
  onApply: () => void;
}

export default function MobileFilters({
  show,
  setShow,
  filterState,
  onApply
}: MobileFiltersProps) {
  const {
    dateRange,
    setDateRange,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
    vin,
    setVin,
    make,
    setMake,
    model,
    setModel,
    saleStatus,
    setSaleStatus,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    buyerLocation,
    setBuyerLocation,
    sites,
    setSites
  } = filterState;
  
  // Helper function to update sale status
  const updateSaleStatus = (status: string, checked: boolean) => {
    if (checked) {
      setSaleStatus([...saleStatus, status]);
    } else {
      setSaleStatus(saleStatus.filter(s => s !== status));
    }
  };

  // Helper function to update sites
  const updateSites = (site: string, checked: boolean) => {
    if (checked) {
      setSites([...sites, site]);
    } else {
      setSites(sites.filter(s => s !== site));
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 z-40 ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShow(false)}
      />
      
      {/* Mobile drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 z-50 rounded-l-2xl ${
          show ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-50 rounded-tl-2xl">
            <h2 className="font-semibold text-gray-800 text-lg flex items-center">
              <span className="material-icons text-blue-600 mr-2">tune</span>
              Filter Options
            </h2>
            <button 
              onClick={() => setShow(false)} 
              className="text-gray-500 hover:text-gray-700 hover:bg-blue-100 p-2 rounded-full transition-colors"
              aria-label="Close filters"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          {/* Filter content with smooth scrolling */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Search fields */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="material-icons text-blue-500 mr-2 text-sm">search</span>
                Search Vehicle
              </h3>
              
              <div className="space-y-3">
                {/* Make field */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Make</label>
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-2.5 text-blue-500">directions_car</span>
                    <input 
                      type="text" 
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="Toyota" 
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>
                
                {/* Model field */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-2.5 text-blue-500">straighten</span>
                    <input 
                      type="text" 
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Tacoma" 
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>
                
                {/* Optional VIN field */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">VIN (Optional)</label>
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-2.5 text-blue-500">qr_code</span>
                    <input 
                      type="text" 
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      placeholder="Vehicle Identification Number" 
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Date Range */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="material-icons text-blue-500 mr-2 text-sm">calendar_month</span>
                Date Range
              </h3>
              <div className="space-y-2">
                <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
                  <input 
                    type="radio" 
                    checked={dateRange === 'last3m'}
                    onChange={() => setDateRange('last3m')}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm">Last 3 Months</span>
                </label>
                <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
                  <input 
                    type="radio" 
                    checked={dateRange === 'last6m'}
                    onChange={() => setDateRange('last6m')}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm">Last 6 Months</span>
                </label>
                <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
                  <input 
                    type="radio" 
                    checked={dateRange === 'lasty'}
                    onChange={() => setDateRange('lasty')}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm">Last Year</span>
                </label>
                <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
                  <input 
                    type="radio" 
                    checked={dateRange === 'custom'}
                    onChange={() => setDateRange('custom')}
                    className="text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm">Custom Range</span>
                </label>
                
                {dateRange === 'custom' && (
                  <div className="pt-2 space-y-2 border-t border-gray-200 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                      <input 
                        type="date" 
                        value={customDateStart}
                        onChange={(e) => setCustomDateStart(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                      <input 
                        type="date" 
                        value={customDateEnd}
                        onChange={(e) => setCustomDateEnd(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sale Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="material-icons text-blue-500 mr-2 text-sm">sell</span>
                Sale Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
                  <input 
                    type="checkbox" 
                    checked={saleStatus.includes('Sold')}
                    onChange={(e) => updateSaleStatus('Sold', e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500 rounded" 
                  />
                  <span className="ml-2 text-sm">Sold</span>
                </label>
                <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
                  <input 
                    type="checkbox" 
                    checked={saleStatus.includes('Not Sold')}
                    onChange={(e) => updateSaleStatus('Not Sold', e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500 rounded" 
                  />
                  <span className="ml-2 text-sm">Not Sold</span>
                </label>
              </div>
            </div>
            
            {/* Price Range */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <span className="material-icons text-blue-500 mr-2 text-sm">attach_money</span>
                Price Range
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min ($)</label>
                  <input 
                    type="number" 
                    value={priceMin || ''}
                    onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max ($)</label>
                  <input 
                    type="number" 
                    value={priceMax || ''}
                    onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="50000" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>
            </div>
            

          </div>
          
          {/* Footer */}
          <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white">
            <div className="flex gap-2">
              <button 
                onClick={() => setShow(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onApply();
                  setShow(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm flex items-center justify-center"
              >
                <span className="material-icons mr-2 text-sm">check</span>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
