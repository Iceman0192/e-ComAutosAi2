import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Play, 
  Pause, 
  Search, 
  TrendingUp, 
  Calendar,
  Car,
  DollarSign,
  BarChart3,
  Clock,
  Zap,
  Target
} from 'lucide-react';

interface SalesRecord {
  id: string;
  make: string;
  model: string;
  year: number;
  sale_date: string;
  purchase_price: number;
  odometer: number;
  damage_pr: string;
  location: string;
  site: number;
  vin: string;
}

interface AutoCollectionStatus {
  isRunning: boolean;
  totalRecords: number;
  recordsToday: number;
  activeJobs: number;
  completionRate: number;
  avgRecordsPerHour: number;
  estimatedCompletion: string;
}

const POPULAR_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 
  'Hyundai', 'Kia', 'Jeep', 'Dodge', 'BMW',
  'Mercedes-Benz', 'Audi', 'Tesla', 'Porsche', 'Lexus'
];

export default function SalesHistory() {
  const [salesData, setSalesData] = useState<SalesRecord[]>([]);
  const [filteredData, setFilteredData] = useState<SalesRecord[]>([]);
  const [autoStatus, setAutoStatus] = useState<AutoCollectionStatus>({
    isRunning: false,
    totalRecords: 0,
    recordsToday: 0,
    activeJobs: 0,
    completionRate: 0,
    avgRecordsPerHour: 0,
    estimatedCompletion: 'N/A'
  });
  
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

  const fetchAutoCollectionStatus = async () => {
    try {
      const response = await fetch('/api/admin/auto-collection/status');
      if (response.ok) {
        const data = await response.json();
        setAutoStatus(data);
      }
    } catch (error) {
      console.error('Error fetching auto collection status:', error);
    }
  };

  const toggleAutoCollection = async () => {
    try {
      const endpoint = autoStatus.isRunning 
        ? '/api/admin/auto-collection/stop'
        : '/api/admin/auto-collection/start';
      
      const response = await fetch(endpoint, { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        toast({
          title: autoStatus.isRunning ? "Auto-Collection Stopped" : "Auto-Collection Started",
          description: result.message
        });
        fetchAutoCollectionStatus();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle auto-collection",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSalesData();
    fetchAutoCollectionStatus();
    
    const interval = setInterval(() => {
      fetchAutoCollectionStatus();
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              Sales History & Auto-Collection
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Comprehensive auction sales data with automated collection system
            </p>
          </div>
        </div>

        {/* Auto-Collection Control Panel */}
        <Card className="border-2 border-dashed border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500 text-white">
                <Zap className="w-5 h-5" />
              </div>
              Automated Data Collection System
              <Badge variant={autoStatus.isRunning ? "default" : "secondary"} className="ml-auto">
                {autoStatus.isRunning ? "ACTIVE" : "STOPPED"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Database className="w-4 h-4" />
                  Total Records
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(autoStatus.totalRecords)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  Today's Collection
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(autoStatus.recordsToday)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Target className="w-4 h-4" />
                  Active Jobs
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {autoStatus.activeJobs}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  Avg/Hour
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(autoStatus.avgRecordsPerHour)}
                </div>
              </div>
            </div>

            {/* Progress and Controls */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Collection Progress</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {autoStatus.completionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={autoStatus.completionRate} className="h-2" />
              </div>
              
              <Button 
                onClick={toggleAutoCollection}
                variant={autoStatus.isRunning ? "destructive" : "default"}
                className="min-w-[120px]"
              >
                {autoStatus.isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Auto
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Auto
                  </>
                )}
              </Button>
            </div>

            {autoStatus.isRunning && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Estimated completion: {autoStatus.estimatedCompletion}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter Sales Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search VIN, make, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
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
                  setPage(1);
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
              <BarChart3 className="w-5 h-5" />
              Recent Sales Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : salesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Vehicle</th>
                      <th className="text-left p-2">Sale Info</th>
                      <th className="text-left p-2">Details</th>
                      <th className="text-left p-2">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {record.year} {record.make} {record.model}
                            </div>
                            <div className="text-xs text-gray-500">
                              VIN: {record.vin.slice(-8)}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="font-medium text-green-600">
                              {formatCurrency(record.purchase_price)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(record.sale_date)}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="text-sm">
                              {formatNumber(record.odometer)} mi
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.damage_pr}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <div className="text-sm">{record.location}</div>
                            <Badge variant="outline" className="text-xs">
                              {record.site === 1 ? 'Copart' : 'IAAI'}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No sales data found. Start auto-collection to begin gathering data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}