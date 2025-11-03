import { getSystem } from './templates/system';
import { buildPrompt } from './templates/prompts';
import { validateAndRepair } from './llm/structured';
import { DEFAULT_OUTPUT_SCHEMA } from './schemas/output';
import { generate } from './llm/llm';
import { ANALYSIS_CONFIG } from './config';

import { retrieveAll } from './rag/sources';
import { assembleContext } from './rag/assemble';

export async function orchestrate<T = any>(req: any) {
  // 1) Retrieve from 4 sources
  const plan = {
    ...ANALYSIS_CONFIG.defaultAssemble,
    ...(req.assemble ?? {})
  };
  const buckets = await retrieveAll(req.retrieval, plan.perSourceK);
  const { contextText, used } = assembleContext(buckets, plan);

  // 2) Build prompt
  const system = getSystem(req.systemId);
  const userPrompt = buildPrompt(req.promptId, req.userVars);

  const fullPrompt = `
[CONTEXT]
${contextText}

[INSTRUCTIONS]
${userPrompt}
`.trim();

  // 3) Call model + validate JSON
  const raw = await generate(system, fullPrompt, { json: true, temperature: 0.2 });
  const parsed = await validateAndRepair<T>(
    raw,
    DEFAULT_OUTPUT_SCHEMA,
    async (bad) => await generate(system, `Return valid JSON only. Fix this:\n${bad}`, { json: true, temperature: 0 })
  );

  return { output: parsed, rawText: raw, usedChunks: used };
}
