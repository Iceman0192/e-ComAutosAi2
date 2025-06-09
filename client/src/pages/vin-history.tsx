import { useState } from "react";
import { Search, History, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface VINHistoryEntry {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  auctionDate: string;
  soldPrice: number;
  location: string;
  condition: string;
  mileage: number;
  source: 'copart' | 'iaai';
}

export default function VINHistory() {
  const { user, hasPermission } = useAuth();
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VINHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canAccessVINHistory = hasPermission('FRESH_SALES_HISTORY');

  const handleSearch = async () => {
    if (!vin || vin.length < 17) {
      setError("Please enter a valid 17-character VIN");
      return;
    }

    if (!canAccessVINHistory) {
      setError("VIN History requires Basic plan or higher");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/vin-history/${vin}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch VIN history');
      }

      const data = await response.json();
      setHistory(data.history || []);
      
      if (data.history.length === 0) {
        setError("No auction history found for this VIN");
      }
    } catch (err) {
      setError("Failed to fetch VIN history. Please try again.");
      console.error('VIN history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (history.length === 0) return;

    const csv = [
      ['VIN', 'Make', 'Model', 'Year', 'Auction Date', 'Sold Price', 'Location', 'Condition', 'Mileage', 'Source'],
      ...history.map(entry => [
        entry.vin,
        entry.make,
        entry.model,
        entry.year,
        entry.auctionDate,
        entry.soldPrice,
        entry.location,
        entry.condition,
        entry.mileage,
        entry.source
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vin-history-${vin}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">VIN History</h1>
        <p className="text-muted-foreground">
          Search complete auction history for any VIN across all platforms
        </p>
      </div>

      {!canAccessVINHistory && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            VIN History requires a Basic plan or higher. You're currently on the {user?.role || 'Freemium'} plan.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Search VIN History</CardTitle>
          <CardDescription>
            Enter a VIN to see its complete auction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter 17-character VIN"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
              className="font-mono"
              disabled={!canAccessVINHistory || loading}
            />
            <Button 
              onClick={handleSearch} 
              disabled={!canAccessVINHistory || loading || vin.length !== 17}
            >
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Auction History</CardTitle>
              <CardDescription>
                Found {history.length} auction records for VIN: {vin}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Make/Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.auctionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.source === 'copart' ? 'default' : 'secondary'}>
                          {entry.source.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.make} {entry.model}</TableCell>
                      <TableCell>{entry.year}</TableCell>
                      <TableCell>{entry.mileage.toLocaleString()}</TableCell>
                      <TableCell>{entry.condition}</TableCell>
                      <TableCell>{entry.location}</TableCell>
                      <TableCell>${entry.soldPrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}