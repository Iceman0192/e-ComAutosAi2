import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(dateObj);
}

export function formatNumber(value: number | undefined, unit: string = ''): string {
  if (value === undefined) return 'N/A';
  
  return `${new Intl.NumberFormat('en-US').format(value)}${unit ? ' ' + unit : ''}`;
}

export function formatPercentage(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatTrendPercentage(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)}`;
}

export function calculateDateRange(range: string, customStart?: string, customEnd?: string): {
  startDate: Date;
  endDate: Date;
} {
  const today = new Date();
  let startDate: Date;
  
  switch (range) {
    case 'last3m':
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 3);
      break;
    case 'last6m':
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 6);
      break;
    case 'lasty':
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    case 'custom':
      if (customStart) {
        startDate = new Date(customStart);
      } else {
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
      }
      if (customEnd) {
        return { startDate, endDate: new Date(customEnd) };
      }
      break;
    default:
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 3);
  }
  
  return { startDate, endDate: today };
}

export function truncateVin(vin: string): string {
  if (!vin) return '';
  if (vin.length <= 8) return vin;
  return `${vin.substring(0, 4)}...${vin.substring(vin.length - 4)}`;
}
