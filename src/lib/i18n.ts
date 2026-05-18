export const SUPPORTED_LOCALES = ["zh", "en"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "zh"

// MVP: 写死返回默认；V3: 从 cookies/headers/URL 解析
export function getCurrentLocale(): Locale {
  return DEFAULT_LOCALE
}

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
