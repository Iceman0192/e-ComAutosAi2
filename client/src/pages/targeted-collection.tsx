import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Search, Database, Calendar, Car, Download } from 'lucide-react';

const targetedCollectionSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().optional(),
  yearFrom: z.number().min(1990).max(2025),
  yearTo: z.number().min(1990).max(2025),
  saleDateFrom: z.string().min(1, 'Start date is required'),
  saleDateTo: z.string().min(1, 'End date is required'),
  site: z.string().optional()
}).refine(data => data.yearFrom <= data.yearTo, {
  message: "Year from must be less than or equal to year to",
  path: ["yearTo"]
}).refine(data => new Date(data.saleDateFrom) <= new Date(data.saleDateTo), {
  message: "Start date must be before or equal to end date",
  path: ["saleDateTo"]
});

type TargetedCollectionForm = z.infer<typeof targetedCollectionSchema>;

interface CollectionResult {
  site: number;
  siteName: string;
  recordsCollected: number;
  existingRecords?: number;
  error?: string;
}

interface CollectionResponse {
  totalRecordsCollected: number;
  criteria: {
    make: string;
    model: string;
    yearRange: string;
    dateRange: string;
  };
  results: CollectionResult[];
}

const makeOptions = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 
  'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Jeep', 'Dodge', 'Ram', 'Tesla',
  'Lexus', 'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Porsche', 'Subaru',
  'Mazda', 'Mitsubishi', 'Volvo', 'Jaguar', 'Land Rover', 'Mini', 'Fiat'
];

export default function TargetedCollectionPage() {
  const { toast } = useToast();
  const [isCollecting, setIsCollecting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [collectionResult, setCollectionResult] = useState<CollectionResponse | null>(null);
  const [existingDataCheck, setExistingDataCheck] = useState<CollectionResponse | null>(null);

  const form = useForm<TargetedCollectionForm>({
    resolver: zodResolver(targetedCollectionSchema),
    defaultValues: {
      make: '',
      model: '',
      yearFrom: 2020,
      yearTo: 2025,
      saleDateFrom: '2025-06-01',
      saleDateTo: '2025-06-09',
      site: ''
    }
  });

  const checkExistingData = async (data: TargetedCollectionForm) => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/check-targeted-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          site: data.site ? parseInt(data.site) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check existing data');
      }

      const result = await response.json();
      if (result.success) {
        setExistingDataCheck(result.data);
      } else {
        throw new Error(result.error || 'Failed to check data');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const collectTargetedData = async (data: TargetedCollectionForm) => {
    setIsCollecting(true);
    setCollectionResult(null);
    
    try {
      const response = await fetch('/api/collect-targeted-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          site: data.site ? parseInt(data.site) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to collect data');
      }

      const result = await response.json();
      if (result.success) {
        setCollectionResult(result.data);
        toast({
          title: 'Collection Complete',
          description: `Successfully collected ${result.data.totalRecordsCollected} new records`
        });
      } else {
        throw new Error(result.error || 'Collection failed');
      }
    } catch (error: any) {
      toast({
        title: 'Collection Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const onSubmit = (data: TargetedCollectionForm) => {
    collectTargetedData(data);
  };

  const handleCheckData = () => {
    const formData = form.getValues();
    checkExistingData(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Targeted Data Collection</h1>
          <p className="text-gray-600">Collect specific auction data based on your search criteria</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Collection Parameters</span>
          </CardTitle>
          <CardDescription>
            Specify the exact criteria for collecting fresh auction data from Copart and IAAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4" />
                    <h3 className="text-lg font-semibold">Vehicle Information</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select make" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {makeOptions.map(make => (
                              <SelectItem key={make} value={make}>{make}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Camry, Accord, F-150" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="yearFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year From</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              min={1990}
                              max={2025}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year To</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              min={1990}
                              max={2025}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Date Range & Site Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <h3 className="text-lg font-semibold">Date Range & Source</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="saleDateFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Date From *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="saleDateTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Date To *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="site"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auction Site</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Both sites (default)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Both Copart & IAAI</SelectItem>
                            <SelectItem value="1">Copart Only</SelectItem>
                            <SelectItem value="2">IAAI Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckData}
                  disabled={isChecking || isCollecting}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>{isChecking ? 'Checking...' : 'Check Existing Data'}</span>
                </Button>

                <Button
                  type="submit"
                  disabled={isCollecting || isChecking}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{isCollecting ? 'Collecting...' : 'Collect Fresh Data'}</span>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Existing Data Check Results */}
      {existingDataCheck && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Data Check</CardTitle>
            <CardDescription>
              Current data availability for: {existingDataCheck.criteria.make} {existingDataCheck.criteria.model} 
              ({existingDataCheck.criteria.yearRange}) from {existingDataCheck.criteria.dateRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingDataCheck.results.map((result) => (
                <div key={result.site} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{result.siteName}</h4>
                    <Badge variant={result.existingRecords! > 0 ? "default" : "secondary"}>
                      {result.existingRecords} records
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {result.existingRecords! > 0 
                      ? `${result.existingRecords} existing records found for this criteria`
                      : 'No existing records - fresh collection recommended'
                    }
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Progress */}
      {isCollecting && (
        <Card>
          <CardHeader>
            <CardTitle>Collection in Progress</CardTitle>
            <CardDescription>Collecting fresh auction data from selected sources...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={50} className="w-full" />
              <p className="text-sm text-gray-600">Processing API requests and storing data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Results */}
      {collectionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <span>Collection Complete</span>
            </CardTitle>
            <CardDescription>
              Collected data for: {collectionResult.criteria.make} {collectionResult.criteria.model} 
              ({collectionResult.criteria.yearRange}) from {collectionResult.criteria.dateRange}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {collectionResult.totalRecordsCollected}
              </div>
              <p className="text-gray-600">Total new records collected</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collectionResult.results.map((result) => (
                <div key={result.site} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{result.siteName}</h4>
                    <Badge variant={result.recordsCollected > 0 ? "default" : "secondary"}>
                      {result.recordsCollected} new records
                    </Badge>
                  </div>
                  {result.error ? (
                    <p className="text-sm text-red-600">{result.error}</p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Successfully collected {result.recordsCollected} new auction records
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}