export interface MilkdownDocument {
  markdown: string;
}

const UNSAFE_URL_PREFIXES = ["blob:", "data:", "javascript:"];

export async function milkdownParse(markdown: string): Promise<MilkdownDocument> {
  return { markdown };
}

export async function milkdownSerialize(document: MilkdownDocument): Promise<string> {
  return document.markdown;
}

export function isSafeMediaUrl(url: string): boolean {
  if (typeof url !== "string" || url.length === 0) return false;
  const lowered = url.toLowerCase().trim();
  return !UNSAFE_URL_PREFIXES.some((prefix) => lowered.startsWith(prefix));
}
