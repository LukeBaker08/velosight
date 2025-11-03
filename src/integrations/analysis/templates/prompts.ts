// src/integrations/analysis/templates/prompts.ts

// Simple prompt templates (expand later)
const PROMPTS: Record<string, (vars: Record<string, any>) => string> = {
  'risk-scan-v1': (v) => `
Task: Analyse risks for project "${v.projectName}".
User question: ${v.question}

Return ONLY JSON per schema. Do not add commentary outside JSON.
  `.trim(),
};

// Named export expected by index.ts
export function buildPrompt(id: string, vars: Record<string, any>): string {
  const tpl = PROMPTS[id];
  if (!tpl) throw new Error(`Unknown promptId: ${id}`);
  return tpl(vars);
}