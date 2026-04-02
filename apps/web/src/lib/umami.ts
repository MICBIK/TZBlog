/**
 * Umami Analytics API 工具函数
 * 用于获取站点统计
 */

const UMAMI_BASE_URL = import.meta.env.UMAMI_BASE_URL || ''
const UMAMI_API_KEY = import.meta.env.UMAMI_API_KEY || ''

export interface UmamiStats {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
}

export interface DateRange {
  start: number
  end: number
}

export const EMPTY_UMAMI_STATS: UmamiStats = {
  pageviews: 0,
  visitors: 0,
  visits: 0,
  bounces: 0,
  totaltime: 0,
}

export function readMetricValue(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof value.value === 'number'
  ) {
    return value.value
  }

  return 0
}

export function normalizeUmamiStats(payload: unknown): UmamiStats {
  if (typeof payload !== 'object' || payload === null) {
    return EMPTY_UMAMI_STATS
  }

  const stats = payload as Record<string, unknown>

  return {
    pageviews: readMetricValue(stats.pageviews),
    visitors: readMetricValue(stats.visitors),
    visits: readMetricValue(stats.visits),
    bounces: readMetricValue(stats.bounces),
    totaltime: readMetricValue(stats.totaltime),
  }
}

/**
 * 获取 Umami 统计数据
 */
export async function getUmamiStats(
  websiteId: string,
  startAt: number,
  endAt: number,
): Promise<UmamiStats> {
  if (!UMAMI_BASE_URL || !UMAMI_API_KEY || !websiteId) {
    return EMPTY_UMAMI_STATS
  }

  try {
    const url = new URL(`${UMAMI_BASE_URL}/api/websites/${websiteId}/stats`)

    url.searchParams.set('startAt', String(startAt))
    url.searchParams.set('endAt', String(endAt))

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${UMAMI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      console.warn('Umami API request failed:', res.status, res.statusText)
      return EMPTY_UMAMI_STATS
    }

    return normalizeUmamiStats(await res.json())
  } catch (error) {
    console.error('Failed to fetch Umami stats:', error)
    return EMPTY_UMAMI_STATS
  }
}

/**
 * 获取今日时间范围（当天 0 点到现在）
 */
export function getTodayRange(): DateRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const end = now.getTime()
  return { start, end }
}

/**
 * 获取总计时间范围（建站至今）
 */
export function getAllTimeRange(): DateRange {
  return {
    start: 1672531200000, // 2023-01-01T00:00:00Z — 建站时间
    end: Date.now(),
  }
}
