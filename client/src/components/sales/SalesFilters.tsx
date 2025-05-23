import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronDown, X, Search } from 'lucide-react';

interface FilterState {
  priceMin: string;
  priceMax: string;
  mileageMin: string;
  mileageMax: string;
  yearMin: string;
  yearMax: string;
  damageType: string;
  saleStatus: string;
  location: string;
  transmission: string;
  fuelType: string;
  driveType: string;
  titleType: string;
  color: string;
}

interface SalesFiltersProps {
  onApplyFilters: (filters: FilterState) => void;
  onClearFilters: () => void;
  salesData: any[];
  platform: 'copart' | 'iaai';
}

export default function SalesFilters({ onApplyFilters, onClearFilters, salesData, platform }: SalesFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    priceMin: '',
    priceMax: '',
    mileageMin: '',
    mileageMax: '',
    yearMin: '',
    yearMax: '',
    damageType: '',
    saleStatus: '',
    location: '',
    transmission: '',
    fuelType: '',
    driveType: '',
    titleType: '',
    color: ''
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Extract unique values from sales data for filter options
  const getUniqueValues = (field: string) => {
    const values = salesData
      .map(sale => sale[field])
      .filter(value => value && value !== 'Unknown' && value !== '')
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return values;
  };

  const damageTypes = getUniqueValues('vehicle_damage');
  const locations = getUniqueValues('auction_location');
  const transmissions = getUniqueValues('transmission');
  const fuelTypes = getUniqueValues('fuel');
  const driveTypes = getUniqueValues('drive');
  const titleTypes = getUniqueValues('vehicle_title');
  const colors = getUniqueValues('color');

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Count active filters
    const count = Object.values(newFilters).filter(v => v !== '').length;
    setActiveFiltersCount(count);
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const emptyFilters = Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: '' }), {} as FilterState);
    setFilters(emptyFilters);
    setActiveFiltersCount(0);
    onClearFilters();
  };

  const platformColor = platform === 'copart' ? 'blue' : 'red';
  const platformName = platform === 'copart' ? 'Copart' : 'IAAI';

  return (
    <div className="w-full">
      {/* Mobile-First Collapsible Header */}
      <Card className="mb-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className={`h-5 w-5 text-${platformColor}-600`} />
                  <CardTitle className="text-lg">
                    {platformName} Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount} active
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price Range
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={filters.priceMin}
                      onChange={(e) => updateFilter('priceMin', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={filters.priceMax}
                      onChange={(e) => updateFilter('priceMax', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Mileage Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mileage Range
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min mileage"
                      value={filters.mileageMin}
                      onChange={(e) => updateFilter('mileageMin', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max mileage"
                      value={filters.mileageMax}
                      onChange={(e) => updateFilter('mileageMax', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Year Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Year Range
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min year"
                      value={filters.yearMin}
                      onChange={(e) => updateFilter('yearMin', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max year"
                      value={filters.yearMax}
                      onChange={(e) => updateFilter('yearMax', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Grid for Select Filters - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Damage Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Damage Type
                  </Label>
                  <Select value={filters.damageType} onValueChange={(value) => updateFilter('damageType', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All damage types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All damage types</SelectItem>
                      {damageTypes.map((damage) => (
                        <SelectItem key={damage} value={damage}>{damage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sale Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sale Status
                  </Label>
                  <Select value={filters.saleStatus} onValueChange={(value) => updateFilter('saleStatus', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                      <SelectItem value="ON APPROVAL">On Approval</SelectItem>
                      <SelectItem value="Not sold">Not Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title Type
                  </Label>
                  <Select value={filters.titleType} onValueChange={(value) => updateFilter('titleType', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All title types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All title types</SelectItem>
                      {titleTypes.map((title) => (
                        <SelectItem key={title} value={title}>{title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transmission */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transmission
                  </Label>
                  <Select value={filters.transmission} onValueChange={(value) => updateFilter('transmission', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All transmissions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All transmissions</SelectItem>
                      {transmissions.map((transmission) => (
                        <SelectItem key={transmission} value={transmission}>{transmission}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fuel Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fuel Type
                  </Label>
                  <Select value={filters.fuelType} onValueChange={(value) => updateFilter('fuelType', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All fuel types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All fuel types</SelectItem>
                      {fuelTypes.map((fuel) => (
                        <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Drive Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Drive Type
                  </Label>
                  <Select value={filters.driveType} onValueChange={(value) => updateFilter('driveType', value)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All drive types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All drive types</SelectItem>
                      {driveTypes.map((drive) => (
                        <SelectItem key={drive} value={drive}>{drive}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location - Full Width */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </Label>
                <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button 
                  onClick={handleApplyFilters}
                  className={`flex-1 bg-${platformColor}-600 hover:bg-${platformColor}-700 text-white`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button 
                  onClick={handleClearFilters}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              {/* Active Filters Summary */}
              {activeFiltersCount > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>{activeFiltersCount}</strong> filter{activeFiltersCount !== 1 ? 's' : ''} active
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}