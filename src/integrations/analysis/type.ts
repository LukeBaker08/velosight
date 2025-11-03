export type RagSourceKey = 'project' | 'context' | 'sentiment' | 'framework';

export type RetrievedChunk = {
  id: string;
  score: number;
  content: string;
  source: RagSourceKey;
  metadata: Record<string, any>;
};

export type RetrievalParams = {
  query: string;
  k?: number;
  filters?: {
    projectId?: string;
    framework?: string;        // optional, if you tag frameworks
  };
};

export type AssemblePlan = {
  perSourceK: Record<RagSourceKey, number>; // e.g., {project:4, context:3, sentiment:2, framework:6}
  maxChars?: number; // crude budget; refine later
};

export type OrchestrateRequest = {
  systemId: string;        // key into system instructions registry
  promptId: string;        // key into user prompt templates
  userVars: Record<string, any>; // vars for prompt template
  retrieval: RetrievalParams;
  assemble?: Partial<AssemblePlan>;
};

export type OrchestrateResponse<T = any> = {
  output: T;                          // parsed & validated JSON
  rawText: string;                    // raw model text (for trace)
  usedChunks: RetrievedChunk[];       // citations/trace
};
