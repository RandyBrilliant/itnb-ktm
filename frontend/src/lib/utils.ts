/**
 * Utility functions
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatAppDate, formatAppTime } from "@/lib/datetime"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | Date) => formatAppDate(date)

export const formatTime = (date: string | Date) => formatAppTime(date)

export const getTrendIndicator = (current: number, previous: number) => {
  if (current > previous) {
    return {
      direction: 'up' as const,
      percentage: Math.round(((current - previous) / previous) * 100),
    }
  } else if (current < previous) {
    return {
      direction: 'down' as const,
      percentage: Math.round(((previous - current) / previous) * 100),
    }
  }
  return {
    direction: 'neutral' as const,
    percentage: 0,
  }
}
