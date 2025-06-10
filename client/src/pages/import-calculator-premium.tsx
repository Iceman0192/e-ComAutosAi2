// client/src/pages/import-calculator-premium.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingUp, DollarSign, Ship, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CalculationResult {
  purchasePrice: number;
  auctionFees: number;
  transportationCost: number;
  customsDuty: number;
  clearanceFees: number;
  localTransport: number;
  totalCost: number;
  costPerUnit: number;
  recommendedSellPrice: number;
  estimatedProfit: number;
  profitMargin: number;
}

export default function ImportCalculatorPremium() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('single');
  
  // Single vehicle state
  const [vehiclePrice, setVehiclePrice] = useState('');
  const [auctionFee, setAuctionFee] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan');
  
  // Bulk calculation state
  const [bulkData, setBulkData] = useState('');
  const [bulkResults, setBulkResults] = useState<CalculationResult[]>([]);
  
  // Results
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const destinations = {
    'lagos': { name: 'Lagos, Nigeria', shippingCost: 1500, customsRate: 0.35 },
    'mombasa': { name: 'Mombasa, Kenya', shippingCost: 1800, customsRate: 0.25 },
    'durban': { name: 'Durban, South Africa', shippingCost: 2000, customsRate: 0.30 },
    'dubai': { name: 'Dubai, UAE', shippingCost: 1200, customsRate: 0.05 },
    'singapore': { name: 'Singapore', shippingCost: 2200, customsRate: 0.07 },
  };

  const calculateSingleVehicle = () => {
    if (!vehiclePrice || !destination) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(vehiclePrice);
    const fee = parseFloat(auctionFee) || price * 0.08;
    const dest = destinations[destination as keyof typeof destinations];
    
    const customsDuty = price * dest.customsRate;
    const clearanceFees = 500;
    const localTransport = 300;
    const totalCost = price + fee + dest.shippingCost + customsDuty + clearanceFees + localTransport;
    
    const newResult: CalculationResult = {
      purchasePrice: price,
      auctionFees: fee,
      transportationCost: dest.shippingCost,
      customsDuty,
      clearanceFees,
      localTransport,
      totalCost,
      costPerUnit: totalCost,
      recommendedSellPrice: totalCost * 1.25,
      estimatedProfit: totalCost * 0.25,
      profitMargin: 25,
    };
    
    setResult(newResult);
  };

  const calculateBulk = () => {
    try {
      const lines = bulkData.trim().split('\n');
      const results: CalculationResult[] = [];
      
      lines.forEach((line, index) => {
        const [price, destCode] = line.split(',').map(s => s.trim());
        if (price && destCode) {
          const vehiclePrice = parseFloat(price);
          const dest = destinations[destCode as keyof typeof destinations];
          
          if (dest) {
            const fee = vehiclePrice * 0.08;
            const customsDuty = vehiclePrice * dest.customsRate;
            const clearanceFees = 500;
            const localTransport = 300;
            const totalCost = vehiclePrice + fee + dest.shippingCost + customsDuty + clearanceFees + localTransport;
            
            results.push({
              purchasePrice: vehiclePrice,
              auctionFees: fee,
              transportationCost: dest.shippingCost,
              customsDuty,
              clearanceFees,
              localTransport,
              totalCost,
              costPerUnit: totalCost,
              recommendedSellPrice: totalCost * 1.25,
              estimatedProfit: totalCost * 0.25,
              profitMargin: 25,
            });
          }
        }
      });
      
      setBulkResults(results);
      toast({
        title: "Calculation Complete",
        description: `Calculated costs for ${results.length} vehicles`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid data format. Use: price,destination",
        variant: "destructive",
      });
    }
  };

  const exportResults = () => {
    const data = result ? [result] : bulkResults;
    if (data.length === 0) return;
    
    const csv = [
      ['Purchase Price', 'Auction Fees', 'Shipping', 'Customs', 'Total Cost', 'Recommended Price', 'Profit'],
      ...data.map(r => [
        r.purchasePrice,
        r.auctionFees,
        r.transportationCost,
        r.customsDuty,
        r.totalCost,
        r.recommendedSellPrice,
        r.estimatedProfit
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-calculations.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Cost Calculator</h1>
        <p className="text-muted-foreground">
          Calculate total landed costs for importing vehicles
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Vehicle</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Calculation</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>
                Enter vehicle purchase details for cost calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Purchase Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="15000"
                    value={vehiclePrice}
                    onChange={(e) => setVehiclePrice(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auction">Auction Fee (Optional)</Label>
                  <Input
                    id="auction"
                    type="number"
                    placeholder="Auto-calculated if empty"
                    value={auctionFee}
                    onChange={(e) => setAuctionFee(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Port</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(destinations).map(([key, dest]) => (
                        <SelectItem key={key} value={key}>
                          {dest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={calculateSingleVehicle} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Costs
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>
                  Total landed cost calculation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span>Purchase Price</span>
                    <span className="font-medium">${result.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Auction Fees</span>
                    <span className="font-medium">${result.auctionFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Ocean Freight</span>
                    <span className="font-medium">${result.transportationCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Customs Duty</span>
                    <span className="font-medium">${result.customsDuty.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Clearance & Documentation</span>
                    <span className="font-medium">${result.clearanceFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Local Transportation</span>
                    <span className="font-medium">${result.localTransport.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold">
                    <span>Total Landed Cost</span>
                    <span className="text-primary">${result.totalCost.toLocaleString()}</span>
                  </div>
                </div>
                
                <Alert className="mt-4">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Recommended selling price: ${result.recommendedSellPrice.toLocaleString()} 
                    (25% margin = ${result.estimatedProfit.toLocaleString()} profit)
                  </AlertDescription>
                </Alert>
                
                <Button onClick={exportResults} variant="outline" className="w-full mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  Export Calculation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Calculation</CardTitle>
              <CardDescription>
                Calculate costs for multiple vehicles at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-data">Vehicle Data</Label>
                <textarea
                  id="bulk-data"
                  className="w-full min-h-[200px] p-3 border rounded-md"
                  placeholder="Enter data in format: price,destination&#10;15000,lagos&#10;22000,dubai&#10;18500,mombasa"
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                />
              </div>
              
              <Button onClick={calculateBulk} className="w-full">
                <Calculator className="mr-2 h-4 w-4" />
                Calculate All
              </Button>
            </CardContent>
          </Card>

          {bulkResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bulk Results</CardTitle>
                <CardDescription>
                  Calculated costs for {bulkResults.length} vehicles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Purchase Price</th>
                        <th className="text-left p-2">Shipping</th>
                        <th className="text-left p-2">Total Cost</th>
                        <th className="text-left p-2">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((r, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">${r.purchasePrice.toLocaleString()}</td>
                          <td className="p-2">${r.transportationCost.toLocaleString()}</td>
                          <td className="p-2 font-medium">${r.totalCost.toLocaleString()}</td>
                          <td className="p-2 text-green-600">${r.estimatedProfit.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Button onClick={exportResults} variant="outline" className="w-full mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  Export All Results
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}