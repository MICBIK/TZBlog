import { describe, expect, it } from 'vitest'
import {
  readMetricValue,
  normalizeUmamiStats,
  EMPTY_UMAMI_STATS,
  getTodayRange,
  getAllTimeRange,
} from '../../src/lib/umami'

describe('readMetricValue', () => {
  it('returns number directly', () => {
    expect(readMetricValue(42)).toBe(42)
  })

  it('extracts value from object', () => {
    expect(readMetricValue({ value: 100 })).toBe(100)
  })

  it('returns 0 for invalid input', () => {
    expect(readMetricValue('not a number')).toBe(0)
    expect(readMetricValue(null)).toBe(0)
    expect(readMetricValue(undefined)).toBe(0)
  })
})

describe('normalizeUmamiStats', () => {
  it('normalizes valid payload', () => {
    const result = normalizeUmamiStats({
      pageviews: 100, visitors: 50, visits: 60, bounces: 10, totaltime: 3000,
    })
    expect(result.pageviews).toBe(100)
    expect(result.visitors).toBe(50)
  })

  it('returns empty stats for null', () => {
    expect(normalizeUmamiStats(null)).toEqual(EMPTY_UMAMI_STATS)
  })

  it('returns zeros for missing fields', () => {
    const result = normalizeUmamiStats({})
    expect(result.pageviews).toBe(0)
    expect(result.visitors).toBe(0)
  })
})

describe('getTodayRange', () => {
  it('start is midnight today, end is approximately now', () => {
    const range = getTodayRange()
    const now = Date.now()
    const todayMidnight = new Date()
    todayMidnight.setHours(0, 0, 0, 0)

    expect(range.start).toBe(todayMidnight.getTime())
    expect(range.end).toBeLessThanOrEqual(now)
    expect(range.end).toBeGreaterThan(now - 1000)
  })
})

describe('getAllTimeRange', () => {
  it('start is 2023-01-01 epoch', () => {
    const range = getAllTimeRange()
    expect(range.start).toBe(1672531200000)
  })

  it('end is approximately now', () => {
    const range = getAllTimeRange()
    const now = Date.now()
    expect(range.end).toBeLessThanOrEqual(now)
    expect(range.end).toBeGreaterThan(now - 1000)
  })
})
