import { Dispatch, SetStateAction } from "react";
import { FilterState } from "@/hooks/useFilterState";

interface FilterSidebarProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  filterState: FilterState;
  onApply: () => void;
}

export default function FilterSidebar({
  isOpen,
  setIsOpen,
  filterState,
  onApply
}: FilterSidebarProps) {
  const {
    dateRange,
    setDateRange,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
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
    <aside 
      className={`lg:col-span-3 bg-white p-5 rounded-lg shadow-md fixed lg:sticky top-[5.5rem] h-[calc(100vh-5.5rem)] lg:h-[calc(100vh-6.5rem)] w-80 lg:w-auto overflow-y-auto lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-semibold text-gray-800 text-lg flex items-center">
            <span className="material-icons mr-2 text-blue-500">tune</span>
            <span>Filters</span>
          </h2>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
            aria-label="Close filters"
          >
            <span className="material-icons">close</span>
          </button>
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
          <div className="space-y-2">
            <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
              <input 
                type="checkbox" 
                checked={saleStatus.includes('Sold')}
                onChange={(e) => updateSaleStatus('Sold', e.target.checked)}
                className="text-blue-600 focus:ring-blue-500 rounded" 
              />
              <span className="ml-2 text-sm">Sold</span>
              <span className="ml-auto bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Available</span>
            </label>
            <label className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-colors">
              <input 
                type="checkbox" 
                checked={saleStatus.includes('Not Sold')}
                onChange={(e) => updateSaleStatus('Not Sold', e.target.checked)}
                className="text-blue-600 focus:ring-blue-500 rounded" 
              />
              <span className="ml-2 text-sm">Not Sold</span>
              <span className="ml-auto bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">Available</span>
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
        
        {/* Location */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="material-icons text-blue-500 mr-2 text-sm">location_on</span>
            Buyer Location
          </h3>
          <select 
            value={buyerLocation || ''}
            onChange={(e) => setBuyerLocation(e.target.value || undefined)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value="">All Locations</option>
            <option value="US">United States</option>
            <option value="FL">Florida (FL)</option>
            <option value="CA">California (CA)</option>
            <option value="TX">Texas (TX)</option>
            <option value="NY">New York (NY)</option>
          </select>
        </div>
        
        {/* Auction Sites Toggle */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="material-icons text-blue-500 mr-2 text-sm">business</span>
            Auction Sites
          </h3>
          <div className="flex items-center space-x-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={window.location.pathname === '/'}
                onChange={() => window.location.href = '/'}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Copart</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={window.location.pathname === '/iaai'}
                onChange={() => window.location.href = '/iaai'}
                className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">IAAI</span>
            </label>
          </div>
        </div>

        <button 
          onClick={onApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm flex items-center justify-center"
        >
          <span className="material-icons mr-2 text-sm">filter_list</span>
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
