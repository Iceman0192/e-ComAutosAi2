import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Car, 
  Calendar, 
  DollarSign, 
  MapPin, 
  ExternalLink,
  Filter,
  RefreshCw,
  TrendingUp,
  Database
} from 'lucide-react';

interface SalesRecord {
  vin: string;
  make: string;
  model: string;
  year: number;
  site: number;
  auction_date: string;
  purchase_price: number;
  lot_number: string;
  location: string;
  created_at: string;
}

const POPULAR_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 
  'Hyundai', 'Kia', 'Jeep', 'Dodge', 'BMW',
  'Mercedes-Benz', 'Audi', 'Tesla', 'Porsche', 'Lexus'
];

export default function SalesHistory() {
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [filteredData, setFilteredData] = useState<SalesRecord[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { toast } = useToast();

  const fetchSalesData = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(filterMake && { make: filterMake }),
        ...(filterSite && { site: filterSite })
      });

      const response = await fetch(`/api/sales-history?${params}`);
      if (response.ok) {
        const result = await response.json();
        setSalesData(result.data || []);
        setTotalPages(result.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [page, searchTerm, filterMake, filterSite]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSiteName = (site: number) => {
    return site === 1 ? 'Copart' : 'IAAI';
  };

  const getSiteBadgeColor = (site: number) => {
    return site === 1 ? 'bg-blue-500' : 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              Copart & IAAI Sales History
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Comprehensive auction sales data from both platforms
            </p>
          </div>
          <Button onClick={fetchSalesData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search VIN, make, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterMake} onValueChange={setFilterMake}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by make" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Makes</SelectItem>
                  {POPULAR_MAKES.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSite} onValueChange={setFilterSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sites</SelectItem>
                  <SelectItem value="1">Copart</SelectItem>
                  <SelectItem value="2">IAAI</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterMake('');
                  setFilterSite('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sales Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading sales data...
              </div>
            ) : salesData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sales records found matching your criteria.
              </div>
            ) : (
              <div className="space-y-4">
                {salesData.map((record, index) => (
                  <div key={`${record.vin}-${index}`} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Badge className={`${getSiteBadgeColor(record.site)} text-white`}>
                          {getSiteName(record.site)}
                        </Badge>
                        <div>
                          <div className="font-semibold text-lg">
                            {record.year} {record.make} {record.model}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            VIN: {record.vin} • Lot: {record.lot_number}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(record.purchase_price)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(record.auction_date)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {record.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}