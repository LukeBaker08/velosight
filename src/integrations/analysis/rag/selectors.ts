import type { RetrievedChunk } from '../type';

/** Top-K with simple de-dup by id, sorted by score desc */
export function pickTopUnique(chunks: RetrievedChunk[], limit: number) {
  const seen = new Set<string>();
  const out: RetrievedChunk[] = [];
  for (const c of [...chunks].sort((a,b)=>b.score-a.score)) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
      if (out.length >= limit) break;
    }
  }
  return out;
}
