// Registry of system instructions (add more keys over time)
const SYSTEMS: Record<string, string> = {
  'assurance-analyst-v1': `
You are an assurance analyst for Australian Government digital programs.
Follow DTA DCA and DoF Gateway principles. Be precise and structured.
Return ONLY valid JSON according to the provided schema.
  `.trim(),
};

// Named export expected by index.ts
export function getSystem(id: string): string {
  return SYSTEMS[id] ?? SYSTEMS['assurance-analyst-v1'];
}

// Optional: export the union type of system IDs
export type SystemId = keyof typeof SYSTEMS;