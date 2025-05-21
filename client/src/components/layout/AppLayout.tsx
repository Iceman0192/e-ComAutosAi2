import { useState, ReactNode } from "react";
import AppHeader from "./AppHeader";
import FilterSidebar from "./FilterSidebar";
import MobileFilters from "./MobileFilters";
import { FilterState } from "@/hooks/useFilterState";

interface AppLayoutProps {
  children: ReactNode;
  filterState: FilterState;
  onRefresh: () => void;
}

export default function AppLayout({ children, filterState, onRefresh }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFiltersOnMobile, setShowFiltersOnMobile] = useState(false);
  
  return (
    <div className="bg-neutral-100 font-sans text-neutral-900 min-h-screen">
      {/* Header */}
      <AppHeader 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showFiltersOnMobile={showFiltersOnMobile}
        setShowFiltersOnMobile={setShowFiltersOnMobile}
        make={filterState.make}
        setMake={filterState.setMake}
        model={filterState.model}
        setModel={filterState.setModel}
        vin={filterState.vin}
        setVin={filterState.setVin}
        onRefresh={onRefresh}
      />
      
      {/* Mobile Filters Drawer */}
      <MobileFilters 
        show={showFiltersOnMobile} 
        setShow={setShowFiltersOnMobile}
        filterState={filterState}
        onApply={() => {
          onRefresh();
          setShowFiltersOnMobile(false);
        }}
      />
      
      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Sidebar / Filters Panel */}
          <FilterSidebar 
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            filterState={filterState}
            onApply={onRefresh}
          />
          
          {/* Main content */}
          <main className="lg:col-span-9 space-y-6 mt-6 lg:mt-0">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile VIN search and refresh (fixed at bottom on mobile) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-3 flex items-center space-x-2 z-10">
        <div className="relative flex-1">
          <span className="material-icons absolute left-3 top-2.5 text-neutral-500">search</span>
          <input 
            type="text" 
            value={filterState.vin}
            onChange={(e) => filterState.setVin(e.target.value)}
            placeholder="Enter VIN" 
            className="pl-10 pr-4 py-2 w-full border border-neutral-300 rounded-md text-sm focus:ring-primary focus:border-primary"
          />
        </div>
        <button 
          onClick={onRefresh}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm flex items-center transition-colors duration-200"
        >
          <span className="material-icons text-sm mr-1">refresh</span>
          Refresh
        </button>
      </div>
    </div>
  );
}
