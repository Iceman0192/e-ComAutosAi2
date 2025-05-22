import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SalesTableProps {
  salesHistory: Array<{
    id: string;
    vin: string;
    lot_id?: number;
    sale_date: string;
    purchase_price?: number;
    sale_status: string;
    buyer_state?: string;
    buyer_country?: string;
    base_site: string;
  }>;
  selectedSaleId: string | null;
  onSelectSale: (id: string) => void;
}

type SortField = 'sale_date' | 'purchase_price' | 'buyer_state' | 'base_site' | 'sale_status';
type SortDirection = 'asc' | 'desc';

export default function SalesTable({ salesHistory, selectedSaleId, onSelectSale }: SalesTableProps) {
  const [sortField, setSortField] = useState<SortField>('sale_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Search filter
  const filteredSales = salesHistory.filter(sale => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (sale.buyer_state && sale.buyer_state.toLowerCase().includes(query)) ||
      (sale.buyer_country && sale.buyer_country.toLowerCase().includes(query)) ||
      (sale.base_site && sale.base_site.toLowerCase().includes(query)) ||
      (sale.sale_status && sale.sale_status.toLowerCase().includes(query)) ||
      (sale.id && sale.id.toLowerCase().includes(query))
    );
  });

  // Sort logic
  const sortedSales = [...filteredSales].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'sale_date':
        comparison = new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime();
        break;
      case 'purchase_price':
        comparison = (a.purchase_price || 0) - (b.purchase_price || 0);
        break;
      case 'buyer_state':
        comparison = (a.buyer_state || '').localeCompare(b.buyer_state || '');
        break;
      case 'base_site':
        comparison = (a.base_site || '').localeCompare(b.base_site || '');
        break;
      case 'sale_status':
        comparison = (a.sale_status || '').localeCompare(b.sale_status || '');
        break;
      default:
        comparison = new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime();
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = sortedSales.slice(startIndex, startIndex + itemsPerPage);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending when changing fields
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return 'swap_vert';
    return sortDirection === 'asc' ? 'north' : 'south';
  };

  return (
    <div className="p-4">
      <div className="chart-animation">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium">Sales Records</h3>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <div className="relative">
              <span className="material-icons absolute left-3 top-2 text-neutral-500 text-sm">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                placeholder="Search records" 
                className="pl-9 pr-4 py-1.5 border border-neutral-300 rounded text-sm w-48 focus:ring-primary focus:border-primary"
              />
            </div>
            <button className="bg-neutral-200 hover:bg-neutral-300 px-3 py-1.5 rounded text-sm">
              <span className="material-icons text-sm">file_download</span>
            </button>
          </div>
        </div>
        
        {/* Sales Records Table */}
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('sale_date')}
                  >
                    Sale Date
                    <span className="material-icons text-sm ml-1">{getSortIcon('sale_date')}</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('purchase_price')}
                  >
                    Sale Price
                    <span className="material-icons text-sm ml-1">{getSortIcon('purchase_price')}</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('buyer_state')}
                  >
                    Buyer Location
                    <span className="material-icons text-sm ml-1">{getSortIcon('buyer_state')}</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('base_site')}
                  >
                    Site
                    <span className="material-icons text-sm ml-1">{getSortIcon('base_site')}</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('sale_status')}
                  >
                    Status
                    <span className="material-icons text-sm ml-1">{getSortIcon('sale_status')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {paginatedSales.length > 0 ? (
                paginatedSales.map(sale => (
                  <tr 
                    key={sale.id}
                    onClick={() => onSelectSale(sale.id)} 
                    className={`hover:bg-neutral-50 cursor-pointer transition-colors duration-150 ${
                      selectedSaleId === sale.id ? 'bg-primary-light/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                      {formatDate(sale.sale_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {formatCurrency(sale.purchase_price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                      <div className="flex items-center">
                        <span className="mr-1">
                          {sale.buyer_state ? `${sale.buyer_state}, ` : ''}
                          {sale.buyer_country || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                      {sale.base_site}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sale.sale_status === 'Sold' 
                          ? 'bg-success-light/20 text-success' 
                          : 'bg-warning-light/20 text-warning-dark'
                      }`}>
                        {sale.sale_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                    No sales records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredSales.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              Showing <span className="font-medium">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSales.length)}</span> of <span className="font-medium">{filteredSales.length}</span> results
            </div>
            
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-white border border-neutral-300 rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-icons text-sm">chevron_left</span>
              </button>
              
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`border rounded-md px-3 py-1.5 text-sm ${
                      currentPage === pageNum 
                        ? 'bg-primary text-white border-primary hover:bg-primary-dark' 
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="bg-white border border-neutral-300 rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-icons text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
