import { Dispatch, SetStateAction } from "react";

interface AppHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  showFiltersOnMobile: boolean;
  setShowFiltersOnMobile: Dispatch<SetStateAction<boolean>>;
  make: string;
  setMake: (make: string) => void;
  model: string;
  setModel: (model: string) => void;
  vin: string;
  setVin: (vin: string) => void;
  auctionSite: 'copart' | 'iaai';
  setAuctionSite: (site: 'copart' | 'iaai') => void;
  onRefresh: () => void;
}

export default function AppHeader({
  sidebarOpen,
  setSidebarOpen,
  showFiltersOnMobile,
  setShowFiltersOnMobile,
  make,
  setMake,
  model,
  setModel,
  vin,
  setVin,
  auctionSite,
  setAuctionSite,
  onRefresh
}: AppHeaderProps) {
  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center h-auto py-3">
        <div className="flex items-center w-full md:w-auto mb-3 md:mb-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="lg:hidden mr-3 p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Toggle filters"
          >
            <span className="material-icons">tune</span>
          </button>
          <div className="flex items-center">
            <span className="material-icons text-blue-600 mr-2">bar_chart</span>
            <h1 className="text-xl font-semibold text-gray-800">APICAR Sales History</h1>
          </div>
          
          <button 
            onClick={() => setShowFiltersOnMobile(!showFiltersOnMobile)} 
            className="md:hidden ml-auto p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Show filters"
          >
            <span className="material-icons">filter_list</span>
          </button>
        </div>
        
        <div className="w-full md:w-auto">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="flex items-center w-full md:w-auto gap-2">
              {/* Make search field */}
              <div className="relative flex-1 md:flex-none">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">directions_car</span>
                <input 
                  type="text" 
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Make (Toyota)" 
                  className="w-full md:w-44 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              
              {/* Model search field */}
              <div className="relative flex-1 md:flex-none">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">straighten</span>
                <input 
                  type="text" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model (Tacoma)" 
                  className="w-full md:w-44 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center w-full md:w-auto gap-2 mt-2 md:mt-0">
              {/* Optional VIN search field */}
              <div className="relative flex-1 md:flex-none">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">search</span>
                <input 
                  type="text" 
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="VIN (optional)" 
                  className="w-full md:w-44 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              
              {/* Auction Site Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 border">
                <button
                  onClick={() => setAuctionSite('copart')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    auctionSite === 'copart'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Copart
                </button>
                <button
                  onClick={() => setAuctionSite('iaai')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    auctionSite === 'iaai'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  IAAI
                </button>
              </div>
              
              <button 
                onClick={onRefresh}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-colors duration-200 shadow-sm"
              >
                <span className="material-icons text-sm mr-2">search</span>
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
