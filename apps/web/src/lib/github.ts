/**
 * GitHub API 工具函数
 * 用于获取贡献日历和仓库统计
 */

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN || ''

export interface ContributionDay {
  date: string
  count: number
  level: string
}

export interface ContributionCalendar {
  totalContributions: number
  weeks: Array<{
    contributionDays: ContributionDay[]
  }>
}

export interface RepoStats {
  name: string
  description: string
  stargazers_count: number
  language: string | null
  html_url: string
  updated_at: string
}

export interface PinnedRepo {
  owner: string
  repo: string
}

export const EMPTY_CONTRIBUTION_CALENDAR: ContributionCalendar = {
  totalContributions: 0,
  weeks: [],
}

function createRepoFallback(owner: string, repo: string): RepoStats {
  return {
    name: repo,
    description: '项目数据暂不可用',
    stargazers_count: 0,
    language: null,
    html_url: `https://github.com/${owner}/${repo}`,
    updated_at: '',
  }
}

/**
 * 通过 GitHub GraphQL API 获取贡献日历数据
 */
export async function getContributionCalendar(username: string): Promise<ContributionCalendar> {
  if (!GITHUB_TOKEN) {
    return EMPTY_CONTRIBUTION_CALENDAR
  }

  const query = `
    query GetUserContributions($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    })

    if (!res.ok) {
      console.warn('GitHub GraphQL API request failed:', res.status, res.statusText)
      return EMPTY_CONTRIBUTION_CALENDAR
    }

    const json = await res.json()

    if (json.errors) {
      console.warn('GitHub GraphQL API errors:', json.errors)
      return EMPTY_CONTRIBUTION_CALENDAR
    }

    const data = json.data?.user?.contributionsCollection?.contributionCalendar

    if (!data) {
      return EMPTY_CONTRIBUTION_CALENDAR
    }

    return {
      totalContributions: data.totalContributions,
      weeks: data.weeks.map((week: { contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: string }> }) => ({
        contributionDays: week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
          level: day.contributionLevel,
        })),
      })),
    }
  } catch (error) {
    console.error('Failed to fetch contribution calendar:', error)
    return EMPTY_CONTRIBUTION_CALENDAR
  }
}

/**
 * 获取单个仓库统计信息
 */
async function getRepoStats(owner: string, repo: string): Promise<RepoStats> {
  const url = `https://api.github.com/repos/${owner}/${repo}`
  const headers: HeadersInit = {}

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`
  }

  try {
    const res = await fetch(url, { headers })

    if (!res.ok) {
      console.warn(`GitHub API request failed for ${owner}/${repo}:`, res.status, res.statusText)
      return createRepoFallback(owner, repo)
    }

    const data = await res.json()

    return {
      name: data.name || repo,
      description: data.description || '项目数据暂不可用',
      stargazers_count: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
      language: data.language || null,
      html_url: data.html_url || `https://github.com/${owner}/${repo}`,
      updated_at: data.updated_at || '',
    }
  } catch (error) {
    console.error(`Failed to fetch repo stats for ${owner}/${repo}:`, error)
    return createRepoFallback(owner, repo)
  }
}

/**
 * 批量获取仓库统计信息（带速率限制处理）
 */
export async function getReposStats(repos: PinnedRepo[]): Promise<RepoStats[]> {
  return Promise.all(repos.map((r) => getRepoStats(r.owner, r.repo)))
}
