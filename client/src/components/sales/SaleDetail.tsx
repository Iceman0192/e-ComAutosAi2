import { SaleHistoryResponse } from '@shared/schema';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SaleDetailProps {
  sale?: SaleHistoryResponse['sale_history'][0];
  onClose: () => void;
  averagePrice: number;
}

export default function SaleDetail({ sale, onClose, averagePrice }: SaleDetailProps) {
  if (!sale) return null;

  // Calculate price comparison stats
  const vsAverage = sale.purchase_price ? sale.purchase_price - averagePrice : 0;
  const vsAveragePercent = sale.purchase_price && averagePrice ? 
    ((sale.purchase_price - averagePrice) / averagePrice) * 100 : 0;
  
  // Mock previous sale data (in a real app, this would come from the API)
  const priorSale = { price: sale.purchase_price ? sale.purchase_price + 200 : 0 };
  const vsPrior = sale.purchase_price && priorSale.price ? 
    sale.purchase_price - priorSale.price : 0;
  const vsPriorPercent = sale.purchase_price && priorSale.price ? 
    ((sale.purchase_price - priorSale.price) / priorSale.price) * 100 : 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4 chart-animation">
      <div className="border-b border-neutral-200 pb-2 mb-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Sale Detail</h3>
          <button 
            onClick={onClose} 
            className="text-neutral-500 hover:text-neutral-700"
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Sale Information</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-neutral-500">Sale ID:</div>
              <div className="font-medium">{sale.id}</div>
              <div className="text-neutral-500">Date:</div>
              <div className="font-medium">{formatDate(sale.sale_date)}</div>
              <div className="text-neutral-500">Price:</div>
              <div className="font-medium">{formatCurrency(sale.purchase_price)}</div>
              <div className="text-neutral-500">Status:</div>
              <div>
                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                  sale.sale_status === 'Sold' 
                    ? 'bg-success-light/20 text-success' 
                    : 'bg-warning-light/20 text-warning-dark'
                }`}>
                  {sale.sale_status}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-neutral-500 mb-1">Buyer Information</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-neutral-500">Location:</div>
              <div className="font-medium">
                {sale.buyer_state ? `${sale.buyer_state}, ` : ''}
                {sale.buyer_country || 'Unknown'}
              </div>
              <div className="text-neutral-500">Buyer Type:</div>
              <div className="font-medium">{sale.buyer_type || 'Dealer'}</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-neutral-500 mb-1">Market Position</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-neutral-500">vs. Average:</div>
              <div className={`font-medium flex items-center ${
                vsAverage > 0 ? 'text-success' : vsAverage < 0 ? 'text-error' : 'text-warning'
              }`}>
                <span className="material-icons text-sm mr-1">
                  {vsAverage > 0 ? 'trending_up' : vsAverage < 0 ? 'trending_down' : 'remove'}
                </span>
                {formatCurrency(Math.abs(vsAverage))} ({vsAveragePercent > 0 ? '+' : ''}{vsAveragePercent.toFixed(1)}%)
              </div>
              <div className="text-neutral-500">vs. Prior Sale:</div>
              <div className={`font-medium flex items-center ${
                vsPrior > 0 ? 'text-success' : vsPrior < 0 ? 'text-error' : 'text-warning'
              }`}>
                <span className="material-icons text-sm mr-1">
                  {vsPrior > 0 ? 'trending_up' : vsPrior < 0 ? 'trending_down' : 'remove'}
                </span>
                {formatCurrency(Math.abs(vsPrior))} ({vsPriorPercent > 0 ? '+' : ''}{vsPriorPercent.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Auction Information</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-neutral-500">Site:</div>
              <div className="font-medium">{sale.base_site}</div>
              <div className="text-neutral-500">Location:</div>
              <div className="font-medium">{sale.auction_location || `${sale.buyer_state || 'Unknown'}`}</div>
              <div className="text-neutral-500">Lot #:</div>
              <div className="font-medium">{sale.lot_id}</div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-neutral-500 mb-1">Vehicle Condition</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-neutral-500">Mileage:</div>
              <div className="font-medium">
                {sale.vehicle_mileage ? `${sale.vehicle_mileage.toLocaleString()} mi` : 'Unknown'}
              </div>
              <div className="text-neutral-500">Damage:</div>
              <div className="font-medium">{sale.vehicle_damage || 'None'}</div>
              <div className="text-neutral-500">Title:</div>
              <div className="font-medium">{sale.vehicle_title || 'Clean'}</div>
              <div className="text-neutral-500">Keys:</div>
              <div className="font-medium">{sale.vehicle_has_keys ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-2 mt-4">
            <button className="bg-neutral-200 hover:bg-neutral-300 px-3 py-1.5 rounded text-sm flex items-center">
              <span className="material-icons text-sm mr-1">history</span>
              View Prior Sales
            </button>
            <button className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded text-sm flex items-center">
              <span className="material-icons text-sm mr-1">insert_drive_file</span>
              Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
