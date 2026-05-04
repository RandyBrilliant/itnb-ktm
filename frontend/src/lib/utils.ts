/**
 * Utility functions
 */

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ")
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export const formatTime = (date: string | Date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

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
