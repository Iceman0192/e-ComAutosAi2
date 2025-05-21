import { useState } from "react";
import { useDateRange, DateRangeType } from "./useDateRange";

export interface FilterState {
  vin: string;
  setVin: (vin: string) => void;
  dateRange: DateRangeType;
  setDateRange: (range: DateRangeType) => void;
  customDateStart: string;
  setCustomDateStart: (date: string) => void;
  customDateEnd: string;
  setCustomDateEnd: (date: string) => void;
  saleStatus: string[];
  setSaleStatus: (status: string[]) => void;
  priceMin: number | undefined;
  setPriceMin: (min: number | undefined) => void;
  priceMax: number | undefined;
  setPriceMax: (max: number | undefined) => void;
  buyerLocation: string | undefined;
  setBuyerLocation: (location: string | undefined) => void;
  sites: string[];
  setSites: (sites: string[]) => void;
}

export function useFilterState(): FilterState {
  // Set a default VIN for initial load
  const [vin, setVin] = useState<string>("3GNAXHEV2JS596331");
  
  // Date range
  const {
    dateRange,
    setDateRange,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd
  } = useDateRange();

  // Sale status
  const [saleStatus, setSaleStatus] = useState<string[]>(["Sold", "Not Sold"]);
  
  // Price range
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
  
  // Buyer location
  const [buyerLocation, setBuyerLocation] = useState<string | undefined>(undefined);
  
  // Sites
  const [sites, setSites] = useState<string[]>(["copart", "iaai", "manheim"]);

  return {
    vin,
    setVin,
    dateRange,
    setDateRange,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
    saleStatus,
    setSaleStatus,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    buyerLocation,
    setBuyerLocation,
    sites,
    setSites
  };
}
