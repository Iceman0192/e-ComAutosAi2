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
    setVin
  } = filterState;

  return (
    <div 
      className={`md:hidden fixed z-10 inset-x-0 top-16 bg-white shadow-md p-4 ${
        show ? 'block' : 'hidden'
      }`}
    >
      <div className="space-y-4">
        <h2 className="font-medium text-lg">Filters</h2>
        
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Date Range</label>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
          >
            <option value="last3m">Last 3 Months</option>
            <option value="last6m">Last 6 Months</option>
            <option value="lasty">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {dateRange === 'custom' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
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
        
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">VIN</label>
          <div className="relative">
            <span className="material-icons absolute left-3 top-2 text-neutral-500">search</span>
            <input 
              type="text" 
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Enter VIN" 
              className="pl-10 pr-4 py-2 w-full border border-neutral-300 rounded-md text-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setShow(false)} 
            className="bg-neutral-200 hover:bg-neutral-300 px-4 py-2 rounded-md text-sm transition-colors duration-200"
          >
            Cancel
          </button>
          <button 
            onClick={onApply}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
