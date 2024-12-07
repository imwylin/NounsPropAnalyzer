export type TimeRange = '7d' | '30d' | '90d' | '180d' | '1y' | 'all';

export const TIME_RANGES: Record<TimeRange, number> = {
  '7d': 7 * 24 * 60 * 60,
  '30d': 30 * 24 * 60 * 60,
  '90d': 90 * 24 * 60 * 60,
  '180d': 180 * 24 * 60 * 60,
  '1y': 365 * 24 * 60 * 60,
  'all': 0
}; 