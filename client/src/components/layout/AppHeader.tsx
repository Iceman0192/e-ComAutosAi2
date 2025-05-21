import { Dispatch, SetStateAction } from "react";

interface AppHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  showFiltersOnMobile: boolean;
  setShowFiltersOnMobile: Dispatch<SetStateAction<boolean>>;
  vin: string;
  setVin: (vin: string) => void;
  onRefresh: () => void;
}

export default function AppHeader({
  sidebarOpen,
  setSidebarOpen,
  showFiltersOnMobile,
  setShowFiltersOnMobile,
  vin,
  setVin,
  onRefresh
}: AppHeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="lg:hidden mr-2 p-2 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            <span className="material-icons">menu</span>
          </button>
          <div className="flex items-center">
            <span className="material-icons text-primary-dark mr-2">bar_chart</span>
            <h1 className="text-xl font-medium">APICAR Sales History</h1>
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => setShowFiltersOnMobile(!showFiltersOnMobile)} 
            className="md:hidden p-2 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            <span className="material-icons">filter_list</span>
          </button>
          <div className="hidden md:flex items-center space-x-2">
            {/* VIN search field */}
            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-neutral-500">search</span>
              <input 
                type="text" 
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="Enter VIN" 
                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-md text-sm focus:ring-primary focus:border-primary"
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
      </div>
    </header>
  );
}
