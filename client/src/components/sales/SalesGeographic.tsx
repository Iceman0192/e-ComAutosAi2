import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import USMap from '@/components/ui/us-map';

interface GeographicData {
  state: string;
  count: number;
}

interface SalesGeographicProps {
  geographicData: GeographicData[];
}

export default function SalesGeographic({ geographicData }: SalesGeographicProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Calculate total sales for calculating percentages
  const totalSales = geographicData.reduce((sum, item) => sum + item.count, 0);
  
  // Get top states by count
  const topStates = [...geographicData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  
  // Find region counts
  const regionMap: Record<string, string[]> = {
    'Northeast': ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'],
    'Southeast': ['DE', 'MD', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'KY', 'TN', 'AL', 'MS', 'AR', 'LA'],
    'Midwest': ['OH', 'IN', 'MI', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
    'Southwest': ['TX', 'OK', 'NM', 'AZ'],
    'West': ['CO', 'WY', 'MT', 'ID', 'WA', 'OR', 'UT', 'NV', 'CA', 'AK', 'HI']
  };
  
  const regionCounts = Object.entries(regionMap).map(([region, states]) => {
    const count = geographicData
      .filter(item => states.includes(item.state))
      .reduce((sum, item) => sum + item.count, 0);
    return { region, count };
  }).sort((a, b) => b.count - a.count);
  
  const topRegion = regionCounts.length > 0 ? regionCounts[0] : { region: 'N/A', count: 0 };

  // Mock data for highest and lowest price states (in a real app this would come from the backend)
  const highestPriceState = { state: 'CA', avgPrice: 3650 };
  const lowestPriceState = { state: 'TX', avgPrice: 2950 };

  return (
    <div className="p-4">
      <div className="chart-animation">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium">Geographic Distribution</h3>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <button className="bg-neutral-200 hover:bg-neutral-300 px-3 py-1.5 rounded text-sm">
              <span className="material-icons text-sm">settings</span>
            </button>
            <button className="bg-neutral-200 hover:bg-neutral-300 px-3 py-1.5 rounded text-sm">
              <span className="material-icons text-sm">file_download</span>
            </button>
          </div>
        </div>
        
        {/* Map */}
        <div className="relative h-80 border border-neutral-200 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
            {geographicData.length > 0 ? (
              <>
                <USMap
                  data={geographicData}
                  onHover={setHoveredState}
                />
                
                {/* Legend */}
                <div className="absolute bottom-3 left-3 bg-white bg-opacity-80 p-2 rounded shadow-sm">
                  <div className="text-xs font-medium mb-1">Sales by State</div>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary-light rounded-full mr-1"></div>
                      <span>4-5</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary rounded-full mr-1"></div>
                      <span>2-3</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary-dark rounded-full mr-1"></div>
                      <span>1</span>
                    </div>
                  </div>
                </div>
                
                {/* Hover info */}
                {hoveredState && (
                  <div className="absolute top-3 right-3 bg-white p-2 rounded shadow-sm">
                    <div className="text-sm font-medium">{hoveredState}</div>
                    <div className="text-xs text-neutral-500">
                      {geographicData.find(item => item.state === hoveredState)?.count || 0} sales
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-500">
                No geographic data available for the selected period
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Top State</div>
            <div className="text-lg font-medium">
              {topStates.length > 0 ? topStates[0].state : 'N/A'}
            </div>
            <div className="text-xs text-neutral-500">
              {topStates.length > 0 ? (
                <>
                  {topStates[0].count} sales ({Math.round(topStates[0].count / totalSales * 100)}%)
                </>
              ) : 'N/A'}
            </div>
          </div>
          
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Top Region</div>
            <div className="text-lg font-medium">{topRegion.region}</div>
            <div className="text-xs text-neutral-500">
              {topRegion.count} sales ({Math.round(topRegion.count / totalSales * 100)}%)
            </div>
          </div>
          
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Highest Avg. Price</div>
            <div className="text-lg font-medium">{highestPriceState.state}</div>
            <div className="text-xs text-neutral-500">
              {formatCurrency(highestPriceState.avgPrice)} avg.
            </div>
          </div>
          
          <div className="border border-neutral-200 rounded p-3">
            <div className="text-xs text-neutral-500">Lowest Avg. Price</div>
            <div className="text-lg font-medium">{lowestPriceState.state}</div>
            <div className="text-xs text-neutral-500">
              {formatCurrency(lowestPriceState.avgPrice)} avg.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
