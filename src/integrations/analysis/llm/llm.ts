export type LLMOptions = { temperature?: number; json?: boolean };

export async function generate(
  _system: string,
  _prompt: string,
  _opts: LLMOptions = {}
): Promise<string> {
  // For Phase 0: return a VALID, STRINGIFIED JSON payload
  return JSON.stringify({ status: 'stub', explanation: 'Wire LLM here' });
}