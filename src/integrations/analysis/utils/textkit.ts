export function roughCharCount(s: string) { return s.length; }
export function trimToChars(s: string, limit: number) { return s.slice(0, Math.max(0, limit)); }

// TEMP: prove this file loads (remove after debugging)
console.log('[utils/textkit] loaded');

export async function embed(_text: string): Promise<number[]> {
  return new Array(384).fill(0);
}