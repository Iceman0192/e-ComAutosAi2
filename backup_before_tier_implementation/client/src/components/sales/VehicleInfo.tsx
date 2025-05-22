import { Skeleton } from "@/components/ui/skeleton";
import { formatTrendPercentage } from "@/lib/utils";

interface VehicleInfoProps {
  vehicle?: {
    vin: string;
    make: string;
    model: string;
    year: number;
    trim?: string;
    mileage?: number;
    title_status?: string;
  };
  salesCount: number;
  priceTrend: number;
  isLoading: boolean;
}

export default function VehicleInfo({
  vehicle,
  salesCount,
  priceTrend,
  isLoading
}: VehicleInfoProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="mt-3 md:mt-0">
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="text-center py-4 text-neutral-500">
          No vehicle information available. Please enter a valid VIN.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''}
          </h2>
          <div className="flex items-center text-sm text-neutral-600 mt-1">
            <span>VIN: <span className="font-mono font-medium">{vehicle.vin}</span></span>
            {vehicle.mileage && (
              <>
                <span className="mx-2">|</span>
                <span>{vehicle.mileage.toLocaleString()} miles</span>
              </>
            )}
            {vehicle.title_status && (
              <>
                <span className="mx-2">|</span>
                <span>{vehicle.title_status} Title</span>
              </>
            )}
          </div>
        </div>
        <div className="mt-3 md:mt-0 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
          <div className="text-sm text-neutral-600">
            <span className="font-medium">{salesCount} sales</span> in selected period
          </div>
          {priceTrend !== 0 && (
            <div className={`flex items-center font-medium ${priceTrend >= 0 ? 'text-success' : 'text-error'}`}>
              <span className="material-icons text-sm">
                {priceTrend >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span className="ml-1">{formatTrendPercentage(priceTrend)} avg. price</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
