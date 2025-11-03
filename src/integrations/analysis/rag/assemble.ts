import type { AssemblePlan, RetrievedChunk } from '../type';
import { pickTopUnique } from './selectors';
import { roughCharCount, trimToChars } from '../utils/textkit';

export function assembleContext(
  buckets: Record<'project'|'context'|'sentiment'|'framework', RetrievedChunk[]>,
  plan: AssemblePlan
) {
  const chosen: RetrievedChunk[] = [
    ...pickTopUnique(buckets.project,   plan.perSourceK.project),
    ...pickTopUnique(buckets.context,   plan.perSourceK.context),
    ...pickTopUnique(buckets.sentiment, plan.perSourceK.sentiment),
    ...pickTopUnique(buckets.framework, plan.perSourceK.framework),
  ];

  let combined = chosen
    .map(c => `[#${c.source}:${c.id} | score=${c.score.toFixed(3)}]\n${c.content}`)
    .join('\n\n---\n\n');

  if (plan.maxChars && roughCharCount(combined) > plan.maxChars) {
    combined = trimToChars(combined, plan.maxChars);
  }

  return { contextText: combined, used: chosen };
}