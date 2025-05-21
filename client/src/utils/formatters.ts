/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'N/A';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number | undefined): string {
  if (value === undefined) return '0%';
  
  return `${Math.round(value)}%`;
}

/**
 * Format a trend percentage with +/- sign
 */
export function formatTrendPercentage(value: number | undefined): string {
  if (value === undefined) return '0%';
  
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Truncate a VIN to show only the first and last few characters
 */
export function truncateVin(vin: string): string {
  if (!vin || vin.length < 8) return vin;
  
  return `${vin.substring(0, 6)}...${vin.substring(vin.length - 4)}`;
}

/**
 * Calculate a date range based on a preset option
 */
export function calculateDateRange(range: string, customStart?: string, customEnd?: string): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (range) {
    case 'last3m':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'last6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case 'lasty':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'custom':
      if (customStart) {
        startDate = new Date(customStart);
      } else {
        startDate.setMonth(endDate.getMonth() - 3);
      }
      if (customEnd) {
        endDate.setTime(new Date(customEnd).getTime());
      }
      break;
  }
  
  return { startDate, endDate };
}