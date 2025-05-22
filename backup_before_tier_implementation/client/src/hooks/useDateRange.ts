import { useState } from "react";
import { calculateDateRange } from "@/lib/utils";

export type DateRangeType = 'last3m' | 'last6m' | 'lasty' | 'custom';

export function useDateRange() {
  const [dateRange, setDateRange] = useState<DateRangeType>('last3m');
  const [customDateStart, setCustomDateStart] = useState<string>(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return threeMonthsAgo.toISOString().split('T')[0];
  });
  const [customDateEnd, setCustomDateEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Get actual date range based on selection
  const getDateRange = () => {
    return calculateDateRange(dateRange, customDateStart, customDateEnd);
  };

  return {
    dateRange,
    setDateRange,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
    getDateRange
  };
}
