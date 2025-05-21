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
      className={`lg:col-span-3 bg-white p-4 rounded-lg shadow-sm fixed lg:sticky top-20 h-[calc(100vh-5rem)] lg:h-[calc(100vh-7rem)] w-64 lg:w-auto overflow-y-auto lg:translate-x-0 transform transition-transform duration-300 ease-in-out z-10 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="space-y-6">
        <h2 className="font-medium text-lg flex items-center justify-between">
          <span>Filters</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden text-neutral-500 hover:text-neutral-700"
          >
            <span className="material-icons">close</span>
          </button>
        </h2>
        
        {/* Date Range */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Date Range</h3>
          <div className="space-y-1">
            <label className="flex items-center">
              <input 
                type="radio" 
                checked={dateRange === 'last3m'}
                onChange={() => setDateRange('last3m')}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Last 3 Months</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                checked={dateRange === 'last6m'}
                onChange={() => setDateRange('last6m')}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Last 6 Months</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                checked={dateRange === 'lasty'}
                onChange={() => setDateRange('lasty')}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Last Year</span>
            </label>
            <label className="flex items-center">
              <input 
                type="radio" 
                checked={dateRange === 'custom'}
                onChange={() => setDateRange('custom')}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Custom Range</span>
            </label>
            
            {dateRange === 'custom' && (
              <div className="pt-2 space-y-2">
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Sale Status */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Sale Status</h3>
          <div className="space-y-1">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={saleStatus.includes('Sold')}
                onChange={(e) => updateSaleStatus('Sold', e.target.checked)}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Sold</span>
            </label>
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={saleStatus.includes('Not Sold')}
                onChange={(e) => updateSaleStatus('Not Sold', e.target.checked)}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Not Sold</span>
            </label>
          </div>
        </div>
        
        {/* Price Range */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Min ($)</label>
              <input 
                type="number" 
                value={priceMin || ''}
                onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0" 
                className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Max ($)</label>
              <input 
                type="number" 
                value={priceMax || ''}
                onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="50000" 
                className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Buyer Location</h3>
          <select 
            value={buyerLocation || ''}
            onChange={(e) => setBuyerLocation(e.target.value || undefined)}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          >
            <option value="">All Locations</option>
            <option value="US">United States</option>
            <option value="FL">Florida (FL)</option>
            <option value="CA">California (CA)</option>
            <option value="TX">Texas (TX)</option>
            <option value="NY">New York (NY)</option>
          </select>
        </div>
        
        {/* Sites */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Auction Site</h3>
          <div className="space-y-1">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={sites.includes('copart')}
                onChange={(e) => updateSites('copart', e.target.checked)}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Copart</span>
            </label>
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={sites.includes('iaai')}
                onChange={(e) => updateSites('iaai', e.target.checked)}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">IAAI</span>
            </label>
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={sites.includes('manheim')}
                onChange={(e) => updateSites('manheim', e.target.checked)}
                className="text-primary focus:ring-primary" 
              />
              <span className="ml-2 text-sm">Manheim</span>
            </label>
          </div>
        </div>
        
        <button 
          onClick={onApply}
          className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
